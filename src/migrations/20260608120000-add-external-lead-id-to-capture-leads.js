'use strict';

module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;
    await q.query(`
      ALTER TABLE capture_leads
      ADD COLUMN IF NOT EXISTS external_lead_id TEXT;
    `);
    await q.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS capture_leads_source_external_lead_id_unique
      ON capture_leads (source, external_lead_id)
      WHERE external_lead_id IS NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS capture_leads_source_external_lead_id_unique;
    `);
    await queryInterface.removeColumn('capture_leads', 'external_lead_id');
  },
};
