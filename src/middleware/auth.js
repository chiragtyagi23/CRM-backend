const jwt = require('jsonwebtoken');

const { getJwtSecret } = require('../services/auth.service');
const { userCanAccessModule } = require('../services/acl.service');

/** @alias authenticateToken */
function authRequired(req, res, next) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

const authenticateToken = authRequired;

/**
 * Require access to a module_key (RBAC). Legacy JWT (crm_signup) bypasses with full access.
 */
function requireModuleAccess(moduleKey) {
  return async (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ error: 'Unauthorized' });

    if (u.legacy) return next();

    const allowed = await userCanAccessModule(u.sub, moduleKey);
    if (!allowed) return res.status(403).json({ error: 'Forbidden', moduleKey });
    return next();
  };
}

/** Pass if the user has any of the listed module keys (for shared read endpoints). */
function requireAnyModuleAccess(...moduleKeys) {
  return async (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ error: 'Unauthorized' });
    if (u.legacy) return next();

    for (const moduleKey of moduleKeys) {
      // eslint-disable-next-line no-await-in-loop
      const allowed = await userCanAccessModule(u.sub, moduleKey);
      if (allowed) return next();
    }
    return res.status(403).json({ error: 'Forbidden', moduleKeys });
  };
}

function requireRole(roleName) {
  return (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ error: 'Unauthorized' });
    if (u.legacy && u.role === roleName) return next();
    if (u.role === roleName) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = {
  authRequired,
  authenticateToken,
  requireModuleAccess,
  requireAnyModuleAccess,
  requireRole,
};
