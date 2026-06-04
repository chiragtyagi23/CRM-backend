/** Idempotent repairs when SequelizeMeta is ahead of the live DB (common on Neon after restores). */
async function ensureCaptureLeadsSchema(sequelize) {
  await sequelize.query(`
    ALTER TABLE capture_leads
    ADD COLUMN IF NOT EXISTS activity_timeline JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);
  await sequelize.query(`
    ALTER TABLE capture_leads
    ADD COLUMN IF NOT EXISTS interested_projects JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);
}

module.exports = { ensureCaptureLeadsSchema };
