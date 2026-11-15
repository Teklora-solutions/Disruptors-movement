import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { MAIL_QUEUE, MailJob, publicUrl } from './mail.constants';
import * as templates from './templates';

type Recipient = { email: string; name?: string | null };

/**
 * Queues mail instead of sending inline: Gmail's SMTP can take seconds, and a
 * failed send is retried with backoff rather than failing the request.
 */
@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue<MailJob>) {}

  sendVerifyEmail(user: Recipient, token: string) {
    const url = `${publicUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    return this.enqueue(templates.verifyEmail(user.email, user.name, url));
  }

  sendWelcome(user: Recipient) {
    return this.enqueue(templates.welcome(user.email, user.name, `${publicUrl()}/dashboard`));
  }

  sendResetPassword(user: Recipient, token: string) {
    const url = `${publicUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    return this.enqueue(templates.resetPassword(user.email, user.name, url));
  }

  sendAlreadyRegistered(user: Recipient) {
    return this.enqueue(
      templates.alreadyRegistered(user.email, user.name, `${publicUrl()}/signin`, `${publicUrl()}/forgot-password`),
    );
  }

  private enqueue(job: MailJob) {
    return this.queue.add(job, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
      // The job holds a one-time link; do not keep it in Redis once sent.
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }
}
