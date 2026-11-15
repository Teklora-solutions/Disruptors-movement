import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTVerifyOptions } from 'jose';

/**
 * Verifies bearer tokens against an external provider's JWKS.
 *
 * AUTH_JWKS_URI is optional so the site can run before a login provider is
 * chosen. Without it the API starts normally, public routes work, and every
 * signed-in route answers 401 "Sign-in is not configured".
 */
@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private readonly verifyOptions: JWTVerifyOptions = {
    algorithms: ['RS256'],
  };

  constructor() {
    const jwksUri = process.env.AUTH_JWKS_URI?.trim();
    if (!jwksUri) {
      this.jwks = null;
      this.logger.warn('AUTH_JWKS_URI is not set: signed-in routes will answer 401.');
      return;
    }
    // Throws at startup on a malformed URL, which is a config mistake worth
    // failing loudly on. The keys themselves are fetched on first use.
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async verify(token: string) {
    if (!this.jwks) {
      throw new UnauthorizedException('Sign-in is not configured');
    }
    try {
      const { payload } = await jwtVerify(token, this.jwks, this.verifyOptions);
      return payload as any; // expected to contain at least `sub`
    } catch {
      // A malformed, expired or wrongly signed token is the caller's problem
      // (401), not a server error. jose's own errors would otherwise surface as 500.
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
