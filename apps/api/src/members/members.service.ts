import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { AuditService } from '../audit/audit.service';
import { PlatformRole } from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterMemberDto) {
    if (!dto.consentDataProcessing) {
      throw new BadRequestException('Data‑processing consent is required');
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        providerId: 'local', // placeholder for external auth flow
        provider: 'local',
        platformRole: PlatformRole.MEMBER,
        memberProfile: {
          create: {
            county: dto.county,
            interests: dto.interests ?? [],
            skills: dto.skills ?? [],
            consentMarketing: false,
            consentDataExport: false,
          },
        },
      },
    });
    // audit the registration
    await this.audit.log({
      action: 'REGISTER_MEMBER',
      tableName: 'User',
      recordId: user.id,
      performedById: user.id,
      after: user,
    });
    return { id: user.id, email: user.email };
  }

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
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@example.com`,
        name: null,
        providerId: null,
        provider: null,
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

