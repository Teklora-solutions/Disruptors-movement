import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { MembersModule } from './members/members.module';
import { PolicyModule } from './policy/policy.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { EventsModule } from './events/events.module';
import { FellowshipsModule } from './fellowships/fellowships.module';
import { ActivitiesModule } from './activities/activities.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { PaymentsModule } from './payments/payments.module';
import { BullModule } from '@nestjs/bull';
import { IngestionModule } from './ingestion/ingestion.module';
import { PrismaModule } from './lib/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    // @nestjs/throttler v6: ttl is in milliseconds
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    BullModule.forRoot({ redis: process.env.REDIS_URL ?? 'redis://localhost:6379' }),
    AuthModule,
    AuditModule,
    MembersModule,
    PolicyModule,
    OrganisationsModule,
    EventsModule,
    FellowshipsModule,
    ActivitiesModule,
    RegistrationsModule,
    PaymentsModule,
    IngestionModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
