import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PlatformRole, Prisma } from '@prisma/client';
import { PrismaService } from '../lib/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from './jwt.service';
import { hashPassword, needsRehash, passwordFingerprint, verifyAgainstDummy, verifyPassword } from './password';
import { LoginDto, RegisterDto } from './dto/auth.dto';

/** On by default; EMAIL_VERIFICATION_REQUIRED=false turns it off. */
export const verificationRequired = () => process.env.EMAIL_VERIFICATION_REQUIRED?.trim().toLowerCase() !== 'false';

export type SessionUser = { id: string; email: string; name: string | null; platformRole: PlatformRole; passwordHash: string };

const INVALID_LINK = 'This link is invalid or has expired. Please request a new one.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * With verification on, a new and an existing email get the same answer
   * ("check your inbox"): the existing owner is emailed instead, so the form
   * cannot be used to find out who has an account.
   */
  async register(dto: RegisterDto): Promise<{ signedInUser: SessionUser | null }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) return this.handleExistingEmail(existing);

    const requireVerification = verificationRequired();
    const passwordHash = await hashPassword(dto.password);
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          provider: 'local',
          passwordHash,
          emailVerifiedAt: requireVerification ? null : new Date(),
          platformRole: PlatformRole.MEMBER,
          memberProfile: {
            create: {
              phone: dto.phone,
              county: dto.county,
              interests: dto.interests ?? [],
              skills: dto.skills ?? [],
              consentMarketing: dto.consentMarketing ?? false,
              consentDataExport: false,
            },
          },
          consents: {
            create: [{ purpose: 'data-processing' }, ...(dto.consentMarketing ? [{ purpose: 'marketing' }] : [])],
          },
        },
        omit: { passwordHash: false },
      });
    } catch (err) {
      // Two sign-ups for the same email racing each other: treat the loser as existing.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const raced = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (raced) return this.handleExistingEmail(raced);
      }
      throw err;
    }

    await this.audit.log({ action: 'REGISTER_MEMBER', tableName: 'User', recordId: user.id, performedById: user.id, after: user });

    if (requireVerification) {
      await this.mail.sendVerifyEmail(user, await this.verifyToken(user));
      return { signedInUser: null };
    }
    await this.mail.sendWelcome(user);
    return { signedInUser: user as SessionUser };
  }

  private async handleExistingEmail(user: { email: string; name: string | null }) {
    if (!verificationRequired()) {
      // Without verification the new member is signed straight in, so the
      // difference shows anyway; say it plainly.
      throw new ConflictException('An account with this email already exists. Sign in instead.');
    }
    await this.mail.sendAlreadyRegistered(user);
    return { signedInUser: null };
  }

  async login(dto: LoginDto): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email }, omit: { passwordHash: false } });
    const ok = user?.passwordHash ? await verifyPassword(dto.password, user.passwordHash) : await verifyAgainstDummy(dto.password);
    if (!user?.passwordHash || !ok) throw new UnauthorizedException('Incorrect email or password.');
    if (verificationRequired() && !user.emailVerifiedAt) {
      throw new ForbiddenException({ statusCode: 403, code: 'email_not_verified', message: 'Please confirm your email first. Check your inbox for the link.' });
    }
    if (needsRehash(user.passwordHash)) {
      // The hashing cost changed since this password was set: upgrade it now,
      // while we have the plain password. The session fingerprint follows the
      // new hash, so other sessions are signed out, as after any password change.
      return (await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(dto.password) },
        omit: { passwordHash: false },
      })) as SessionUser;
    }
    return user as SessionUser;
  }

  /** Returns the member to sign in, or null for a bad/expired link. */
  async verifyEmail(token: string): Promise<SessionUser | null> {
    const payload = await this.jwt.verifyLink(token, 'verify-email');
    if (!payload) return null;
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, omit: { passwordHash: false } });
    // Bound to the address it was sent to, in case the email has changed since.
    if (!user?.passwordHash || user.email !== payload.email) return null;
    if (!user.emailVerifiedAt) {
      await this.prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
      await this.audit.log({ action: 'VERIFY_EMAIL', tableName: 'User', recordId: user.id, performedById: user.id });
      await this.mail.sendWelcome(user);
    }
    return user as SessionUser;
  }

  /** Always succeeds from the caller's point of view (no account enumeration). */
  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
    if (user?.passwordHash && !user.emailVerifiedAt) {
      await this.mail.sendVerifyEmail(user, await this.verifyToken(user));
    }
  }

  /** Always succeeds from the caller's point of view (no account enumeration). */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
    if (!user?.passwordHash) return;
    // fp binds the link to the current password: once it is used (or the
    // password changes any other way), the link stops working.
    const token = await this.jwt.signLink('reset-password', user.id, { fp: passwordFingerprint(user.passwordHash) }, '1h');
    await this.mail.sendResetPassword(user, token);
  }

  async resetPassword(token: string, password: string): Promise<SessionUser> {
    const payload = await this.jwt.verifyLink(token, 'reset-password');
    if (!payload) throw new BadRequestException(INVALID_LINK);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, omit: { passwordHash: false } });
    if (!user?.passwordHash || payload.fp !== passwordFingerprint(user.passwordHash)) {
      throw new BadRequestException(INVALID_LINK);
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      // Opening a link sent to the inbox also proves the address.
      data: { passwordHash: await hashPassword(password), emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
      omit: { passwordHash: false },
    });
    await this.audit.log({ action: 'RESET_PASSWORD', tableName: 'User', recordId: user.id, performedById: user.id });
    this.logger.log(`password reset for user ${user.id}`);
    return updated as SessionUser;
  }

  sessionToken(user: SessionUser): Promise<string> {
    return this.jwt.signSession(user.id, passwordFingerprint(user.passwordHash));
  }

  private verifyToken(user: { id: string; email: string }) {
    return this.jwt.signLink('verify-email', user.id, { email: user.email }, '24h');
  }
}

/** What the browser gets back about the signed-in member. */
export const publicUser = (u: SessionUser) => ({ id: u.id, email: u.email, name: u.name, platformRole: u.platformRole });
