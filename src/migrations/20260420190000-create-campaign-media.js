'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaign_media', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'campaign_master_table', key: 'id' },
        onDelete: 'CASCADE',
      },
      kind: { type: Sequelize.TEXT, allowNull: false },
      url: { type: Sequelize.TEXT, allowNull: false },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    })

    await queryInterface.addIndex('campaign_media', ['campaign_id', 'sort_order'], {
      name: 'campaign_media_campaign_sort_idx',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('campaign_media')
  },
}

