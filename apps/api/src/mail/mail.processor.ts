import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { createTransport, Transporter } from 'nodemailer';
import { MAIL_QUEUE, MailJob } from './mail.constants';

/**
 * Sends queued mail over SMTP (Gmail: smtp.gmail.com, 465, an App Password).
 * Without SMTP_HOST it logs each message instead, for local development.
 */
@Processor(MAIL_QUEUE)
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly transport: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT ?? 465);
    const user = process.env.SMTP_USER?.trim();
    this.from = process.env.MAIL_FROM?.trim() || (user ? `"Disruptors Movement" <${user}>` : 'Disruptors Movement <no-reply@localhost>');
    if (!host) {
      this.transport = null;
      this.logger.warn('SMTP_HOST is not set: emails are logged, not sent.');
      return;
    }
    this.transport = createTransport({
      host,
      port,
      secure: port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
      auth: user ? { user, pass: process.env.SMTP_PASS } : undefined,
      // A single pooled connection: Gmail limits concurrent connections per account.
      pool: true,
      maxConnections: 1,
    });
  }

  @Process()
  async send(job: Job<MailJob>) {
    const { to, subject, html, text } = job.data;
    if (!this.transport) {
      this.logger.log(`[mail not sent: no SMTP] to=${to} subject="${subject}"\n${text}`);
      return;
    }
    await this.transport.sendMail({ from: this.from, to, subject, html, text });
    this.logger.log(`sent "${subject}" to ${to}`);
  }
}
