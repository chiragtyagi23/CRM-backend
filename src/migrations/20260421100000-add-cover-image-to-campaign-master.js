'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('campaign_master_table', 'cover_image', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('campaign_master_table', 'cover_image')
  },
}

