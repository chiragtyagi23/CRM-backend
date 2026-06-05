const { asyncHandler } = require('../lib/asyncHandler');
const { MODULE_KEYS } = require('../acl/permissionMap');
const { loginWithRbac, getMe } = require('../services/auth.service');
const aclService = require('../services/acl.service');
const { inviteUser } = require('../services/userInvite.service');
const { requestPasswordReset, resetPasswordWithToken } = require('../services/passwordReset.service');
const { isValidEmail } = require('../lib/password');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });

  const result = await loginWithRbac(email, password);
  if (result.error) return res.status(result.status || 401).json({ error: result.error });
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  const data = await getMe(req.user.sub);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  res.json(data);
});

/**
 * Minimal assignee list for capture-lead / lead-reassign dropdowns.
 * - leads.assignto: all active user names
 * - capture_lead only: current user only (no full directory leak)
 */
const listAssignees = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const canAssign = await aclService.userCanAccessModule(userId, MODULE_KEYS.leads.assignTo);
  if (canAssign) {
    const rows = await aclService.listActiveAssigneeNames();
    return res.json({
      items: rows.map((u) => ({
        id: u.id,
        name: String(u.name || '').trim() || u.id,
      })),
    });
  }

  const me = await getMe(userId);
  if (!me?.user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({
    items: [{ id: me.user.id, name: String(me.user.name || '').trim() || me.user.email }],
  });
});

/** Full user directory — Profile admin table only (email, role, etc.). */
const listUsers = asyncHandler(async (req, res) => {
  const role = String((req.query && req.query.role) || '').trim().toLowerCase();

  const items = await aclService.listUsers();
  const filtered = role
    ? items.filter((u) => String(u.role_name || '').toLowerCase() === role)
    : items;
  res.json({
    items: filtered.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role_name,
      created_at: u.created_at,
    })),
  });
});

/** Role list for Profile “New user” (does not require admin_acl). */
const listRoles = asyncHandler(async (_req, res) => {
  const items = await aclService.listRoles();
  res.json({ items });
});

/** Create user with selected role (or worker default); random password emailed to the user. */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, roleId } = req.body || {};
  const result = await inviteUser({ name, email, roleId });
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.status(201).json({ user: result.user, message: 'User created and welcome email sent' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const result = await requestPasswordReset(email);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json({ message: result.message });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  const result = await resetPasswordWithToken(token, password);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json({ message: result.message });
});

module.exports = {
  createUser,
  login,
  me,
  listAssignees,
  listUsers,
  listRoles,
  forgotPassword,
  resetPassword,
};
