import { Module } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { OrganisationsController } from './organisations.controller';
import { AuditModule } from '../audit/audit.module';
import { PolicyModule } from '../policy/policy.module';

@Module({
  imports: [AuditModule, PolicyModule],
  providers: [OrganisationsService],
  controllers: [OrganisationsController],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
