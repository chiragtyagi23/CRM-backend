require('../src/config/loadEnv');

const { sequelize } = require("../src/models");

/**
 * WARNING: sequelize.sync({ alter: true }) recreates unique constraints on every
 * run (table_col_key, table_col_key1, ...), which flooded Neon with 2000+ indexes
 * and made Render APIs hang. Prefer migrations (`npm run migrate`).
 *
 * Usage:
 *   node scripts/db-push.js           -> sync without alter (create missing tables only)
 *   node scripts/db-push.js --alter   -> explicit alter (dev only; do not use on Render)
 */
async function main() {
  const useAlter = process.argv.includes("--alter");
  if (useAlter && process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing sequelize.sync({ alter: true }) in production. Use migrations instead.",
    );
  }

  await sequelize.sync(useAlter ? { alter: true } : undefined);
  // eslint-disable-next-line no-console
  console.log(
    useAlter
      ? "Database synced with models (sequelize.sync alter: true)."
      : "Database synced with models (sequelize.sync, no alter).",
  );
  await sequelize.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
