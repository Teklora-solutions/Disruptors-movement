import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

export const INGEST_QUEUE = 'feed-ingestion';

@Injectable()
export class IngestionService implements OnModuleInit {
  constructor(@InjectQueue(INGEST_QUEUE) private readonly queue: Queue) {}

  /** Register an hourly repeatable "scan" job; the processor fans out per organisation. */
  async onModuleInit() {
    await this.queue.add('scan', {}, { repeat: { cron: '0 * * * *' }, removeOnComplete: true });
  }

  /** Manual trigger (admin "fetch now"). */
  fetchOrganisation(organisationId: string) {
    return this.queue.add('fetch', { organisationId }, this.jobOpts());
  }

  jobOpts() {
    return {
      attempts: 4,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: true,
      removeOnFail: 100,
    };
  }
}

