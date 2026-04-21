'use strict'

module.exports = {
  async up(queryInterface) {
    // Only changes DEFAULT for new rows (does not update existing users).
    await queryInterface.sequelize.query("ALTER TABLE crm_signup ALTER COLUMN role SET DEFAULT 'no-role'")
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE crm_signup ALTER COLUMN role SET DEFAULT 'user'")
  },
}

