const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

const { sequelize } = require('../models');
const { findUserByEmail } = require('../queries/aclQueries');
const { isValidEmail, isStrongPassword } = require('../lib/password');
const { buildResetPasswordUrl } = require('../config/appUrls');
const { sendPasswordResetEmail } = require('./email.service');

const RESET_TTL_MS = Number(process.env.RESET_TOKEN_TTL_HOURS || 1) * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

async function requestPasswordReset(email) {
  const emailNorm = String(email || '').trim().toLowerCase();
  if (!emailNorm) return { error: 'Email is required', status: 400 };
  if (!isValidEmail(emailNorm)) return { error: 'Please enter a valid email address', status: 400 };

  const user = await findUserByEmail(emailNorm);
  if (!user || user.is_active === false) {
    return { message: genericSuccessMessage() };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await sequelize.query(`DELETE FROM password_reset_tokens WHERE user_id = :userId`, {
    replacements: { userId: user.id },
    type: QueryTypes.DELETE,
  });

  await sequelize.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
     VALUES (:userId, :tokenHash, :expiresAt, NOW())`,
    { replacements: { userId: user.id, tokenHash, expiresAt }, type: QueryTypes.INSERT },
  );

  const resetUrl = buildResetPasswordUrl(rawToken);
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || user.email,
      resetUrl,
    });
  } catch (err) {
    await sequelize.query(`DELETE FROM password_reset_tokens WHERE token_hash = :tokenHash`, {
      replacements: { tokenHash },
      type: QueryTypes.DELETE,
    });
    return { error: err.message || 'Failed to send reset email', status: 502 };
  }

  return { message: genericSuccessMessage() };
}

async function resetPasswordWithToken(token, password) {
  const rawToken = String(token || '').trim();
  if (!rawToken) return { error: 'Reset token is required', status: 400 };
  if (!password) return { error: 'Password is required', status: 400 };
  if (!isStrongPassword(password)) {
    return {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      status: 400,
    };
  }

  const tokenHash = hashToken(rawToken);
  const [row] = await sequelize.query(
    `SELECT t.id, t.user_id, t.expires_at
     FROM password_reset_tokens t
     WHERE t.token_hash = :tokenHash
     LIMIT 1`,
    { replacements: { tokenHash }, type: QueryTypes.SELECT },
  );

  if (!row) return { error: 'Invalid or expired reset link', status: 400 };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sequelize.query(`DELETE FROM password_reset_tokens WHERE id = :id`, {
      replacements: { id: row.id },
      type: QueryTypes.DELETE,
    });
    return { error: 'Invalid or expired reset link', status: 400 };
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  await sequelize.query(
    `UPDATE crm_signup SET password_hash = :passwordHash, updated_at = NOW() WHERE id = :userId`,
    { replacements: { passwordHash, userId: row.user_id }, type: QueryTypes.UPDATE },
  );
  await sequelize.query(`DELETE FROM password_reset_tokens WHERE user_id = :userId`, {
    replacements: { userId: row.user_id },
    type: QueryTypes.DELETE,
  });

  return { message: 'Password updated successfully. You can sign in now.' };
}

function genericSuccessMessage() {
  return 'If that email is registered, you will receive a password reset link shortly.';
}

module.exports = { requestPasswordReset, resetPasswordWithToken };
