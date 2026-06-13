const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

const projectRoot = path.join(__dirname, '../..');
const envPath = path.join(projectRoot, '.env');

// Local .env must always win over stale shell/OS vars (e.g. old RESEND_API_KEY).
// On Render there is no .env file — platform env vars are used as-is.
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

module.exports = { projectRoot };
