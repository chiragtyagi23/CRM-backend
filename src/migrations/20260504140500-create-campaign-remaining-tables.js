"use strict";

/** Remaining campaign satellite tables (banner, hero, overview, images, benefits, highlights, social, media). */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_banner_data (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        image_id text NOT NULL,
        alt text,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_banner_campaign_sort_idx ON campaign_banner_data(campaign_id, sort_order);
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_hero_data (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        data jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      DROP TRIGGER IF EXISTS campaign_hero_set_updated_at ON campaign_hero_data;
      CREATE TRIGGER campaign_hero_set_updated_at
      BEFORE UPDATE ON campaign_hero_data
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_project_overview (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        section_label text,
        title_before text,
        title_italic text,
        title_after text,
        body text,
        facts jsonb NOT NULL DEFAULT '[]'::jsonb,
        certifications_title text,
        certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      DROP TRIGGER IF EXISTS campaign_overview_set_updated_at ON campaign_project_overview;
      CREATE TRIGGER campaign_overview_set_updated_at
      BEFORE UPDATE ON campaign_project_overview
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_project_images (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        tag text,
        feature boolean NOT NULL DEFAULT false,
        wide_bottom boolean NOT NULL DEFAULT false,
        images jsonb NOT NULL DEFAULT '[]'::jsonb,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_project_images_campaign_sort_idx ON campaign_project_images(campaign_id, sort_order);
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_project_benefits (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        section_label text,
        title_before text,
        title_italic text,
        title_after text,
        background_images jsonb NOT NULL DEFAULT '[]'::jsonb,
        items jsonb NOT NULL DEFAULT '[]'::jsonb,
        stats jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      DROP TRIGGER IF EXISTS campaign_benefits_set_updated_at ON campaign_project_benefits;
      CREATE TRIGGER campaign_benefits_set_updated_at
      BEFORE UPDATE ON campaign_project_benefits
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_project_highlights (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        num text,
        icon text,
        title text NOT NULL,
        text text,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_project_highlights_campaign_sort_idx
      ON campaign_project_highlights(campaign_id, sort_order);
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_social_infra_group (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        title text NOT NULL,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_social_infra_group_campaign_sort_idx
      ON campaign_social_infra_group(campaign_id, sort_order);
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_social_infra_item (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id uuid NOT NULL REFERENCES campaign_social_infra_group(id) ON DELETE CASCADE,
        name text NOT NULL,
        value text,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_social_infra_item_group_sort_idx
      ON campaign_social_infra_item(group_id, sort_order);
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS campaign_media (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
        kind text NOT NULL,
        url text NOT NULL,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS campaign_media_campaign_sort_idx ON campaign_media(campaign_id, sort_order);
    `);
  },

  async down(queryInterface) {
    const q = queryInterface.sequelize;
    await q.query(`DROP TABLE IF EXISTS campaign_media CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_social_infra_item CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_social_infra_group CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_project_highlights CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_project_benefits CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_project_images CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_project_overview CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_hero_data CASCADE;`);
    await q.query(`DROP TABLE IF EXISTS campaign_banner_data CASCADE;`);
  },
};
