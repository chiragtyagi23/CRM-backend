'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('acres_webhook_leads', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      lead_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      property_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      phone: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      property_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      source_created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      webhook_payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    })

    await queryInterface.addIndex('acres_webhook_leads', ['lead_id'], {
      unique: true,
      name: 'acres_webhook_leads_lead_id_unique',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('acres_webhook_leads')
  },
}
