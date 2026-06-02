/** Trim and strip trailing slashes from a URL string. */
function trimUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function isLocalOrigin(url) {
  return /localhost|127\.0\.0\.1/i.test(String(url || ''));
}

function isUsablePublicAppUrl(url) {
  const u = trimUrl(url);
  if (!u) return false;
  if (isLocalOrigin(u)) return false;
  if (/your-crm-frontend\.vercel\.app/i.test(u)) return false;
  return true;
}

/**
 * Public CRM web app origin (no path). Used for email links.
 * Set CRM_APP_URL in production — never use localhost for outbound emails.
 */
function getCrmAppUrl() {
  const explicit = trimUrl(process.env.CRM_APP_URL || process.env.CRM_FRONTEND_URL);
  if (isUsablePublicAppUrl(explicit)) return explicit;

  const corsOrigins = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => trimUrl(s))
    .filter(Boolean);
  const deployedOrigin = corsOrigins.find((o) => isUsablePublicAppUrl(o));
  if (deployedOrigin) return deployedOrigin;

  if (process.env.NODE_ENV !== 'production') {
    const localCors = corsOrigins.find((o) => isLocalOrigin(o));
    return localCors || explicit || 'http://localhost:5173';
  }

  throw new Error(
    'Set CRM_APP_URL and CORS_ORIGIN to your deployed CRM URL (e.g. https://crm-five-hazel.vercel.app) on Render',
  );
}

function getCrmLoginUrl() {
  const explicitLogin = trimUrl(process.env.CRM_LOGIN_URL);
  if (isUsablePublicAppUrl(explicitLogin) || (explicitLogin && !isLocalOrigin(explicitLogin))) {
    return explicitLogin;
  }
  return `${getCrmAppUrl()}/login`;
}

/** Base reset-password path or full URL template (token appended as query). */
function getCrmResetPasswordBaseUrl() {
  const explicit = trimUrl(process.env.CRM_RESET_PASSWORD_URL);
  if (isUsablePublicAppUrl(explicit) || (explicit && !isLocalOrigin(explicit))) {
    return explicit;
  }
  return `${getCrmAppUrl()}/reset-password`;
}

function buildResetPasswordUrl(token) {
  const base = getCrmResetPasswordBaseUrl();
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}token=${encodeURIComponent(token)}`;
}

/** Public API base URL (e.g. Render). Optional — for docs or webhooks. */
function getApiPublicUrl() {
  return trimUrl(process.env.BACKEND_URL || process.env.API_PUBLIC_URL || '');
}

module.exports = {
  getCrmAppUrl,
  getCrmLoginUrl,
  getCrmResetPasswordBaseUrl,
  buildResetPasswordUrl,
  getApiPublicUrl,
  isLocalOrigin,
  isUsablePublicAppUrl,
};
