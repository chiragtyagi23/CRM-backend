const required = (key, value) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || null,
  pg: {
    host: process.env.PGHOST || null,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : null,
    database: process.env.PGDATABASE || null,
    user: process.env.PGUSER || null,
    password: process.env.PGPASSWORD || null,
  },
  corsOrigin: required("CORS_ORIGIN", process.env.CORS_ORIGIN),
};

module.exports = { env };

