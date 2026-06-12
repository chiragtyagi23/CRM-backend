const nodemailer = require('nodemailer');
const { getCrmLoginUrl } = require('../config/appUrls');

let cachedTransporter = null;

function normalizeSmtpPass(raw) {
  return String(raw ?? '').replace(/\s+/g, '').trim();
}

function isHostedRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
}

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_USER?.trim() && normalizeSmtpPass(process.env.SMTP_PASS));
}

function emailConfigured() {
  return resendConfigured() || smtpConfigured();
}

function getDefaultFrom() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    'onboarding@resend.dev'
  );
}

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!cachedTransporter) {
    const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: normalizeSmtpPass(process.env.SMTP_PASS),
      },
    });
  }
  return cachedTransporter;
}

async function sendViaResend({ from, to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API failed (${response.status}): ${body}`);
  }

  return { sent: true, provider: 'resend' };
}

async function sendViaSmtp({ from, to, subject, text, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('SMTP is not configured');
  }
  await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, provider: 'smtp' };
}

async function deliverEmail({ to, subject, text, html }) {
  const from = getDefaultFrom();

  if (isHostedRuntime()) {
    if (resendConfigured()) {
      return sendViaResend({ from, to, subject, text, html });
    }
    throw new Error(
      'Email on Render requires RESEND_API_KEY (Gmail SMTP ports 587/465 are blocked on Render). ' +
        'Sign up at https://resend.com and set RESEND_API_KEY + EMAIL_FROM on Render.',
    );
  }

  if (resendConfigured()) {
    return sendViaResend({ from, to, subject, text, html });
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[email] not configured — dev log only:', { to, subject });
    return { devLogged: true };
  }

  return sendViaSmtp({ from, to, subject, text, html });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendWelcomeUserEmail({ to, name, email, password, loginUrl }) {
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

  return deliverEmail({ to, subject, text, html });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
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

  return deliverEmail({ to, subject, text, html });
}

async function sendLeadEnquiryThankYouEmail({ to, name, source = '99acres' }) {
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

  return deliverEmail({ to, subject, text, html });
}

module.exports = {
  sendWelcomeUserEmail,
  sendPasswordResetEmail,
  sendLeadEnquiryThankYouEmail,
  getCrmLoginUrl,
  smtpConfigured,
  emailConfigured,
};
