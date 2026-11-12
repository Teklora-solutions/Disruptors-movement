import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from './jwt.service';
import { PUBLIC_KEY } from './public.decorator';
import { PrismaService } from '../lib/prisma.service';

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
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }
    const token = authHeader.split(' ')[1];
    const payload = await this.jwtService.verify(token);
    // Load user with org memberships
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { orgMembership: true, memberProfile: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    // attach to request
    (request as any).user = user;
    return true;
  }
}

