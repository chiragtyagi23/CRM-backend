const bcrypt = require('bcryptjs');

const { asyncHandler } = require('../lib/asyncHandler');
const { CrmSignup } = require('../models');
const { loginWithRbac, getMe, signToken } = require('../services/auth.service');
const aclService = require('../services/acl.service');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isStrongPassword(password) {
  const p = String(password || '');
  return p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password are required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
    });
  }
  const emailNorm = String(email).trim().toLowerCase();

  const existing = await CrmSignup.findOne({ where: { email: emailNorm } });
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const payload = {
    name: String(name).trim(),
    email: emailNorm,
    passwordHash,
    isActive: true,
  };
  if (role != null && String(role).trim() !== '') {
    payload.role = String(role).trim();
  }
  const created = await CrmSignup.create(payload);

  const token = signToken(
    { id: created.id, email: created.email, role_id: created.roleId ?? null, role_name: created.role },
    created.role,
  );
  res.status(201).json({
    token,
    user: { id: created.id, name: created.name, email: created.email, role: created.role },
    access: { modules: [] },
  });
});

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

/** Directory users for dropdowns (crm_signup). */
const listUsers = asyncHandler(async (req, res) => {
  const role = String((req.query && req.query.role) || '').trim().toLowerCase();

  try {
    const items = await aclService.listUsers();
    const filtered = role
      ? items.filter((u) => String(u.role_name || '').toLowerCase() === role)
      : items;
    return res.json({
      items: filtered.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role_name,
      })),
    });
  } catch (err) {
    const where = {};
    if (role) where.role = role;
    const legacy = await CrmSignup.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'created_at', 'updated_at'],
    });
    res.json({ items: legacy });
  }
});

module.exports = { signup, login, me, listUsers };
