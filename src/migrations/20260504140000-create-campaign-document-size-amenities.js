"use strict";

/** Create campaign side tables if missing (correct names; matches sql/schema.sql). */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;

    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await q.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_document_table (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        url text NOT NULL,
        type text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_document_campaign_idx ON campaign_document_table(campaign_id);
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_size_floor (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        section_label text,
        title_before text,
        title_italic text,
        title_after text,
        blueprint_image text,
        default_tab_id text,
        tabs jsonb NOT NULL DEFAULT '[]'::jsonb,
        panels jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await q.query(`
      DROP TRIGGER IF EXISTS campaign_size_floor_set_updated_at ON campaign_size_floor;
      CREATE TRIGGER campaign_size_floor_set_updated_at
      BEFORE UPDATE ON campaign_size_floor
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_amenities (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        icon text,
        name text NOT NULL,
        "desc" text,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_amenities_campaign_sort_idx ON campaign_amenities(campaign_id, sort_order);
    `);
  },

  async down(queryInterface) {
    const q = queryInterface.sequelize;
    await q.query(`DROP TABLE IF EXISTS campaign_amenities CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_size_floor CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_document_table CASCADE;`);
  },
};
