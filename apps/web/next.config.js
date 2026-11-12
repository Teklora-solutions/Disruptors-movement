/** @type {import('next').NextConfig} */
const apiOrigin = process.env.API_ORIGIN || 'http://localhost:4000';

module.exports = {
  reactStrictMode: true,
  async rewrites() {
    // Browser calls /api/* on the web origin; Next proxies to the NestJS API.
    return [{ source: '/api/:path*', destination: `${apiOrigin}/:path*` }];
  },
};

