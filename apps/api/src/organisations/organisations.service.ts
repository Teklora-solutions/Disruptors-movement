import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { CreateOrganisationDto, UpdateOrganisationDto } from './dto/organisation.dto';
import { AuditService } from '../audit/audit.service';
import { PolicyService } from '../policy/policy.service';
import { PlatformRole } from '@prisma/client';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: PolicyService,
  ) {}

  /** Public list with filters and pagination */
  async list(params: {
    slug?: string;
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = { deletedAt: null };
    if (params.slug) where.slug = params.slug;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.organisation.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 20,
      }),
      this.prisma.organisation.count({ where }),
    ]);
    return { items, total };
  }

  /** Admin create */
  async create(actorId: string, dto: CreateOrganisationDto) {
    // Only platform admins can create orgs
    const isAdmin = await this.policy.isPlatformAdmin(actorId);
    if (!isAdmin) throw new ForbiddenException('Only platform admins can create organisations');
    const org = await this.prisma.organisation.create({ data: dto });
    await this.audit.log({
      action: 'CREATE_ORG',
      tableName: 'Organisation',
      recordId: org.id,
      performedById: actorId,
      after: org,
    });
    return org;
  }

  /** Admin update */
  async update(actorId: string, orgId: string, dto: UpdateOrganisationDto) {
    const canManage = await this.policy.canManageOrg(actorId, orgId);
    if (!canManage) throw new ForbiddenException('Insufficient permissions to update this organisation');
    const before = await this.prisma.organisation.findUnique({ where: { id: orgId } });
    if (!before) throw new NotFoundException('Organisation not found');
    const org = await this.prisma.organisation.update({
      where: { id: orgId },
      data: dto,
    });
    await this.audit.log({
      action: 'UPDATE_ORG',
      tableName: 'Organisation',
      recordId: org.id,
      performedById: actorId,
      before,
      after: org,
    });
    return org;
  }

  /** Soft‑delete */
  async softDelete(actorId: string, orgId: string) {
    const canManage = await this.policy.canManageOrg(actorId, orgId);
    if (!canManage) throw new ForbiddenException('Insufficient permissions to delete this organisation');
    const before = await this.prisma.organisation.findUnique({ where: { id: orgId } });
    if (!before) throw new NotFoundException('Organisation not found');
    const org = await this.prisma.organisation.update({
      where: { id: orgId },
      data: { isActive: false, deletedAt: new Date() },
    });
    await this.audit.log({
      action: 'SOFT_DELETE_ORG',
      tableName: 'Organisation',
      recordId: org.id,
      performedById: actorId,
      before,
      after: org,
    });
    return { success: true };
  }

  /** Pending‑review queue – only platform admins can see */
  async pendingReview(actorId: string) {
    const isAdmin = await this.policy.isPlatformAdmin(actorId);
    if (!isAdmin) throw new ForbiddenException('Only platform admins can view pending organisations');
    // For organisations we treat `isActive = false` as pending creation (demo purpose)
    const pending = await this.prisma.organisation.findMany({
      where: { isActive: false, deletedAt: null },
    });
    return pending;
  }
}

