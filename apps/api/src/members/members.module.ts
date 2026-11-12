import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { AuditModule } from '../audit/audit.module';
import { PolicyModule } from '../policy/policy.module';

@Module({
  imports: [AuditModule, PolicyModule],
  providers: [MembersService],
  controllers: [MembersController],
})
export class MembersModule {}

