import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { SESSION_TTL_SECONDS } from './cookies';

const ISSUER = 'disruptors-movement';
const ALG = 'HS256';

/** One-time links. Each kind is only accepted where that kind is expected. */
export type LinkPurpose = 'verify-email' | 'reset-password';

/**
 * Signs and verifies this app's own tokens with JWT_SECRET.
 *
 * Every token carries a `use` claim: a session token is never accepted as a
 * reset link, a verification link never as a session, and so on.
 */
@Injectable()
export class JwtService {
  private readonly key: Uint8Array;

  constructor() {
    const secret = process.env.JWT_SECRET ?? '';
    // Fail at startup rather than sign sessions with a guessable key.
    if (secret.length < 32 || secret === 'your-secret-here') {
      throw new Error('JWT_SECRET must be set to a random value of at least 32 characters (openssl rand -base64 48).');
    }
    this.key = new TextEncoder().encode(secret);
  }

  /** `fp` ties the session to the current password (see passwordFingerprint). */
  signSession(userId: string, fp: string): Promise<string> {
    return this.sign({ use: 'session', fp }, userId, `${SESSION_TTL_SECONDS}s`);
  }

  /** Throws 401 for anything that is not a valid, unexpired session token. */
  async verifySession(token: string): Promise<JWTPayload & { sub: string; fp?: string }> {
    const payload = await this.verify(token, 'session');
    if (!payload) throw new UnauthorizedException('Your session has expired. Please sign in again.');
    return payload as JWTPayload & { sub: string; fp?: string };
  }

  signLink(purpose: LinkPurpose, userId: string, claims: Record<string, string>, ttl: string): Promise<string> {
    return this.sign({ ...claims, use: purpose }, userId, ttl);
  }

  /** Null for an expired, tampered or wrong-kind link: callers choose the message. */
  async verifyLink(token: string, purpose: LinkPurpose): Promise<(JWTPayload & Record<string, unknown>) | null> {
    return this.verify(token, purpose);
  }

  private sign(claims: Record<string, string>, sub: string, ttl: string) {
    return new SignJWT(claims)
      .setProtectedHeader({ alg: ALG })
      .setIssuer(ISSUER)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(ttl)
      .sign(this.key);
  }

  private async verify(token: string, use: string) {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: [ALG], issuer: ISSUER });
      if (payload.use !== use || typeof payload.sub !== 'string') return null;
      return payload;
    } catch {
      return null;
    }
  }
}
