import { Process, Processor, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job, Queue } from 'bull';
import { createHash } from 'crypto';
import Parser from 'rss-parser';
import * as ical from 'ical';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../lib/prisma.service';
import { INGEST_QUEUE, IngestionService } from './ingestion.service';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

interface Item {
  title: string;
  url: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
  location?: string;
}

/** Fetch with timeout and a hard response-size cap. No HTML scraping: only feed bodies are parsed. */
async function fetchLimited(url: string): Promise<string> {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported URL scheme');
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) throw new Error('Feed too large');
  const reader = res.body?.getReader();
  if (!reader) throw new Error('Empty response');
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('Feed too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const hashOf = (url: string, title: string) =>
  createHash('sha256').update(`${url.trim()}|${title.trim().toLowerCase()}`).digest('hex');

@Processor(INGEST_QUEUE)
export class IngestionProcessor {
  private readonly log = new Logger(IngestionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestion: IngestionService,
    @InjectQueue(INGEST_QUEUE) private readonly queue: Queue,
  ) {}

  @Process('scan')
  async scan() {
    const orgs = await this.prisma.organisation.findMany({
      where: { isActive: true, OR: [{ rssUrl: { not: null } }, { icalUrl: { not: null } }] },
      select: { id: true },
    });
    for (const o of orgs) await this.queue.add('fetch', { organisationId: o.id }, this.ingestion.jobOpts());
    return { queued: orgs.length };
  }

  @Process('fetch')
  async fetchOrg(job: Job<{ organisationId: string }>) {
    const org = await this.prisma.organisation.findUnique({ where: { id: job.data.organisationId } });
    if (!org) return;
    try {
      const items: Item[] = [];
      if (org.rssUrl) items.push(...(await this.readRss(org.rssUrl)));
      if (org.icalUrl) items.push(...(await this.readIcal(org.icalUrl)));

      let created = 0;
      for (const it of items) {
        const sourceHash = hashOf(it.url, it.title);
        const exists = await this.prisma.event.findUnique({ where: { sourceHash } });
        if (exists) continue;
        await this.prisma.event.create({
          data: {
            organisationId: org.id,
            title: it.title.slice(0, 200),
            description: it.description?.slice(0, 5000),
            startsAt: it.startsAt,
            endsAt: it.endsAt,
            location: it.location,
            sourceUrl: it.url,
            sourceHash,
            status: EventStatus.PENDING_REVIEW,
          },
        });
        created++;
      }
      await this.prisma.organisation.update({
        where: { id: org.id },
        data: { lastIngestAt: new Date(), lastIngestError: null },
      });
      return { created };
    } catch (err: any) {
      const msg = String(err?.message ?? err).slice(0, 500);
      this.log.warn(`Ingest failed for ${org.slug}: ${msg}`);
      await this.prisma.organisation.update({ where: { id: org.id }, data: { lastIngestError: msg } });
      throw err; // lets Bull retry with exponential backoff
    }
  }

  private async readRss(url: string): Promise<Item[]> {
    const feed = await new Parser().parseString(await fetchLimited(url));
    return (feed.items ?? [])
      .filter((i) => i.title && i.link)
      .map((i) => ({
        title: i.title!,
        url: i.link!,
        description: i.contentSnippet ?? i.content,
        startsAt: new Date(i.isoDate ?? i.pubDate ?? Date.now()),
      }));
  }

  private async readIcal(url: string): Promise<Item[]> {
    const data = ical.parseICS(await fetchLimited(url));
    return Object.values<any>(data)
      .filter((e) => e.type === 'VEVENT' && e.summary && e.start)
      .map((e) => ({
        title: String(e.summary),
        url: e.url ? String(e.url) : `${url}#${e.uid ?? e.summary}`,
        description: e.description ? String(e.description) : undefined,
        startsAt: new Date(e.start),
        endsAt: e.end ? new Date(e.end) : undefined,
        location: e.location ? String(e.location) : undefined,
      }));
  }
}

