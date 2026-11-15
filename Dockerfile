# Three small images from one build: `api` (NestJS), `web` (Next.js standalone)
# and `migrate` (Prisma CLI only). Compose picks one with `build.target`.
#
# Alpine throughout. The Prisma client is generated in the alpine build stage,
# so its "native" engine is already the musl one the runtime needs.

FROM node:22-alpine AS base
# Prisma's engines link against OpenSSL 3.
RUN apk add --no-cache openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- build: full install, generate the Prisma client, compile both apps ----
FROM base AS build
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY apps ./apps
RUN npm --workspace apps/api run build

# next.config.js rewrites /api/* to the API, and Next resolves rewrites at BUILD
# time into the routes manifest. The API's in-network address therefore has to
# be known here, not just at runtime.
ARG API_ORIGIN=http://api:4000
ENV API_ORIGIN=${API_ORIGIN}
RUN npm --workspace apps/web run build

# ---- api: root + api workspace production deps only (no Next, React, CLIs) ----
FROM base AS api-deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --workspace apps/api --include-workspace-root \
    && npm cache clean --force \
    # The Prisma CLI and its schema/migration engines come in as a peer of
    # @prisma/client. Only `migrate` needs them; the API's query engine is in
    # node_modules/.prisma, copied from the build stage below.
    && rm -rf node_modules/prisma node_modules/@prisma/engines

FROM base AS api
ENV NODE_ENV=production
COPY --from=api-deps /app/node_modules ./node_modules
# The generated client lives outside any package npm installs, so the fresh
# install above does not have it.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

# ---- web: Next's standalone server, with only the files it traced ----
FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
# Standalone mirrors the monorepo layout under outputFileTracingRoot.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# ---- migrate: the Prisma CLI, its engines and the migrations, nothing else ----
FROM base AS migrate
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]
