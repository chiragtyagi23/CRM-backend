const required = (key, value) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

function buildDatabaseUrl() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;
  const host = process.env.PGHOST?.trim();
  const database = process.env.PGDATABASE?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD ?? "";
  const port = process.env.PGPORT?.trim() ? Number(process.env.PGPORT) : 5432;
  if (host && database && user) {
    return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return null;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: buildDatabaseUrl(),
  pg: {
    host: process.env.PGHOST || null,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : null,
    database: process.env.PGDATABASE || null,
    user: process.env.PGUSER || null,
    password: process.env.PGPASSWORD || null,
  },
  corsOrigin: required("CORS_ORIGIN", process.env.CORS_ORIGIN),
  /** Optional: when AWS_S3_BUCKET and AWS_REGION are set, uploads go to S3 and responses use public URLs. */
  s3: {
    region: process.env.AWS_REGION?.trim() || null,
    bucket: process.env.AWS_S3_BUCKET?.trim() || null,
    publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL?.trim()?.replace(/\/+$/, "") || null,
    keyPrefix: (process.env.AWS_S3_KEY_PREFIX || "media").replace(/^\/+|\/+$/g, ""),
  },
};

module.exports = { env };

