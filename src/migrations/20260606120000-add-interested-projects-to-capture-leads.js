'use strict';

/** Store campaigns/projects a lead is interested in (Lead Details only). */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE capture_leads
      ADD COLUMN IF NOT EXISTS interested_projects JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('capture_leads', 'interested_projects');
  },
};
