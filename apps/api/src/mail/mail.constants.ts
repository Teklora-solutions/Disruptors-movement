export const MAIL_QUEUE = 'mail';

export interface MailJob {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Where links in emails point. Compose sets it from PUBLIC_HOSTNAME. */
export const publicUrl = () => (process.env.PUBLIC_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
