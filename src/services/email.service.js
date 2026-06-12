const nodemailer = require('nodemailer');
const { getCrmLoginUrl } = require('../config/appUrls');

let cachedTransporter = null;

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return cachedTransporter;
}

async function sendWelcomeUserEmail({ to, name, email, password, loginUrl }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = 'Your PropCRM account';
  const text = [
    `Hello ${name},`,
    '',
    'An account has been created for you on PropCRM.',
    '',
    `Login: ${loginUrl}`,
    `Email: ${email}`,
    `Password: ${password}`,
    '',
    'Please sign in and change your password when possible.',
    '',
    '— PropCRM',
  ].join('\n');

  const html = `
    <p>Hello ${escapeHtml(name)},</p>
    <p>An account has been created for you on <strong>PropCRM</strong>.</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><strong>Login</strong></td><td><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><strong>Password</strong></td><td><code>${escapeHtml(password)}</code></td></tr>
    </table>
    <p>Please sign in and change your password when possible.</p>
    <p>— PropCRM</p>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    console.log('[email] SMTP not configured — welcome email (dev only):');
    console.log({ to, name, email, password, loginUrl });
    return { devLogged: true };
  }

  await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = 'Reset your PropCRM password';
  const text = [
    `Hello ${name},`,
    '',
    'We received a request to reset your PropCRM password.',
    '',
    `Reset your password: ${resetUrl}`,
    '',
    'This link expires in 1 hour. If you did not request this, you can ignore this email.',
    '',
    '— PropCRM',
  ].join('\n');

  const html = `
    <p>Hello ${escapeHtml(name)},</p>
    <p>We received a request to reset your <strong>PropCRM</strong> password.</p>
    <p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p>
    <p class="muted">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    <p>— PropCRM</p>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    console.log('[email] SMTP not configured — password reset (dev only):');
    console.log({ to, name, resetUrl });
    return { devLogged: true };
  }

  await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

async function sendLeadEnquiryThankYouEmail({ to, name, source = '99acres' }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const brand = process.env.LEAD_EMAIL_BRAND_NAME || 'PropCRM';
  const subject = 'Thank you for your enquiry';
  const text = [
    `Hi ${name},`,
    '',
    `Thanks for your enquiry on ${source}.`,
    '',
    'Our team will contact you shortly.',
    '',
    `— ${brand}`,
  ].join('\n');

  const html = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thanks for your enquiry on <strong>${escapeHtml(source)}</strong>.</p>
    <p>Our team will contact you shortly.</p>
    <p>— ${escapeHtml(brand)}</p>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    console.log('[email] SMTP not configured — lead enquiry thank-you (dev only):');
    console.log({ to, name, source });
    return { devLogged: true };
  }

  await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

module.exports = {
  sendWelcomeUserEmail,
  sendPasswordResetEmail,
  sendLeadEnquiryThankYouEmail,
  getCrmLoginUrl,
  smtpConfigured,
};
