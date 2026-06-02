const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { findUserByEmail, findUserById, getAccessibleModulesForUser, getUserOverrides } = require('../queries/aclQueries');
const { buildPermissionsFromAccess } = require('../acl/permissionMap');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev_secret_change_me';
}

function signToken(user, roleName) {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name || user.email,
      email: user.email,
      roleId: user.role_id,
      role: roleName,
    },
    getJwtSecret(),
    { expiresIn: '7d' },
  );
}

function formatUserResponse(user) {
  return {
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    role: user.role_name
      ? { id: user.role_id, name: user.role_name, description: user.role_description || null }
      : null,
  };
}

async function loginWithRbac(email, password) {
  const emailNorm = String(email).trim().toLowerCase();
  const user = await findUserByEmail(emailNorm);

  if (!user) return { error: 'User does not exist', status: 404 };
  if (user.is_active === false) return { error: 'Account disabled', status: 403 };

  const ok = await bcrypt.compare(String(password), String(user.password_hash));
  if (!ok) return { error: 'Wrong password', status: 401 };

  // User without role_id still logs in but gets no modules (default deny)
  const modules = user.role_id ? await getAccessibleModulesForUser(user.id) : [];
  const overrides = await getUserOverrides(user.id);
  const permissions = buildPermissionsFromAccess(modules, overrides);
  const token = signToken(user, user.role_name);

  return {
    token,
    user: formatUserResponse(user),
    access: {
      modules: modules.map((m) => ({
        id: m.id,
        module_key: m.module_key,
        name: m.name,
        route: m.route,
        icon: m.icon,
        parent_id: m.parent_id,
        sort_order: m.sort_order,
      })),
      overrides: overrides.map((o) => ({
        id: o.id,
        module_id: o.module_id,
        module_key: o.module_key,
        effect: o.effect,
        reason: o.reason,
      })),
      permissions,
    },
  };
}

async function getMe(userId) {
  const user = await findUserById(userId);
  if (!user || user.is_active === false) return null;

  const modules = user.role_id ? await getAccessibleModulesForUser(userId) : [];
  const overrides = await getUserOverrides(userId);
  const permissions = buildPermissionsFromAccess(modules, overrides);

  return {
    user: formatUserResponse(user),
    access: {
      modules: modules.map((m) => ({
        id: m.id,
        module_key: m.module_key,
        name: m.name,
        route: m.route,
        icon: m.icon,
        parent_id: m.parent_id,
        sort_order: m.sort_order,
      })),
      overrides: overrides.map((o) => ({
        id: o.id,
        module_id: o.module_id,
        module_key: o.module_key,
        effect: o.effect,
        reason: o.reason,
      })),
      permissions,
    },
  };
}

module.exports = { loginWithRbac, getMe, getJwtSecret, signToken, formatUserResponse };
