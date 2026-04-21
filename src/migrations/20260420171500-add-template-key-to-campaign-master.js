'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('campaign_master_table', 'template_key', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: 'luxury-template',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('campaign_master_table', 'template_key')
  },
}

