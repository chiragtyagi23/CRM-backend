require("../src/config/loadEnv");
const { sequelize } = require("../src/models");

(async () => {
  await sequelize.query(`
    ALTER TABLE capture_leads
    ADD COLUMN IF NOT EXISTS interested_projects JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);
  const [rows] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'capture_leads' AND column_name = 'interested_projects';
  `);
  console.log("interested_projects column:", rows.length > 0 ? "OK" : "MISSING");
  await sequelize.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
