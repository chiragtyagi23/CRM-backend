'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      name: { type: Sequelize.TEXT, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
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
    });

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      email: { type: Sequelize.TEXT, allowNull: false, unique: true },
      password_hash: { type: Sequelize.TEXT, allowNull: false },
      first_name: { type: Sequelize.TEXT, allowNull: false },
      last_name: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'roles', key: 'id' },
        onDelete: 'SET NULL',
      },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
    });

    await queryInterface.addIndex('users', ['role_id']);
    await queryInterface.addIndex('users', ['is_active']);

    await queryInterface.createTable('modules', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      module_key: { type: Sequelize.TEXT, allowNull: false, unique: true },
      name: { type: Sequelize.TEXT, allowNull: false },
      route: { type: Sequelize.TEXT, allowNull: false },
      icon: { type: Sequelize.TEXT, allowNull: true },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'modules', key: 'id' },
        onDelete: 'SET NULL',
      },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
    });

    await queryInterface.addIndex('modules', ['parent_id', 'sort_order']);

    await queryInterface.createTable('role_modules', {
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE',
      },
      module_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'modules', key: 'id' },
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.createTable('user_module_overrides', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      module_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'modules', key: 'id' },
        onDelete: 'CASCADE',
      },
      effect: { type: Sequelize.TEXT, allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE user_module_overrides ADD CONSTRAINT user_module_overrides_effect_check CHECK (effect IN ('ALLOW', 'DENY'))`,
    );

    await queryInterface.addIndex('user_module_overrides', ['user_id']);
    await queryInterface.addConstraint('user_module_overrides', {
      fields: ['user_id', 'module_id'],
      type: 'unique',
      name: 'user_module_overrides_user_module_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_module_overrides');
    await queryInterface.dropTable('role_modules');
    await queryInterface.dropTable('modules');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('roles');
  },
};
