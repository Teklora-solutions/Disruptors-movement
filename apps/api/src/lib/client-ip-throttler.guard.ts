import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits per visitor, not per hop.
 *
 * In production every request reaches the API through the Next.js /api rewrite,
 * so the socket address is always the web container's, and the default tracker
 * would make one 120/min bucket shared by every visitor on the site.
 *
 * Cloudflare sets CF-Connecting-IP to the real client address and overwrites any
 * value a client sends, and the origin is reachable only through the tunnel, so
 * the header can be trusted here. Next forwards it unchanged. Without it (local
 * development), fall back to the socket address.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const cfIp = req.headers?.['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.length > 0) return cfIp;
    return req.ip;
  }
}
