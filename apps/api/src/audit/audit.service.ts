import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../lib/prisma.service';

/** Convert any value (Dates, Prisma rows) into something Prisma accepts as Json. */
const toJson = (v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  v === undefined || v === null ? Prisma.JsonNull : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue);

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: {
    action: string;
    tableName: string;
    recordId: string;
    performedById: string;
    before?: unknown;
    after?: unknown;
  }) {
    await this.prisma.auditLog.create({
      data: {
        action: entry.action,
        tableName: entry.tableName,
        recordId: entry.recordId,
        performedById: entry.performedById,
        before: toJson(entry.before),
        after: toJson(entry.after),
      },
    });
  }
}
