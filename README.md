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

## Schema

Source of truth for tables and columns is `sql/schema.sql`. Sequelize models live in `src/models/index.js` and map to those tables.

## Endpoints (campaigns)

- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `POST /api/campaigns`
- `PATCH /api/campaigns/:id`
- `DELETE /api/campaigns/:id`
- `PUT /api/campaigns/:id/hero`
- `PUT /api/campaigns/:id/overview`
- `PUT /api/campaigns/:id/gallery`
- `PUT /api/campaigns/:id/floorplans`
- `PUT /api/campaigns/:id/amenities`
- `PUT /api/campaigns/:id/benefits`
- `PUT /api/campaigns/:id/highlights`
- `PUT /api/campaigns/:id/social-infrastructure`
- `PUT /api/campaigns/:id/documents`
