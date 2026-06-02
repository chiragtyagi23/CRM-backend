const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

const { CrmSignup, sequelize } = require('../models');
const { generateRandomPassword, isValidEmail } = require('../lib/password');
const { sendWelcomeUserEmail, getCrmLoginUrl } = require('./email.service');

const DEFAULT_WORKER_ROLE_ID = 'fc00ddf9-53c6-4a46-8716-4cf93b87d935';

async function resolveRoleName(roleId) {
  const [row] = await sequelize.query(`SELECT name FROM roles WHERE id = :roleId LIMIT 1`, {
    replacements: { roleId },
    type: QueryTypes.SELECT,
  });
  return row?.name ?? 'worker';
}

async function inviteUser({ name, email, roleId = DEFAULT_WORKER_ROLE_ID }) {
  const trimmedName = String(name || '').trim();
  const emailNorm = String(email || '').trim().toLowerCase();

  if (!trimmedName) return { error: 'Name is required', status: 400 };
  if (!emailNorm) return { error: 'Email is required', status: 400 };
  if (!isValidEmail(emailNorm)) return { error: 'Please enter a valid email address', status: 400 };

  const existing = await CrmSignup.findOne({ where: { email: emailNorm } });
  if (existing) return { error: 'Email already exists', status: 409 };

  const roleName = await resolveRoleName(roleId);
  const plainPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const created = await CrmSignup.create({
    name: trimmedName,
    email: emailNorm,
    passwordHash,
    roleId,
    isActive: true,
  });

  const loginUrl = getCrmLoginUrl();
  try {
    await sendWelcomeUserEmail({
      to: emailNorm,
      name: trimmedName,
      email: emailNorm,
      password: plainPassword,
      loginUrl,
    });
  } catch (err) {
    await created.destroy();
    return { error: err.message || 'Failed to send welcome email', status: 502 };
  }

  return {
    user: {
      id: created.id,
      name: created.name,
      email: created.email,
      role: roleName,
      created_at: created.createdAt,
    },
  };
}

module.exports = { inviteUser, DEFAULT_WORKER_ROLE_ID };
