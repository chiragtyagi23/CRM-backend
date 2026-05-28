'use strict';

/**
 * Use existing crm_signup as the RBAC user table instead of a separate users table.
 * Adds role_id + is_active to crm_signup, repoints overrides FK, drops users.
 */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;

    // Extend crm_signup for RBAC
    await q.query(`
      ALTER TABLE crm_signup
        ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS crm_signup_role_id_idx ON crm_signup(role_id)`);
    await q.query(`CREATE INDEX IF NOT EXISTS crm_signup_is_active_idx ON crm_signup(is_active)`);

    // Map legacy text role -> roles.id where possible
    await q.query(`
      UPDATE crm_signup cs
      SET role_id = r.id
      FROM roles r
      WHERE cs.role_id IS NULL
        AND cs.role IS NOT NULL
        AND LOWER(TRIM(cs.role)) = r.name
    `);

    // If a separate users table exists (from earlier RBAC migration), merge into crm_signup
    const [userTable] = await q.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    if (userTable.length > 0) {
      await q.query(`
        UPDATE crm_signup cs
        SET role_id = COALESCE(cs.role_id, u.role_id),
            is_active = u.is_active
        FROM users u
        WHERE LOWER(cs.email) = LOWER(u.email)
      `);

      await q.query(`
        INSERT INTO crm_signup (name, email, password_hash, role, role_id, is_active, created_at, updated_at)
        SELECT
          TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
          u.email,
          u.password_hash,
          COALESCE(r.name, 'no-role'),
          u.role_id,
          u.is_active,
          u.created_at,
          u.updated_at
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE NOT EXISTS (
          SELECT 1 FROM crm_signup cs WHERE LOWER(cs.email) = LOWER(u.email)
        )
      `);

      // Remap override user_ids from users.id -> crm_signup.id (same email)
      await q.query(`
        UPDATE user_module_overrides o
        SET user_id = cs.id
        FROM users u
        JOIN crm_signup cs ON LOWER(cs.email) = LOWER(u.email)
        WHERE o.user_id = u.id AND cs.id IS DISTINCT FROM o.user_id
      `);
    }

    // Repoint overrides FK to crm_signup
    await q.query(`
      ALTER TABLE user_module_overrides
        DROP CONSTRAINT IF EXISTS user_module_overrides_user_id_fkey
    `);
    await q.query(`
      ALTER TABLE user_module_overrides
        ADD CONSTRAINT user_module_overrides_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES crm_signup(id) ON DELETE CASCADE
    `);

    // Drop redundant users table
    if (userTable.length > 0) {
      await queryInterface.dropTable('users');
    }

    // Keep text role in sync for legacy code paths
    await q.query(`
      UPDATE crm_signup cs
      SET role = r.name
      FROM roles r
      WHERE cs.role_id = r.id AND (cs.role IS NULL OR cs.role IS DISTINCT FROM r.name)
    `);
  },

  async down(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;

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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await q.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, created_at, updated_at)
      SELECT
        id, email, password_hash,
        split_part(name, ' ', 1),
        NULLIF(TRIM(substring(name from position(' ' in name))), ''),
        role_id, is_active, created_at, updated_at
      FROM crm_signup
    `);

    await q.query(`ALTER TABLE user_module_overrides DROP CONSTRAINT IF EXISTS user_module_overrides_user_id_fkey`);
    await q.query(`
      ALTER TABLE user_module_overrides
        ADD CONSTRAINT user_module_overrides_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);

    await q.query(`ALTER TABLE crm_signup DROP COLUMN IF EXISTS role_id`);
    await q.query(`ALTER TABLE crm_signup DROP COLUMN IF EXISTS is_active`);
  },
};
