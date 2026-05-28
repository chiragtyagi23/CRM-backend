'use strict';

/** Leads parent + action children: leads.assignto, leads.delete */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;

    await q.query(`
      INSERT INTO modules (module_key, name, route, icon, parent_id, sort_order, is_active, created_at, updated_at)
      VALUES ('leads', 'Leads', '/leads', 'user', NULL, 20, true, NOW(), NOW())
      ON CONFLICT (module_key) DO UPDATE SET name = EXCLUDED.name, route = EXCLUDED.route, updated_at = NOW()
    `);

    const [leadsRows] = await q.query(`SELECT id FROM modules WHERE module_key = 'leads' LIMIT 1`);
    const leadsRow = leadsRows[0];
    if (!leadsRow?.id) return;

    const children = [
      { module_key: 'leads.assignto', name: 'Leads', route: '/leads', sort_order: 1 },
      { module_key: 'leads.delete', name: 'Leads', route: '/leads', sort_order: 2 },
    ];

    for (const c of children) {
      await q.query(
        `INSERT INTO modules (module_key, name, route, icon, parent_id, sort_order, is_active, created_at, updated_at)
         VALUES (:module_key, :name, :route, 'user', :parent_id, :sort_order, true, NOW(), NOW())
         ON CONFLICT (module_key) DO UPDATE SET
           parent_id = EXCLUDED.parent_id,
           name = EXCLUDED.name,
           route = EXCLUDED.route,
           sort_order = EXCLUDED.sort_order,
           updated_at = NOW()`,
        { replacements: { ...c, parent_id: leadsRow.id } },
      );
    }

    // Grant admin role all new child modules
    const [adminRole] = await q.query(`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`);
    if (adminRole[0]?.id) {
      const [mods] = await q.query(
        `SELECT id FROM modules WHERE module_key IN ('leads', 'leads.assignto', 'leads.delete')`,
      );
      for (const m of mods) {
        await q.query(
          `INSERT INTO role_modules (role_id, module_id) VALUES (:roleId, :moduleId) ON CONFLICT DO NOTHING`,
          { replacements: { roleId: adminRole[0].id, moduleId: m.id } },
        );
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM modules WHERE module_key IN ('leads.assignto', 'leads.delete')`,
    );
  },
};
