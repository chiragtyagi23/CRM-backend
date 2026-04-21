'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: some environments already have this column.
    await queryInterface.sequelize.query('ALTER TABLE "capture_leads" ADD COLUMN IF NOT EXISTS "email" TEXT;')
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('capture_leads', 'email')
  },
}

