"use strict";

/** Fix legacy typo table names so Sequelize models match Postgres. */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;

    await q.query(`
      DO $$
      BEGIN
        IF to_regclass('public.campaing_document_table') IS NOT NULL
           AND to_regclass('public.campaign_document_table') IS NULL THEN
          ALTER TABLE campaing_document_table RENAME TO campaign_document_table;
        END IF;
      END $$;
    `);

    await q.query(`
      DO $$
      BEGIN
        IF to_regclass('public.campaing_size_floor') IS NOT NULL
           AND to_regclass('public.campaign_size_floor') IS NULL THEN
          ALTER TABLE campaing_size_floor RENAME TO campaign_size_floor;
        END IF;
      END $$;
    `);

    await q.query(`
      DO $$
      BEGIN
        IF to_regclass('public.campaign_ananities') IS NOT NULL
           AND to_regclass('public.campaign_amenities') IS NULL THEN
          ALTER TABLE campaign_ananities RENAME TO campaign_amenities;
        END IF;
      END $$;
    `);
  },

  async down(queryInterface) {
    const q = queryInterface.sequelize;

    await q.query(`
      DO $$
      BEGIN
        IF to_regclass('public.campaign_document_table') IS NOT NULL
           AND to_regclass('public.campaing_document_table') IS NULL THEN
          ALTER TABLE campaign_document_table RENAME TO campaing_document_table;
        END IF;
      END $$;
    `);

    await q.query(`
      DO $$
      BEGIN
        IF to_regclass('public.campaign_size_floor') IS NOT NULL
           AND to_regclass('public.campaing_size_floor') IS NULL THEN
          ALTER TABLE campaign_size_floor RENAME TO campaing_size_floor;
        END IF;
      END $$;
    `);

    await q.query(`
      DO $$
      BEGIN
        IF to_regclass('public.campaign_amenities') IS NOT NULL
           AND to_regclass('public.campaign_ananities') IS NULL THEN
          ALTER TABLE campaign_amenities RENAME TO campaign_ananities;
        END IF;
      END $$;
    `);
  },
};
