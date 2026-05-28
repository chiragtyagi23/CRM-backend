const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/** RBAC user table is crm_signup (not a separate users table). */
const USER_TABLE = 'crm_signup';

async function findUserByEmail(email) {
  const rows = await sequelize.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.is_active,
            r.id AS role_id, r.name AS role_name, r.description AS role_description
     FROM ${USER_TABLE} u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE LOWER(u.email) = LOWER(:email)
     LIMIT 1`,
    { replacements: { email }, type: QueryTypes.SELECT },
  );
  return rows[0] || null;
}

async function findUserById(userId) {
  const rows = await sequelize.query(
    `SELECT u.id, u.name, u.email, u.is_active,
            r.id AS role_id, r.name AS role_name, r.description AS role_description
     FROM ${USER_TABLE} u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.id = :userId
     LIMIT 1`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
  return rows[0] || null;
}

async function getRoleModulesForUser(userId) {
  return sequelize.query(
    `SELECT m.id, m.module_key, m.name, m.route, m.icon, m.parent_id, m.sort_order
     FROM ${USER_TABLE} u
     JOIN role_modules rm ON rm.role_id = u.role_id
     JOIN modules m ON m.id = rm.module_id AND m.is_active = true
     WHERE u.id = :userId
     ORDER BY m.sort_order ASC, m.name ASC`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
}

async function getUserOverrides(userId) {
  return sequelize.query(
    `SELECT o.id, o.user_id, o.module_id, o.effect, o.reason, o.created_at,
            m.module_key, m.name AS module_name, m.route
     FROM user_module_overrides o
     JOIN modules m ON m.id = o.module_id
     WHERE o.user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
}

async function getAccessibleModulesForUser(userId) {
  const [roleModules, overrides] = await Promise.all([
    getRoleModulesForUser(userId),
    getUserOverrides(userId),
  ]);

  const { resolveAccessibleModuleKeys } = require('../acl/resolveAccess');
  const allowedKeys = resolveAccessibleModuleKeys(roleModules, overrides);

  const byKey = new Map();
  for (const m of roleModules) byKey.set(m.module_key, m);

  const extraIds = overrides
    .filter((o) => String(o.effect).toUpperCase() === 'ALLOW' && !byKey.has(o.module_key))
    .map((o) => o.module_id);

  if (extraIds.length) {
    const extras = await sequelize.query(
      `SELECT id, module_key, name, route, icon, parent_id, sort_order
       FROM modules WHERE id IN (:ids) AND is_active = true`,
      { replacements: { ids: extraIds }, type: QueryTypes.SELECT },
    );
    for (const m of extras) byKey.set(m.module_key, m);
  }

  return [...byKey.values()]
    .filter((m) => allowedKeys.has(m.module_key))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

module.exports = {
  findUserByEmail,
  findUserById,
  getRoleModulesForUser,
  getUserOverrides,
  getAccessibleModulesForUser,
};
