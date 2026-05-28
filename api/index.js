/**
 * Vercel serverless entry: all HTTP traffic is rewritten here (see vercel.json).
 * Local dev still uses `npm run dev` → src/index.js (Express listen).
 *
 * Lazy-load the app so misconfiguration returns JSON instead of an unhandled import crash.
 */
require("dotenv").config();

// Sequelize loads `pg` dynamically; Vercel's serverless bundle must see a static require here.
require("pg");

const path = require("path");
const serverless = require("serverless-http");

let handler;

function clearSrcModuleCache() {
  const srcRoot = path.join(__dirname, "..", "src");
  const norm = path.normalize(srcRoot + path.sep);
  for (const key of Object.keys(require.cache)) {
    if (path.normalize(key).startsWith(norm)) {
      delete require.cache[key];
    }
  }
}

async function getHandler() {
  if (handler) return handler;
  try {
    const { app } = require("../src/app");
    const { sequelize } = require("../src/models");
    await sequelize.authenticate();
    handler = serverless(app);
    return handler;
  } catch (err) {
    clearSrcModuleCache();
    handler = null;
    throw err;
  }
}

module.exports = async (req, res) => {
  try {
    const h = await getHandler();
    return h(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("api/index handler error:", err);
    if (!res.headersSent) {
      const msg = err && err.message ? String(err.message) : "Server error";
      res.status(500).json({
        message: msg,
        hint:
          process.env.VERCEL === "1"
            ? "Check Vercel Project → Settings → Environment Variables: DATABASE_URL, CORS_ORIGIN (your CRM site URL, comma-separated if several), JWT_SECRET. For Neon/Supabase use a URL with ?sslmode=require or set DATABASE_SSL=1. If Postgres has no SSL, set DATABASE_SSL=0. See CRM-backend README."
            : undefined,
      });
    }
  }
};
