require('./config/loadEnv');

const { app } = require('./app');
const { env } = require('./config/env');
const { getCrmLoginUrl } = require('./config/appUrls');
const { sequelize } = require('./models');

async function start() {
  await sequelize.authenticate();
  // In migration-based workflow, do not auto-sync schema on boot.
  // Run: `npm run migrate` to apply schema changes.

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`CRM API listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`[config] Welcome email login URL: ${getCrmLoginUrl()}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});

