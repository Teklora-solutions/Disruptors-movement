import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../lib/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    JwtService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [JwtService, PrismaModule],
})
export class AuthModule {}
