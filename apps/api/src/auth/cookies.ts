import type { CookieOptions, Response } from 'express';

/** HttpOnly session JWT. Never readable by page scripts. */
export const SESSION_COOKIE = 'dm_session';
/**
 * Non-secret "1" the header reads to choose Sign in / account menu. Reading the
 * session server-side in the root layout would make every page dynamic.
 */
export const SIGNED_IN_COOKIE = 'dm_signed_in';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

// Lax: sent on top-level navigation (so the verify link signs you in) but not
// on cross-site POSTs, which is what keeps the cookie safe from CSRF here.
// Secure in production, where the site is only served over HTTPS.
const base = (): CookieOptions => ({
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

export function setSessionCookies(res: Response, token: string) {
  const maxAge = SESSION_TTL_SECONDS * 1000;
  res.cookie(SESSION_COOKIE, token, { ...base(), httpOnly: true, maxAge });
  res.cookie(SIGNED_IN_COOKIE, '1', { ...base(), httpOnly: false, maxAge });
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE, { ...base(), httpOnly: true });
  res.clearCookie(SIGNED_IN_COOKIE, { ...base(), httpOnly: false });
}

/** Read one cookie from a raw Cookie header (no cookie-parser dependency). */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
