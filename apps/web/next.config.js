/** @type {import('next').NextConfig} */
const path = require('path');

const apiOrigin = process.env.API_ORIGIN || 'http://localhost:4000';

module.exports = {
  reactStrictMode: true,
  // Production image ships .next/standalone: a minimal server plus only the
  // node_modules files it actually imports. Tracing starts at the monorepo root
  // because dependencies are hoisted there by npm workspaces.
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async rewrites() {
    // Browser calls /api/* on the web origin; Next proxies to the NestJS API,
    // whose routes are all under /api too. In production the tunnel routes
    // /api/* to the API directly, so this only serves development and fallback.
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};
