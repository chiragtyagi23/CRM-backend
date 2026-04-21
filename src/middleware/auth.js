const jwt = require("jsonwebtoken");

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

function authRequired(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ error: "Unauthorized" });
    if (u.role !== role) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

module.exports = { authRequired, requireRole };

