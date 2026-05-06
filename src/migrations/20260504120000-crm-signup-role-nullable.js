"use strict";

/** Align DB with Sequelize model: role may be NULL; no implicit default on INSERT. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE crm_signup ALTER COLUMN role DROP DEFAULT");
    await queryInterface.sequelize.query("ALTER TABLE crm_signup ALTER COLUMN role DROP NOT NULL");
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE crm_signup SET role = 'no-role' WHERE role IS NULL",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE crm_signup ALTER COLUMN role SET DEFAULT 'no-role'",
    );
    await queryInterface.sequelize.query("ALTER TABLE crm_signup ALTER COLUMN role SET NOT NULL");
  },
};
