'use strict';

/** Baseline capture_leads table (older DBs may already have it; alters run in later migrations). */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS capture_leads (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        source text,
        first_call_date timestamptz,
        call_by text,
        name text NOT NULL,
        number text NOT NULL,
        whatsapp_number text,
        bhk text,
        budget text,
        resi_location text,
        property_ownership text,
        work_location text,
        work_profile text,
        industry_type text,
        preferred_location jsonb NOT NULL DEFAULT '[]'::jsonb,
        possession_date timestamptz,
        status text,
        property_buying_stage text,
        callback_date timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await q.query('ALTER TABLE capture_leads ADD COLUMN IF NOT EXISTS email TEXT;');
    await q.query('ALTER TABLE capture_leads ADD COLUMN IF NOT EXISTS callback_time TEXT;');
    await q.query(`
      ALTER TABLE capture_leads
        ADD COLUMN IF NOT EXISTS campaign_id uuid
        REFERENCES campaign_master_table(id) ON DELETE SET NULL;
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS capture_leads_campaign_id_idx ON capture_leads(campaign_id);
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('capture_leads');
  },
};
