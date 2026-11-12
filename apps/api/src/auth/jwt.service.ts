import { Injectable, BadRequestException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTVerifyOptions } from 'jose';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class JwtService {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private verifyOptions: JWTVerifyOptions = {
    algorithms: ['RS256'],
  };

  constructor() {
    const jwksUri = process.env.AUTH_JWKS_URI;
    if (!jwksUri) {
      throw new BadRequestException('AUTH_JWKS_URI not configured');
    }
    // createRemoteJWKSet works with both http and https URLs
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async verify(token: string) {
    const { payload } = await jwtVerify(token, this.jwks, this.verifyOptions);
    return payload as any; // expected to contain at least `sub`
  }
}

