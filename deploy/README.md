# Deploying with Docker Compose + Cloudflare Tunnel

```text
Browser --HTTPS--> Cloudflare (edge cache) --outbound tunnel--> cloudflared
    /api/*    --> api:4000 (NestJS) --> PostgreSQL, Redis
    the rest  --> web:3000 (Next.js)
```

The tunnel is the only entry point. No ports are published on the host. The
database and Redis are on an internal network that only the API (and the one-shot
`migrate`) can reach. The API's routes all live under `/api`, so the tunnel can
send `/api/*` to it directly. If that route is missing, Next's own `/api` rewrite
still forwards the requests, with an extra hop.

| Service       | Role                                                    | RAM limit |
|---------------|---------------------------------------------------------|-----------|
| `db`          | PostgreSQL 16, data in `./data/postgres`                | 160m      |
| `redis`       | Bull queue for feed ingestion, AOF in `./data/redis`    | 32m       |
| `migrate`     | One-shot `prisma migrate deploy`; the API waits for it  | 96m (exits) |
| `api`         | NestJS on 4000, also runs the ingestion queue processor | 144m      |
| `web`         | Next.js standalone on 3000, no secrets                  | 96m       |
| `cloudflared` | Tunnel connector                                        | 64m       |

The running stack is capped at 500 MB of RAM. The limits come from load tests
whose peaks were db 127, api 110, web 68 and redis 17 MiB. If a service starts
getting killed, check `docker inspect -f '{{.State.OOMKilled}}' <container>` and
raise that one limit in `docker-compose.yml`. Raising it with `docker update`
is undone by the next `up -d`. For the Node services, raise
`--max-old-space-size` along with the limit, keeping it about two thirds of it.

Each service has its own image target in the `Dockerfile` (`api`, `web` and
`migrate`, all on `node:22-alpine`), so no image carries another's dependencies.

Rate limiting (120 requests/min) is per visitor, keyed on Cloudflare's
`CF-Connecting-IP` header. Requests reach the API through cloudflared (or the
website), so the socket address is never the visitor's. Without that header every
visitor would share one limit.

## Capacity

Load-tested with the 500 MB limits on 2 CPU cores (standing in for a 2 vCPU
droplet) against 40 organisations and 3,000 events. Each simulated visitor browsed
pages, listed and searched events, and 5% signed up, pausing 2–8 s between clicks.

| Concurrent visitors | Req/s | Errors | API p95 | Result |
|---------------------|-------|--------|---------|--------|
| 300                 | 76    | 0%     | 63 ms   | pass   |
| **350**             | 89    | 0%     | 155 ms  | **pass: the limit** |
| 400                 | 101   | 0%     | 646 ms  | slow (p95 target is 500 ms) |

That is without Cloudflare's cache, so it is what the origin can take on its own.
Past the limit, responses queue and get slower; nothing errors or runs out of
memory. The bottleneck at 400 is the API's single Node process (one core). The
next step up would be a second `api` replica, which fits in the memory budget.
These numbers come from a desktop CPU, so re-run the test on the droplet before
relying on them.

## First deploy

1. **Tunnel.** In Cloudflare Zero Trust go to Networks > Tunnels and create a
   remotely managed tunnel. Under **Public Hostname**, add two routes for the same
   hostname, for example `disruptors.example.com`. Cloudflare checks them from
   top to bottom, so order matters:

   | # | Path     | Service type | URL          |
   |---|----------|--------------|--------------|
   | 1 | `^/api/` | HTTP         | `api:4000`   |
   | 2 | *(empty)*| HTTP         | `web:3000`   |

   Route 1 sends API calls straight to the API. Route 2 catches everything else.
2. **Edge cache.** In the Cloudflare dashboard for the zone, go to Caching >
   Cache Rules and create a rule:
   - *When*: Hostname equals `disruptors.example.com` **and** Request Method
     equals `GET` **and** URI Path is in `/api/events` `/api/organisations`.
     Use exact paths, not "starts with": the query string is not part of the
     path, and a prefix would also match signed-in routes such as
     `/api/organisations/pending-review`.
   - *Then*: **Eligible for cache**. Edge TTL: **Use cache-control header if
     present, bypass cache if not**. Browser TTL: **Respect origin**.

   The API sends `Cache-Control: public, max-age=30, s-maxage=60,
   stale-while-revalidate=300` only on those two public lists. The rule just
   lets Cloudflare honour it, because Cloudflare does not cache JSON on its own.
   Every visitor gets the same answer, so a new event can take up to a minute to
   appear. Every other API response sends `Cache-Control: no-store`, so a rule that
   matches too much still caches nothing private. Check with `curl -sI https://<host>/api/events | grep -i cf-cache-status`:
   the first request shows `MISS`, then `HIT`.
