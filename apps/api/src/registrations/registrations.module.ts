import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { AuditModule } from '../audit/audit.module';
import { PolicyModule } from '../policy/policy.module';

@Module({
  imports: [AuditModule, PolicyModule],
  providers: [RegistrationsService],
  controllers: [RegistrationsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
