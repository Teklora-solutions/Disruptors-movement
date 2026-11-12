import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PolicyService } from '../policy/policy.service';
import { RegistrationStatus, EventStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RegistrationsService {
  private readonly holdMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: PolicyService,
    private readonly config: ConfigService,
  ) {
    // configurable via env, default 10 minutes
    this.holdMinutes = Number(this.config.get('REGISTRATION_HOLD_MINUTES')) || 10;
  }

  /** Idempotent registration for a user */
  async register(eventId: string, userId: string) {
    // Ensure the user can register for this org's event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organisation: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    const can = await this.policy.canManageOrg(userId, event.organisationId);
    if (!can) throw new ForbiddenException('Cannot register for this organisation\'s event');

    // Idempotency: existing registration?
    const existing = await this.prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) return existing;

    // Transaction with row lock
    return await this.prisma.$transaction(async (tx) => {
      // lock the event row to prevent race conditions
      await tx.$executeRawUnsafe(`SELECT 1 FROM "Event" WHERE id = $1 FOR UPDATE`, eventId);

      // Count confirmed + pending (still within hold)
      const now = new Date();
      const occupied = await tx.registration.count({
        where: {
          eventId,
          OR: [
            { status: RegistrationStatus.CONFIRMED },
            {
              status: RegistrationStatus.PENDING_PAYMENT,
              reservedUntil: { gte: now },
            },
          ],
        },
      });
      if (event.capacity && occupied >= event.capacity) {
        throw new BadRequestException('Event capacity reached');
      }

      const isFree = event.priceKes === 0;
      const registration = await tx.registration.create({
        data: {
          eventId,
          userId,
          status: isFree ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING_PAYMENT,
          ticketCode: isFree ? uuidv4().split('-')[0] : null,
          reservedUntil: isFree ? null : new Date(now.getTime() + this.holdMinutes * 60_000),
        },
      });

      await this.audit.log({
        action: 'REGISTER_EVENT',
        tableName: 'Registration',
        recordId: registration.id,
        performedById: userId,
        after: registration,
      });

      return registration;
    });
  }

  /** Cancel a registration (only the owner) */
  async cancel(regId: string, userId: string) {
    const reg = await this.prisma.registration.findUnique({ where: { id: regId } });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.userId !== userId) throw new ForbiddenException('Cannot cancel others\' registration');
    if (reg.status === RegistrationStatus.CANCELLED) return reg;

    const updated = await this.prisma.registration.update({
      where: { id: regId },
      data: { status: RegistrationStatus.CANCELLED },
    });
    await this.audit.log({
      action: 'CANCEL_REGISTRATION',
      tableName: 'Registration',
      recordId: regId,
      performedById: userId,
      before: reg,
      after: updated,
    });
    return updated;
  }

  /** List registrations for the authenticated user */
  async myRegistrations(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
      include: { event: true },
    });
  }

  /** Background job: expire holds older than reservedUntil */
  async expireHolds() {
    const now = new Date();
    const expired = await this.prisma.registration.updateMany({
      where: {
        status: RegistrationStatus.PENDING_PAYMENT,
        reservedUntil: { lt: now },
      },
      data: { status: RegistrationStatus.EXPIRED },
    });
    if (expired.count > 0) {
      // optional audit per registration – simplified to a single entry
      await this.audit.log({
        action: 'EXPIRE_REGISTRATION_HOLDS',
        tableName: 'Registration',
        recordId: '*',
        performedById: 'system',
        after: { expiredCount: expired.count },
      });
    }
  }
}

