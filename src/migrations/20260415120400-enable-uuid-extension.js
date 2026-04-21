'use strict'

module.exports = {
  async up(queryInterface) {
    // Required for uuid_generate_v4()
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  },

  async down(queryInterface) {
    // Keep extension (do not drop) to avoid affecting other tables
    await queryInterface.sequelize.query('SELECT 1;')
  },
}

