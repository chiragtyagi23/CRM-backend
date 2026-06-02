# CRM Backend (Node.js + Express + Postgres + Sequelize)

## Setup

1. Create `.env` from `.env.example` (needs at least `DATABASE_URL` and `CORS_ORIGIN`).
2. Create the database and run the schema SQL (`sql/schema.sql`) in the Postgres SQL editor or `psql`.

## Run

```bash
npm install
npm run dev
```

API listens on `http://localhost:4000` by default (see `PORT` in `.env`).

## API docs (Swagger)

With the server running:

- **Swagger UI:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **OpenAPI JSON:** [http://localhost:4000/api/openapi.json](http://localhost:4000/api/openapi.json)

## Schema

Source of truth for tables and columns is `sql/schema.sql`. Sequelize models live in `src/models/index.js` and map to those tables.

## Deploy on Vercel

1. In the Vercel dashboard, **Import** this repo and set **Root Directory** to `CRM-backend` (if the repo root is the monorepo `magnum` folder).
2. **Environment variables** (Production — mirror your `.env.example`):

   - `DATABASE_URL` — Postgres connection string (use a hosted DB: Neon, Supabase, RDS, etc.). Vercel’s filesystem is not a database. Prefer a URL that includes `?sslmode=require` for Neon/Supabase. If the URL has no SSL hint, set `DATABASE_SSL=1` on Vercel (omit or use `DATABASE_SSL=0` only if your DB truly has no TLS).
   - `CORS_ORIGIN` — Your CRM frontend origin(s), comma-separated, e.g. `https://your-crm.vercel.app` (required in production; see `src/config/env.js`).
   - `CRM_APP_URL` — Same as your deployed CRM app URL (no trailing slash). Used in welcome and password-reset emails instead of `localhost`.
   - `BACKEND_URL` — Public API URL, e.g. `https://crm-backend-ydni.onrender.com` (optional; for reference).
   - `NODE_ENV` — `production`
   - `JWT_SECRET` — set a strong random value in production (defaults to a dev placeholder if unset).

3. **Migrations**: run `npm run migrate` (or apply `sql/schema.sql`) against the same database from your machine or CI; Vercel does not run migrations automatically unless you add a build step. Example: `20260421120000-add-callback-time-to-capture-leads.js` adds `capture_leads.callback_time` (CRM callback time).

4. **Build**: default `npm install` is enough (no separate build command required).

5. **Serverless limits**: `vercel.json` sets `maxDuration` to 30s for `api/index.js`. Large bulk uploads may need a higher limit (paid tiers) or a background job. **Local `uploads/`** on disk are ephemeral on Vercel; use object storage (e.g. S3) for durable files if you rely on persisted uploads.

6. After deploy, open `https://<project>.vercel.app/api/docs` for Swagger.

Routing: `vercel.json` rewrites all paths to the single Express app in `api/index.js` (via `serverless-http`).

**Postgres driver on Vercel:** Sequelize normally loads `pg` lazily; Vercel’s bundler can omit it and you may see `Please install pg package manually`. The repo fixes that by `require("pg")` in `api/index.js` and `dialectModule: pg` in `src/models/index.js` so `pg` is always included.

