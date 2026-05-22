'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('webhook_inbox')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('webhook_inbox', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      source: { type: Sequelize.TEXT, allowNull: false, defaultValue: '99acres' },
      method: { type: Sequelize.TEXT, allowNull: false },
      query: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      headers: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      body: { type: Sequelize.JSONB, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    })
  },
}
