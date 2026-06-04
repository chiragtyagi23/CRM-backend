'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE capture_leads
      ADD COLUMN IF NOT EXISTS activity_timeline JSONB NOT NULL DEFAULT '[]'::jsonb;
    `)
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('capture_leads', 'activity_timeline')
  },
}
