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
  await sequelize.query(`
    ALTER TABLE capture_leads
    ADD COLUMN IF NOT EXISTS external_lead_id TEXT;
  `);
  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS capture_leads_source_external_lead_id_unique
    ON capture_leads (source, external_lead_id)
    WHERE external_lead_id IS NOT NULL;
  `);
}

module.exports = { ensureCaptureLeadsSchema };
