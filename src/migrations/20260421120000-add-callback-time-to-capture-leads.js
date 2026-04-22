'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "capture_leads" ADD COLUMN IF NOT EXISTS "callback_time" TEXT;',
    )
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE "capture_leads" DROP COLUMN IF EXISTS "callback_time";')
  },
}
