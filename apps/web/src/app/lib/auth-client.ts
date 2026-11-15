/** Client-side helpers for the /api/auth endpoints. The session itself is an HttpOnly cookie. */

export const SIGNED_IN_COOKIE = 'dm_signed_in';

export function isSignedIn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim() === `${SIGNED_IN_COOKIE}=1`);
}

export type ApiResult<T = any> = { ok: boolean; status: number; data: T | null; error: string };

/** POST JSON to the API and return the parsed result with a readable error message. */
export async function postJson<T = any>(path: string, body?: unknown): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, data: null, error: 'Could not reach the server. Check your connection and try again.' };
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data, error: res.ok ? '' : errorMessage(res.status, data) };
}

function errorMessage(status: number, data: any): string {
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  // Nest validation errors arrive as an array of messages; show the first.
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  if (typeof message === 'string' && message) return message;
  return status >= 500 ? 'Something went wrong on our side. Please try again.' : 'That did not work. Please check the form and try again.';
}

/** Only allow redirects within this site (blocks ?next=https://evil.example). */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
