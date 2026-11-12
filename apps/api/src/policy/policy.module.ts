import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PrismaModule } from '../lib/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
