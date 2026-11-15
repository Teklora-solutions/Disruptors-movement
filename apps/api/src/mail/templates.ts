import { MailJob } from './mail.constants';

const BRAND = 'Disruptors Movement';

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Plain, table-free HTML: renders the same in Gmail, Outlook and phone clients. */
function layout(heading: string, paragraphs: string[], button?: { label: string; url: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p}</p>`).join('');
  const cta = button
    ? `<p style="margin:24px 0"><a href="${escape(button.url)}" style="background:#ff4b2b;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">${escape(button.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.5">If the button does not work, paste this link into your browser:<br><span style="word-break:break-all">${escape(button.url)}</span></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#fbf7f2;font-family:Arial,Helvetica,sans-serif;color:#0e0f1a">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <p style="margin:0 0 24px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#ff4b2b;font-weight:700">${BRAND}</p>
    <h1 style="margin:0 0 20px;font-size:24px">${escape(heading)}</h1>
    ${body}${cta}
    <p style="margin:32px 0 0;font-size:12px;color:#777">You are receiving this because this address was used on ${BRAND}.</p>
  </div></body></html>`;
}

const hello = (name?: string | null) => (name ? `Hi ${escape(name)},` : 'Hi,');

export function verifyEmail(to: string, name: string | null | undefined, url: string): MailJob {
  return {
    to,
    subject: `Confirm your email for ${BRAND}`,
    html: layout('Confirm your email', [hello(name), 'Thanks for joining. Confirm this is your email address to finish setting up your account. The link works for 24 hours.'], { label: 'Confirm email', url }),
    text: `${name ? `Hi ${name},` : 'Hi,'}\n\nConfirm your email to finish joining ${BRAND} (link valid for 24 hours):\n${url}\n`,
  };
}

export function welcome(to: string, name: string | null | undefined, url: string): MailJob {
  return {
    to,
    subject: `Welcome to ${BRAND}`,
    html: layout(`Welcome to ${BRAND}`, [hello(name), 'Your account is ready. Browse upcoming events, discover organisations and find fellowships that match your interests.'], { label: 'Go to your dashboard', url }),
    text: `${name ? `Hi ${name},` : 'Hi,'}\n\nYour ${BRAND} account is ready: ${url}\n`,
  };
}

export function resetPassword(to: string, name: string | null | undefined, url: string): MailJob {
  return {
    to,
    subject: `Reset your ${BRAND} password`,
    html: layout('Reset your password', [hello(name), 'Someone asked to reset the password for this account. If it was you, choose a new password below. The link works for 1 hour and only once.', 'If you did not ask for this, you can ignore this email. Your password stays the same.'], { label: 'Choose a new password', url }),
    text: `${name ? `Hi ${name},` : 'Hi,'}\n\nReset your password (link valid for 1 hour, works once):\n${url}\n\nIf you did not ask for this, ignore this email.\n`,
  };
}

export function alreadyRegistered(to: string, name: string | null | undefined, signInUrl: string, resetUrl: string): MailJob {
  return {
    to,
    subject: `You already have a ${BRAND} account`,
    html: layout('You already have an account', [hello(name), 'Someone just tried to join using this email address, which already has an account. If that was you, sign in instead, or reset your password if you have forgotten it.', `<a href="${escape(resetUrl)}" style="color:#ff4b2b">Forgot your password?</a>`, 'If it was not you, you can ignore this email. Nothing has changed.'], { label: 'Sign in', url: signInUrl }),
    text: `${name ? `Hi ${name},` : 'Hi,'}\n\nSomeone tried to join with this email, which already has an account.\nSign in: ${signInUrl}\nForgot your password: ${resetUrl}\n\nIf it was not you, ignore this email.\n`,
  };
}
