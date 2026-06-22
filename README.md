# Lock-in

A full-stack productivity tracker — habits, goals, focus sessions and tasks, behind a neon-on-black PWA that installs on desktop and mobile.

## Stack

- **Client:** React 18 + Vite + Tailwind CSS v4 + Recharts + Zustand + React Query + react-router-dom, shipped as an installable PWA (`vite-plugin-pwa`).
- **Server:** Node.js + Express + Prisma ORM, deployed as a single Vercel serverless function.
- **Database:** PostgreSQL (Supabase).
- **Auth:** JWT access tokens + bcrypt password hashing.

## Project structure

```
client/            Vite + React app (pages, components, hooks, store, api)
server/            Express API
  src/             app.ts, routes, controllers, middleware, prisma client
  api/index.ts      Vercel serverless entry (exports the Express app)
  prisma/schema.prisma
vercel.json        Routes /api/* to the server function, everything else to the SPA
scripts/gen-icons.py  Regenerates the PWA icon set
```

## Local setup

Requires Node 18+ and a Postgres database (a free Supabase project works well).

```bash
# 1. install
npm install --prefix server
npm install --prefix client

# 2. configure env
cp server/.env.example server/.env   # fill in DATABASE_URL / DIRECT_URL / JWT_SECRET
cp client/.env.example client/.env   # VITE_API_URL can stay empty in dev (proxied)

# 3. database
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server

# 4. run both dev servers (two terminals)
npm run dev --prefix server   # http://localhost:4000
npm run dev --prefix client   # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `localhost:4000`, so the client never needs a real `VITE_API_URL` locally.

## Environment variables

See `server/.env.example` and `client/.env.example` (root `.env.example` mirrors both, for reference). In short:

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | server | Pooled Supabase connection string (pgbouncer, port 6543) |
| `DIRECT_URL` | server | Direct connection (port 5432), required by `prisma migrate` |
| `JWT_SECRET` | server | Long random string signing access tokens |
| `JWT_EXPIRES_IN` | server | Defaults to `7d` |
| `CORS_ORIGIN` | server | Comma-separated allowed origins in production |
| `VITE_API_URL` | client | Base URL for API calls in production builds (e.g. your Vercel domain) |

## Deploying to Vercel

The repo deploys as a single Vercel project:

1. Import the repo into Vercel — `vercel.json` already defines the build (`client/dist` output) and routes `/api/*` to the Express app in `server/api/index.ts`.
2. Add the environment variables above in the Vercel project settings (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and `VITE_API_URL` set to your deployed domain, e.g. `https://your-app.vercel.app/api`).
3. Run `prisma migrate deploy` against the production database before (or right after) the first deploy — Vercel builds don't run migrations automatically.

## Database schema

Defined in `server/prisma/schema.prisma`: `User`, `Habit`, `HabitLog`, `Task`, `Goal`, `DailyStat`. `DailyStat` includes a `focusMins` field (beyond the original spec) so the Focus Timer can auto-save session length and the Dashboard can show total focus hours.

## Design

Colors, type, and component states (cards, glow, progress rings, heatmap, bottom nav, timer ring) follow the neon-green-on-black reference design — tokens live in `client/src/index.css`.