3. **Secrets.** On the server, in the repo root:

   ```bash
   cp .env.example .env                    # set PUBLIC_HOSTNAME, POSTGRES_*, JWT_SECRET, SMTP_*
   cp cloudflared.env.example cloudflared.env   # paste the tunnel token only, not the full command
   chmod 600 .env cloudflared.env
   ```

   `JWT_SECRET` is required: it signs sessions and email links, and the API will
   not start without it. For email, create a Gmail App Password (see
   [Email](#email-gmail-smtp)). `.env.example` lists the command that generates each secret. The Postgres
   password is hex because compose puts it into `DATABASE_URL`.
4. **Start:**

   ```bash
   docker compose up -d --build
   docker compose logs cloudflared   # look for "Registered tunnel connection"
   ```

## Email (Gmail SMTP)

Members sign in with an email and password. The API sends four emails from a
queue in Redis, retrying up to 5 times with backoff if Gmail is slow or down:

| Email | When |
|---|---|
| Confirm your email | On joining. The link works for 24 hours. Sign-in is refused until it is opened. |
| Welcome | Once the email is confirmed. |
| Reset your password | From `/forgot-password`. The link works for 1 hour and only once. |
| You already have an account | When someone joins with an email that is already registered. |

Setup:
1. On the Gmail account that will send, turn on **2-Step Verification**, then
   create an **App Password** at myaccount.google.com/apppasswords.
2. In `.env` set `SMTP_USER` to that address, `SMTP_PASS` to the App Password (no
   spaces) and `MAIL_FROM`. Keep `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=465`.
3. `docker compose up -d api`, join with a real address, and check
   `docker compose logs api | grep -i mail`. It should show `sent "Confirm your email…"`.

Limits: about 500 recipients a day on a free Gmail account and 2,000 on Google
Workspace. Past that, Gmail refuses sends for 24 hours (the queue keeps retrying).
If you outgrow it, any SMTP provider works with the same four variables.

To let members in without confirming their email, set
`EMAIL_VERIFICATION_REQUIRED=false`. They are then signed in on joining and get
the welcome email straight away.

Sessions last 7 days, in an HttpOnly cookie. Resetting a password signs out every
other session for that account. Rotating `JWT_SECRET` signs everyone out.

Passwords are hashed with scrypt (N=2^14, r=8, p=1), about 110 ms of CPU each,
one at a time, so sign-ins can never take more than one core from the site. On
2 cores with 300 people browsing, 3 sign-ins a second all succeeded (p95 under
1 s) and browsing stayed fast. At about 15 a second, roughly 8 got through and
the rest were told "busy, try again" at once, while browsing p95 stayed at
236 ms. On a bigger machine, set `PASSWORD_HASH_CONCURRENCY` (default 1) to the
number of spare cores. To raise the hashing cost, change the constants in
`apps/api/src/auth/password.ts`: each member's hash is upgraded on their next
sign-in.

## Updating

```bash
git pull
docker compose up -d --build
```

`migrate` runs again on every `up`. If it fails, `api` does not get recreated, so
the old containers keep serving. Check with `docker compose logs migrate`.

## Schema changes

Production only applies migrations that are committed under `prisma/migrations/`.
Create them in development with `npm run prisma:migrate`, commit them, then deploy.
Never run `prisma db push` or `prisma/seed.ts` against production: the seed
deletes users and organisations.

## Notes

- `POSTGRES_PASSWORD` only takes effect when `./data/postgres` is first
  initialised. To change it later, `ALTER ROLE` inside Postgres and update `.env`.
- Back up `./data/postgres` with `docker compose exec db pg_dump -U "$POSTGRES_USER" disruptors > backup.sql`
  rather than copying the files of a running database.
- The Swagger UI is served at `https://<host>/api/docs`.
  If it should not be public, block that path with a Cloudflare Access policy.
- Anyone with Docker access on the host can read the environment variables with
  `docker inspect`.
