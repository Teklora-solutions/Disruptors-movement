import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { CreateEventDto, UpdateEventDto, ListEventsQueryDto } from './dto/event.dto';
import { AuditService } from '../audit/audit.service';
import { PolicyService } from '../policy/policy.service';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: PolicyService,
  ) {}

  // Public list with filters, pagination, only published & non‑deleted
  async list(query: ListEventsQueryDto) {
    const where: any = { deletedAt: null, status: EventStatus.PUBLISHED };
    if (query.orgSlug) {
      const org = await this.prisma.organisation.findUnique({
        where: { slug: query.orgSlug },
        select: { id: true },
      });
      if (!org) return { items: [], total: 0 };
      where.organisationId = org.id;
    }
    if (query.isFree !== undefined) {
      where.priceKes = query.isFree ? 0 : { gt: 0 };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.startAfter) {
      where.startsAt = { gte: new Date(query.startAfter) };
    }
    if (query.endBefore) {
      where.endsAt = { lte: new Date(query.endBefore) };
    }
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip: query.skip ?? 0,
        take: query.take ?? 20,
        include: { organisation: true },
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total };
  }

  async create(actorId: string, orgId: string, dto: CreateEventDto) {
    // permission: canManageOrg
    const can = await this.policy.canManageOrg(actorId, orgId);
    if (!can) throw new ForbiddenException('Cannot create events for this organisation');

    // enforce price logic
    if (!dto.priceKes) dto.priceKes = 0;
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        organisationId: orgId,
        status: EventStatus.DRAFT,
        sourceUrl: dto.sourceUrl,
      },
    });
    await this.audit.log({
      action: 'CREATE_EVENT',
      tableName: 'Event',
      recordId: event.id,
      performedById: actorId,
      after: event,
    });
    return event;
  }

  async update(actorId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    const can = await this.policy.canManageOrg(actorId, event.organisationId);
    if (!can) throw new ForbiddenException('Cannot edit this event');
    const before = { ...event };
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: dto,
    });
    await this.audit.log({
      action: 'UPDATE_EVENT',
      tableName: 'Event',
      recordId: updated.id,
      performedById: actorId,
      before,
      after: updated,
    });
    return updated;
  }

  async softDelete(actorId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    const can = await this.policy.canManageOrg(actorId, event.organisationId);
    if (!can) throw new ForbiddenException('Cannot delete this event');
    const before = { ...event };
    const deleted = await this.prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
    await this.audit.log({
      action: 'SOFT_DELETE_EVENT',
      tableName: 'Event',
      recordId: deleted.id,
      performedById: actorId,
      before,
      after: deleted,
    });
    return { success: true };
  }

  async pendingReview(actorId: string) {
    const isAdmin = await this.policy.isPlatformAdmin(actorId);
    if (!isAdmin) throw new ForbiddenException('Only platform admins can view pending events');
    const pending = await this.prisma.event.findMany({
      where: { status: EventStatus.PENDING_REVIEW, deletedAt: null },
    });
    return pending;
  }

  async approve(actorId: string, eventId: string) {
    const isAdmin = await this.policy.isPlatformAdmin(actorId);
    if (!isAdmin) throw new ForbiddenException('Only platform admins can approve events');
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.PENDING_REVIEW) {
      throw new BadRequestException('Event is not pending review');
    }
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.PUBLISHED },
    });
    await this.audit.log({
      action: 'APPROVE_EVENT',
      tableName: 'Event',
      recordId: eventId,
      performedById: actorId,
      before: event,
      after: updated,
    });
    return updated;
  }
}
