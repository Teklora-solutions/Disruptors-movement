import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuditService } from '../audit/audit.service';
import { EventStatus, RegistrationStatus } from '@prisma/client';

/** Registrations that still hold a place. */
const ACTIVE = { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING_PAYMENT] };

const EVENT_SUMMARY = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  location: true,
  onlineUrl: true,
  priceKes: true,
  organisation: { select: { name: true, slug: true } },
} as const;

/** The profile fields that count towards "profile complete". */
const PROFILE_FIELDS: Array<{ label: string; filled: (u: any) => boolean }> = [
  { label: 'Name', filled: (u) => !!u.name },
  { label: 'Phone', filled: (u) => !!u.memberProfile?.phone },
  { label: 'County', filled: (u) => !!u.memberProfile?.county },
  { label: 'Interests', filled: (u) => (u.memberProfile?.interests?.length ?? 0) > 0 },
  { label: 'Skills', filled: (u) => (u.memberProfile?.skills?.length ?? 0) > 0 },
];

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    // omit sensitive fields
    const { providerId, provider, ...publicData } = user;
    return publicData;
  }

  /**
   * Everything the dashboard shows, in one round trip: the member, counts,
   * their next registered events and, when they have none, events to try.
   */
  async dashboard(userId: string) {
    const now = new Date();
    const upcomingWhere = {
      userId,
      status: ACTIVE,
      event: { startsAt: { gte: now }, deletedAt: null },
    };
    const [user, upcoming, upcomingCount, ticketCount, applicationCount] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, include: { memberProfile: true } }),
      this.prisma.registration.findMany({
        where: upcomingWhere,
        select: { id: true, status: true, ticketCode: true, event: { select: EVENT_SUMMARY } },
        orderBy: { event: { startsAt: 'asc' } },
        take: 5,
      }),
      this.prisma.registration.count({ where: upcomingWhere }),
      this.prisma.registration.count({ where: { ...upcomingWhere, status: RegistrationStatus.CONFIRMED } }),
      this.prisma.application.count({ where: { userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');

    const suggestions =
      upcoming.length > 0
        ? []
        : await this.prisma.event.findMany({
            where: { status: EventStatus.PUBLISHED, deletedAt: null, startsAt: { gte: now } },
            select: EVENT_SUMMARY,
            orderBy: { startsAt: 'asc' },
            take: 3,
          });

    const missing = PROFILE_FIELDS.filter((f) => !f.filled(user)).map((f) => f.label);
    return {
      member: { name: user.name, email: user.email, memberSince: user.createdAt },
      stats: {
        upcomingEvents: upcomingCount,
        tickets: ticketCount,
        applications: applicationCount,
        profileComplete: Math.round(((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length) * 100),
      },
      missingProfileFields: missing,
      upcoming,
      suggestions,
    };
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const clean = (xs?: string[]) => xs?.map((x) => x.trim()).filter(Boolean);
    const profile = {
      phone: dto.phone,
      county: dto.county,
      interests: clean(dto.interests),
      skills: clean(dto.skills),
      consentMarketing: dto.consentMarketing,
    };
    const before = await this.prisma.user.findUnique({ where: { id: userId }, include: { memberProfile: true } });
    if (!before) throw new NotFoundException('User not found');

    const user = await this.prisma.$transaction(async (tx) => {
      // Marketing consent is recorded as given/revoked, not just flipped.
      const wasSubscribed = before.memberProfile?.consentMarketing ?? false;
      if (dto.consentMarketing === true && !wasSubscribed) {
        await tx.consent.create({ data: { userId, purpose: 'marketing' } });
      } else if (dto.consentMarketing === false && wasSubscribed) {
        await tx.consent.updateMany({ where: { userId, purpose: 'marketing', revokedAt: null }, data: { revokedAt: new Date() } });
      }
      return tx.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          // upsert: members who joined before profiles existed have no row yet.
          memberProfile: {
            upsert: {
              create: { ...profile, interests: profile.interests ?? [], skills: profile.skills ?? [] },
              update: profile,
            },
          },
        },
        include: { memberProfile: true },
      });
    });
    await this.audit.log({
      action: 'UPDATE_MEMBER',
      tableName: 'User',
      recordId: user.id,
      performedById: user.id,
      before,
      after: user,
    });
    const { providerId, provider, ...publicData } = user;
    return publicData;
  }

  /**
   * Anonymise personal data while preserving related records (payments, registrations, etc.)
   */
  async anonymise(userId: string) {
    // updateMany: no error for a member who never had a profile row.
    await this.prisma.memberProfile.updateMany({ where: { userId }, data: { phone: null } });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@example.com`,
        name: null,
        providerId: null,
        provider: null,
        // No password: the account can never be signed into again.
        passwordHash: null,
        emailVerifiedAt: null,
        // keep role for audit purposes
      },
    });
    await this.audit.log({
      action: 'ANONYMISE_MEMBER',
      tableName: 'User',
      recordId: user.id,
      performedById: user.id,
      after: user,
    });
    return { success: true };
  }
}

