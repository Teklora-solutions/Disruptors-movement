import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from './jwt.service';
import { PUBLIC_KEY } from './public.decorator';
import { PrismaService } from '../lib/prisma.service';
import { readCookie, SESSION_COOKIE } from './cookies';
import { passwordFingerprint } from './password';

/**
 * Global guard: every route needs a signed-in member unless marked @Public().
 *
 * The session comes from the HttpOnly cookie a browser sends, or from an
 * `Authorization: Bearer` header (the admin layout's server-side fetch forwards
 * the cookie's value that way).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    const token =
      readCookie(request.headers.cookie, SESSION_COOKIE) ??
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);
    if (!token) throw new UnauthorizedException('Please sign in.');

    const payload = await this.jwtService.verifySession(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { orgMembership: true, memberProfile: true },
      omit: { passwordHash: false },
    });
    // A password change (reset) changes the fingerprint, which signs out every
    // other session holding the old one.
    if (!user?.passwordHash || payload.fp !== passwordFingerprint(user.passwordHash)) {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
    const { passwordHash: _omit, ...safeUser } = user;
    (request as any).user = safeUser;
    return true;
  }
}
