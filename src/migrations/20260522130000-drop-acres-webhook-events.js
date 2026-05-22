'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('acres_webhook_events')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('acres_webhook_events', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      event_type: { type: Sequelize.TEXT, allowNull: false },
      lead_id: { type: Sequelize.TEXT, allowNull: true },
      lead_uuid: { type: Sequelize.UUID, allowNull: true },
      http_status: { type: Sequelize.INTEGER, allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: true },
      meta: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    })
  },
}
