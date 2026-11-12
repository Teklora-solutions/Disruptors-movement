import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { PlatformRole } from '@prisma/client';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async isPlatformAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user?.platformRole === PlatformRole.SUPER_ADMIN || user?.platformRole === PlatformRole.MOVEMENT_ADMIN;
  }

  async canManageOrg(userId: string, orgId: string): Promise<boolean> {
    const membership = await this.prisma.orgMembership.findFirst({
      where: { userId, organisationId: orgId },
    });
    if (!membership) return false;
    return (
      membership.role === PlatformRole.SUPER_ADMIN ||
      membership.role === PlatformRole.MOVEMENT_ADMIN ||
      membership.role === PlatformRole.ORG_ADMIN
    );
  }

  async canPublish(userId: string, orgId: string): Promise<boolean> {
    // org admins, movement admins, super admins can publish directly
    const membership = await this.prisma.orgMembership.findFirst({
      where: { userId, organisationId: orgId },
    });
    if (!membership) return false;
    return (
      membership.role === PlatformRole.SUPER_ADMIN ||
      membership.role === PlatformRole.MOVEMENT_ADMIN ||
      membership.role === PlatformRole.ORG_ADMIN
    );
  }
}

