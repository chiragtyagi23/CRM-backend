'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('capture_leads', 'campaign_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'campaign_master_table', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    await queryInterface.addIndex('capture_leads', ['campaign_id'], {
      name: 'capture_leads_campaign_id_idx',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('capture_leads', 'capture_leads_campaign_id_idx')
    await queryInterface.removeColumn('capture_leads', 'campaign_id')
  },
}
