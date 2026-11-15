import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * passwordHash is left out of every User query unless a query asks for it with
 * `omit: { passwordHash: false }` (only the auth code does). A user row can then
 * be returned, logged or audited anywhere without leaking the hash.
 */
const OMIT = { user: { passwordHash: true } } as const;

@Injectable()
export class PrismaService
  extends PrismaClient<{ omit: typeof OMIT }>
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ omit: OMIT });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
