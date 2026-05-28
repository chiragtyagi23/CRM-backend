'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existingRoles] = await queryInterface.sequelize.query(
      `SELECT COUNT(*)::int AS c FROM roles WHERE name IN ('admin', 'manager', 'viewer')`,
    );
    if (Number(existingRoles[0]?.c) >= 3) return;

    await queryInterface.bulkInsert('roles', [
      { name: 'admin', description: 'Full system access', created_at: new Date(), updated_at: new Date() },
      { name: 'manager', description: 'Operational CRM access', created_at: new Date(), updated_at: new Date() },
      { name: 'viewer', description: 'Read-only dashboard access', created_at: new Date(), updated_at: new Date() },
    ]);

    const [roleRows] = await queryInterface.sequelize.query(`SELECT id, name FROM roles`);
    const roleByName = Object.fromEntries(roleRows.map((r) => [r.name, r.id]));

    const moduleDefs = [
      { module_key: 'dashboard', name: 'Dashboard', route: '/dashboard', icon: 'grid', sort_order: 10 },
      { module_key: 'leads', name: 'Leads', route: '/leads', icon: 'user', sort_order: 20 },
      { module_key: 'capture_lead', name: 'Capture Lead', route: '/capture-lead', icon: 'userPlus', sort_order: 30 },
      { module_key: 'site_visits', name: 'Site Visits', route: '/site-visits', icon: 'pin', sort_order: 40 },
      { module_key: 'reports', name: 'Reports', route: '/reports', icon: 'chart', sort_order: 50 },
      { module_key: 'campaign', name: 'Campaigns', route: '/campaign', icon: 'grid', sort_order: 60 },
      { module_key: 'projects', name: 'Projects', route: '/projects', icon: 'grid', sort_order: 70 },
      { module_key: 'profile', name: 'Profile', route: '/profile', icon: 'user', sort_order: 80 },
      { module_key: 'admin_acl', name: 'ACL Admin', route: '/admin/acl', icon: 'shield', sort_order: 90 },
    ];

    for (const m of moduleDefs) {
      await queryInterface.sequelize.query(
        `INSERT INTO modules (module_key, name, route, icon, sort_order, is_active, created_at, updated_at)
         VALUES (:module_key, :name, :route, :icon, :sort_order, true, NOW(), NOW())
         ON CONFLICT (module_key) DO NOTHING`,
        { replacements: m },
      );
    }

    const [moduleRows] = await queryInterface.sequelize.query(`SELECT id, module_key FROM modules`);
    const modByKey = Object.fromEntries(moduleRows.map((m) => [m.module_key, m.id]));

    const link = async (roleName, keys) => {
      const roleId = roleByName[roleName];
      if (!roleId) return;
      for (const key of keys) {
        const moduleId = modByKey[key];
        if (!moduleId) continue;
        await queryInterface.sequelize.query(
          `INSERT INTO role_modules (role_id, module_id) VALUES (:roleId, :moduleId) ON CONFLICT DO NOTHING`,
          { replacements: { roleId, moduleId } },
        );
      }
    };

    const allKeys = moduleRows.map((m) => m.module_key);
    await link('admin', allKeys);
    await link('manager', [
      'dashboard',
      'leads',
      'capture_lead',
      'site_visits',
      'reports',
      'campaign',
      'projects',
      'profile',
    ]);
    await link('viewer', ['dashboard', 'profile']);

    const seedUsers = [
      { email: 'admin@crm.local', password: 'Admin@123', name: 'System Admin', role: 'admin' },
      { email: 'manager@crm.local', password: 'Manager@123', name: 'Ops Manager', role: 'manager' },
      { email: 'viewer@crm.local', password: 'Viewer@123', name: 'Read Only', role: 'viewer' },
    ];

    for (const u of seedUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      await queryInterface.sequelize.query(
        `INSERT INTO crm_signup (name, email, password_hash, role, role_id, is_active, created_at, updated_at)
         VALUES (:name, :email, :hash, :role, :role_id, true, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           role_id = EXCLUDED.role_id,
           role = EXCLUDED.role,
           is_active = true`,
        {
          replacements: {
            name: u.name,
            email: u.email,
            hash,
            role: u.role,
            role_id: roleByName[u.role],
          },
        },
      );
    }

    // Map existing crm_signup rows to role_id from text role column
    await queryInterface.sequelize.query(`
      UPDATE crm_signup cs
      SET role_id = r.id
      FROM roles r
      WHERE cs.role_id IS NULL
        AND cs.role IS NOT NULL
        AND LOWER(TRIM(cs.role)) = r.name
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_module_overrides', null, {});
    await queryInterface.bulkDelete('role_modules', null, {});
    await queryInterface.sequelize.query(
      `DELETE FROM crm_signup WHERE email IN ('admin@crm.local', 'manager@crm.local', 'viewer@crm.local')`,
    );
    await queryInterface.bulkDelete('modules', null, {});
    await queryInterface.bulkDelete('roles', { name: ['admin', 'manager', 'viewer'] }, {});
  },
};
