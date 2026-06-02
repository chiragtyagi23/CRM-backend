'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'crm_signup', key: 'id' },
        onDelete: 'CASCADE',
      },
      token_hash: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('password_reset_tokens', ['user_id']);
    await queryInterface.addIndex('password_reset_tokens', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('password_reset_tokens');
  },
};
