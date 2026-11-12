import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { IngestionService } from './ingestion.service';
import { IngestionProcessor } from './ingestion.processor';
import { PrismaModule } from '../lib/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'feed-ingestion',
    }),
  ],
  providers: [IngestionService, IngestionProcessor],
  exports: [IngestionService],
})
export class IngestionModule {}
