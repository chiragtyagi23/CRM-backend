const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { resolveAccessibleModuleKeys, hasModuleAccess } = require('../acl/resolveAccess');
const {
  getRoleModulesForUser,
  getUserOverrides,
  getAccessibleModulesForUser,
} = require('../queries/aclQueries');

async function listRoles() {
  return sequelize.query(
    `SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name ASC`,
    { type: QueryTypes.SELECT },
  );
}

async function createRole({ name, description }) {
  const [row] = await sequelize.query(
    `INSERT INTO roles (name, description, created_at, updated_at)
     VALUES (:name, :description, NOW(), NOW())
     RETURNING id, name, description, created_at, updated_at`,
    {
      replacements: { name: String(name).trim(), description: description || null },
      type: QueryTypes.SELECT,
    },
  );
  return row;
}

async function updateRole(id, { name, description }) {
  const [row] = await sequelize.query(
    `UPDATE roles SET name = COALESCE(:name, name), description = COALESCE(:description, description), updated_at = NOW()
     WHERE id = :id
     RETURNING id, name, description, created_at, updated_at`,
    {
      replacements: {
        id,
        name: name != null ? String(name).trim() : null,
        description: description !== undefined ? description : null,
      },
      type: QueryTypes.SELECT,
    },
  );
  return row || null;
}

async function deleteRole(id) {
  const result = await sequelize.query(`DELETE FROM roles WHERE id = :id`, {
    replacements: { id },
    type: QueryTypes.DELETE,
  });
  return result;
}

async function listModules() {
  return sequelize.query(
    `SELECT id, module_key, name, route, icon, parent_id, sort_order, is_active, created_at, updated_at
     FROM modules ORDER BY sort_order ASC, name ASC`,
    { type: QueryTypes.SELECT },
  );
}

async function createModule(payload) {
  const [row] = await sequelize.query(
    `INSERT INTO modules (module_key, name, route, icon, parent_id, sort_order, is_active, created_at, updated_at)
     VALUES (:module_key, :name, :route, :icon, :parent_id, :sort_order, :is_active, NOW(), NOW())
     RETURNING *`,
    { replacements: payload, type: QueryTypes.SELECT },
  );
  return row;
}

async function updateModule(id, payload) {
  const [row] = await sequelize.query(
    `UPDATE modules SET
       module_key = COALESCE(:module_key, module_key),
       name = COALESCE(:name, name),
       route = COALESCE(:route, route),
       icon = COALESCE(:icon, icon),
       parent_id = :parent_id,
       sort_order = COALESCE(:sort_order, sort_order),
       is_active = COALESCE(:is_active, is_active),
       updated_at = NOW()
     WHERE id = :id
     RETURNING *`,
    { replacements: { id, ...payload, parent_id: payload.parent_id ?? null }, type: QueryTypes.SELECT },
  );
  return row || null;
}

async function deleteModule(id) {
  await sequelize.query(`DELETE FROM modules WHERE id = :id`, { replacements: { id }, type: QueryTypes.DELETE });
}

async function getRoleModuleIds(roleId) {
  const rows = await sequelize.query(
    `SELECT module_id FROM role_modules WHERE role_id = :roleId`,
    { replacements: { roleId }, type: QueryTypes.SELECT },
  );
  return rows.map((r) => r.module_id);
}

async function setRoleModules(roleId, moduleIds) {
  const t = await sequelize.transaction();
  try {
    await sequelize.query(`DELETE FROM role_modules WHERE role_id = :roleId`, {
      replacements: { roleId },
      transaction: t,
    });
    for (const moduleId of moduleIds) {
      await sequelize.query(
        `INSERT INTO role_modules (role_id, module_id) VALUES (:roleId, :moduleId) ON CONFLICT DO NOTHING`,
        { replacements: { roleId, moduleId }, transaction: t },
      );
    }
    await t.commit();
    return getRoleModuleIds(roleId);
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

async function listUsers() {
  return sequelize.query(
    `SELECT u.id, u.name, u.email, u.is_active, u.role_id,
            r.name AS role_name, u.created_at, u.updated_at
     FROM crm_signup u
     LEFT JOIN roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC`,
    { type: QueryTypes.SELECT },
  );
}

/** Active users — id + name only (assignee / lead-received-by dropdowns). */
async function listActiveAssigneeNames() {
  return sequelize.query(
    `SELECT u.id, u.name
     FROM crm_signup u
     WHERE u.is_active IS DISTINCT FROM false
     ORDER BY u.name ASC`,
    { type: QueryTypes.SELECT },
  );
}

async function updateUserRole(userId, roleId) {
  const [row] = await sequelize.query(
    `UPDATE crm_signup
     SET role_id = :roleId,
         updated_at = NOW()
     WHERE id = :userId
     RETURNING id, name, email, role_id, is_active`,
    { replacements: { userId, roleId }, type: QueryTypes.SELECT },
  );
  return row || null;
}

async function listOverrides(userId) {
  return getUserOverrides(userId);
}

async function createOverride({ userId, moduleId, effect, reason }) {
  const [row] = await sequelize.query(
    `INSERT INTO user_module_overrides (user_id, module_id, effect, reason, created_at)
     VALUES (:userId, :moduleId, :effect, :reason, NOW())
     ON CONFLICT (user_id, module_id) DO UPDATE SET effect = EXCLUDED.effect, reason = EXCLUDED.reason
     RETURNING *`,
    {
      replacements: {
        userId,
        moduleId,
        effect: String(effect).toUpperCase(),
        reason: reason || null,
      },
      type: QueryTypes.SELECT,
    },
  );
  return row;
}

async function deleteOverride(id) {
  await sequelize.query(`DELETE FROM user_module_overrides WHERE id = :id`, {
    replacements: { id },
    type: QueryTypes.DELETE,
  });
}

async function userCanAccessModule(userId, moduleKey) {
  const [roleModules, overrides] = await Promise.all([
    getRoleModulesForUser(userId),
    getUserOverrides(userId),
  ]);
  const allowed = resolveAccessibleModuleKeys(roleModules, overrides);
  return hasModuleAccess(moduleKey, allowed);
}

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listModules,
  createModule,
  updateModule,
  deleteModule,
  getRoleModuleIds,
  setRoleModules,
  listUsers,
  listActiveAssigneeNames,
  updateUserRole,
  listOverrides,
  createOverride,
  deleteOverride,
  userCanAccessModule,
  getAccessibleModulesForUser,
};
