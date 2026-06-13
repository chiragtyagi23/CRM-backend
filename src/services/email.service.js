const nodemailer = require('nodemailer');
const { getCrmLoginUrl } = require('../config/appUrls');
const { toWhatsAppHref } = require('../lib/phone');

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

function getFromForProvider(provider) {
  if (provider === 'smtp') {
    return process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || getDefaultFrom();
  }
  return process.env.EMAIL_FROM?.trim() || process.env.RESEND_FROM?.trim() || 'onboarding@resend.dev';
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
  if (isHostedRuntime()) {
    if (resendConfigured()) {
      return sendViaResend({
        from: getFromForProvider('resend'),
        to,
        subject,
        text,
        html,
      });
    }
    throw new Error(
      'Email on Render requires RESEND_API_KEY (Gmail SMTP ports 587/465 are blocked on Render). ' +
        'Sign up at https://resend.com and set RESEND_API_KEY + EMAIL_FROM on Render.',
    );
  }

  // Local dev: prefer SMTP so welcome/reset emails reach any address (Resend sandbox is owner-only).
  if (smtpConfigured()) {
    return sendViaSmtp({
      from: getFromForProvider('smtp'),
      to,
      subject,
      text,
      html,
    });
  }

  if (resendConfigured()) {
    return sendViaResend({
      from: getFromForProvider('resend'),
      to,
      subject,
      text,
      html,
    });
  }

  console.log('[email] not configured — dev log only:', { to, subject });
  return { devLogged: true };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getLeadWhatsAppNumber() {
  return process.env.LEAD_WHATSAPP_NUMBER?.trim() || '7210789372';
}

function buildLeadEnquiryWhatsAppText({ name, phone, email, source, leadId, city, propertyId, message }) {
  const lines = [
    'Hello,',
    '',
    `I recently enquired on ${source || '99acres'} and would like to connect with your team.`,
    '',
    `Name: ${name || '—'}`,
    `Phone: ${phone || '—'}`,
  ];

  if (email?.trim()) lines.push(`Email: ${email.trim()}`);
  if (city?.trim()) lines.push(`City: ${city.trim()}`);
  if (propertyId?.trim()) lines.push(`Project: ${propertyId.trim()}`);
  if (message?.trim()) lines.push(`Enquiry: ${message.trim()}`);
  if (leadId?.trim()) lines.push(`Reference: ${leadId.trim()}`);

  lines.push('', 'Thank you.');
  return lines.join('\n');
}

function buildLeadEnquiryEmailContent({
  name,
  phone,
  email,
  source = '99acres',
  leadId,
  city,
  propertyId,
  message,
  propertyType,
}) {
  const brand = process.env.LEAD_EMAIL_BRAND_NAME || 'PropCRM';
  const whatsappText = buildLeadEnquiryWhatsAppText({
    name,
    phone,
    email,
    source,
    leadId,
    city,
    propertyId,
    message,
  });
  const whatsappHref = toWhatsAppHref(getLeadWhatsAppNumber(), whatsappText);

  const detailRows = [
    ['Name', name],
    ['Phone', phone],
    ['Email', email],
    ['City', city],
    ['Project', propertyId],
    ['Property type', propertyType],
    ['Enquiry', message],
    ['Reference ID', leadId],
    ['Source', source],
  ].filter(([, value]) => value != null && String(value).trim() !== '');

  const textDetails = detailRows.map(([label, value]) => `${label}: ${value}`).join('\n');

  const subject = propertyId?.trim()
    ? `Thank you for your enquiry — ${propertyId.trim()}`
    : 'Thank you for your enquiry';

  const text = [
    `Hi ${name},`,
    '',
    `Thank you for your enquiry on ${source}. Here are your details:`,
    '',
    textDetails,
    '',
    'Our team will contact you shortly.',
    whatsappHref ? `\nChat with us on WhatsApp: ${whatsappHref}` : '',
    '',
    `— ${brand}`,
  ]
    .filter(Boolean)
    .join('\n');

  const tableRows = detailRows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;">${escapeHtml(label)}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;font-weight:500;">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const whatsappButton = whatsappHref
    ? `<p style="margin:24px 0 8px;">
        <a href="${escapeHtml(whatsappHref)}"
           style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
          Chat with us on WhatsApp
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#666;">
        Tap the button to open WhatsApp with your enquiry details pre-filled. Just hit send to reach our team.
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#222;">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thank you for your enquiry on <strong>${escapeHtml(source)}</strong>. We have received the following details:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        ${tableRows}
      </table>
      <p>Our team will contact you shortly.</p>
      ${whatsappButton}
      <p style="margin-top:24px;color:#666;">— ${escapeHtml(brand)}</p>
    </div>
  `;

  return { subject, text, html, whatsappHref };
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

async function sendLeadEnquiryThankYouEmail({
  to,
  name,
  phone,
  email: leadEmail,
  source = '99acres',
  leadId,
  city,
  propertyId,
  message,
  propertyType,
}) {
  const { subject, text, html } = buildLeadEnquiryEmailContent({
    name,
    phone,
    email: leadEmail,
    source,
    leadId,
    city,
    propertyId,
    message,
    propertyType,
  });

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
