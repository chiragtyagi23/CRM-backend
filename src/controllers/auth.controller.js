const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { asyncHandler } = require("../lib/asyncHandler");
const { CrmSignup } = require("../models");

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: "7d" },
  );
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password are required" });
  }
  const emailNorm = String(email).trim().toLowerCase(); 

  const existing = await CrmSignup.findOne({ where: { email: emailNorm } });
  if (existing) return res.status(409).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const payload = {
    name: String(name).trim(),
    email: emailNorm,
    passwordHash,
  };
  // Omit null/empty role so INSERT leaves role NULL (after nullable migration); otherwise set explicit role.
  if (role != null && String(role).trim() !== "") {
    payload.role = String(role).trim();
  }
  const created = await CrmSignup.create(payload);

  const token = signToken(created);
  res.status(201).json({
    token,
    user: { id: created.id, name: created.name, email: created.email, role: created.role },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const emailNorm = String(email).trim().toLowerCase();
  const user = await CrmSignup.findOne({ where: { email: emailNorm } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(String(password), String(user.passwordHash));
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Admin helper: list users from crm_signup table (for dropdowns like "CALL BY").
const listUsers = asyncHandler(async (req, res) => {
  const role = String((req.query && req.query.role) || "").trim().toLowerCase();
  const where = {};
  if (role) where.role = role;

  const items = await CrmSignup.findAll({
    where,
    order: [["created_at", "DESC"]],
    attributes: ["id", "name", "email", "role", "created_at", "updated_at"],
  });

  res.json({ items });
});

module.exports = { signup, login, listUsers };

