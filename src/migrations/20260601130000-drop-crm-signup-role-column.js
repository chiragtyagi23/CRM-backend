'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('crm_signup', 'role');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('crm_signup', 'role', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE crm_signup cs
      SET role = r.name
      FROM roles r
      WHERE cs.role_id = r.id
    `);
  },
};
