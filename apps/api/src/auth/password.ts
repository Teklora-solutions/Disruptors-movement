import { ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, ScryptOptions } from 'crypto';

/**
 * scrypt with N=2^14, r=8, p=1: Django's default scrypt cost, 16 MB per hash.
 *
 * Sized for a 2 vCPU droplet, measured on the test stack: this costs ~110 ms of
 * CPU per hash. OWASP's recommended sets (N=2^17 p=1, N=2^13 p=10, ...) all cost
 * ~325-730 ms there; under 300 browsing users that held sign-ins to ~1.5 a
 * second at 5-10 s each. This is still deliberately slow for anyone guessing
 * against a stolen hash, at a third of the CPU.
 *
 * Stored as `scrypt$N$r$p$salt$hash` (base64url). Raise these on a bigger
 * machine: old hashes still verify with their own parameters, and
 * needsRehash() lets sign-in upgrade each one to the new cost.
 */
const N = 2 ** 14;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/**
 * Hashing is the most expensive thing the API does. Node would run four at once
 * on its threadpool, and in testing a burst of sign-ins then starved the rest of
 * the API (browsing p95 went from 63 ms to 4.7 s). Hashes therefore run one at a
 * time by default, which caps sign-in work at one core and leaves the other for
 * pages.
 * Beyond MAX_WAITING queued sign-ins the API answers 503 at once rather than
 * making people wait. Raise PASSWORD_HASH_CONCURRENCY on a bigger machine.
 */
const MAX_CONCURRENT = Math.max(1, Number(process.env.PASSWORD_HASH_CONCURRENCY) || 1);
const MAX_WAITING = 20;
let active = 0;
const waiting: Array<() => void> = [];

async function withHashSlot<T>(work: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    if (waiting.length >= MAX_WAITING) {
      throw new ServiceUnavailableException('We are handling a lot of sign-ins right now. Please try again in a moment.');
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  active++;
  try {
    return await work();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return withHashSlot(
    () =>
      new Promise((resolve, reject) =>
        scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
      ),
  );
}

// NFKC so the same password typed on different keyboards/OSes hashes the same.
const normalise = (password: string) => password.normalize('NFKC');

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(normalise(password), salt, KEY_LENGTH, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64url');
  const key = await scrypt(normalise(password), Buffer.from(saltB64, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** True when a stored hash was made with other parameters than the current ones. */
export function needsRehash(stored: string): boolean {
  return !stored.startsWith(['scrypt', N, R, P, ''].join('$'));
}

/**
 * Burn the same time as a real check when there is no user to check against, so
 * login response times do not reveal which emails have accounts.
 */
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
  await verifyPassword(password, await dummyHash);
  return false;
}

/**
 * Short, non-reversible fingerprint of the current password hash. Put into
 * session and reset tokens: when the password changes, the fingerprint changes,
 * so every existing session and any unused reset link stop working.
 */
export function passwordFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('base64url').slice(0, 16);
}
