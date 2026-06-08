const crypto = require("crypto");
const { getWebhookApiKey } = require("../config/webhookKeys");

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function requireWebhookApiKey(source) {
  return (req, res, next) => {
    const expected = getWebhookApiKey(source);
    if (!expected) {
      return res.status(503).json({ ok: false, error: "Webhook API key not configured" });
    }

    const provided = String(req.headers["x-api-key"] || "").trim();
    if (!provided) {
      return res.status(401).json({ ok: false, error: "Missing x-api-key header" });
    }
    if (!timingSafeEqual(provided, expected)) {
      return res.status(403).json({ ok: false, error: "Invalid API key" });
    }

    return next();
  };
}

module.exports = { requireWebhookApiKey };
