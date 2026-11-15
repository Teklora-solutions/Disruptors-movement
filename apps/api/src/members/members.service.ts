import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { AuditService } from '../audit/audit.service';

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

  async updateMe(userId: string, updates: Partial<RegisterMemberDto>) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updates.name,
        memberProfile: updates
          ? {
              update: {
                county: updates.county,
                interests: updates.interests as any,
                skills: updates.skills as any,
              },
            }
          : undefined,
      },
      include: { memberProfile: true },
    });
    await this.audit.log({
      action: 'UPDATE_MEMBER',
      tableName: 'User',
      recordId: user.id,
      performedById: user.id,
      before: null,
      after: user,
    });
    return user;
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

