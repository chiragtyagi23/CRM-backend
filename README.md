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

