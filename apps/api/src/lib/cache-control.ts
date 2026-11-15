/**
 * Cache-Control for public, viewer-independent GET responses.
 *
 * s-maxage lets Cloudflare serve the same answer to every visitor for 60s (a
 * Cache Rule must mark /api/events* and /api/organisations* eligible; see
 * deploy/README.md). Browsers keep it 30s. stale-while-revalidate lets the edge
 * answer from its copy while it fetches a fresh one, so expiry never makes a
 * visitor wait on the origin. Net effect: a newly published event can take up to
 * a minute to appear in public lists.
 *
 * Only for responses that are identical for everyone. Never for anything that
 * reads the caller's token.
 */
export const PUBLIC_LIST_CACHE = 'public, max-age=30, s-maxage=60, stale-while-revalidate=300';
