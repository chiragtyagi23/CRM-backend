const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.join(__dirname, '../..');
const isProduction = process.env.NODE_ENV === 'production';

// In dev, .env must win over stale OS/shell vars (e.g. old CRM_LOGIN_URL from setup).
dotenv.config({
  path: path.join(projectRoot, '.env'),
  override: !isProduction,
});

module.exports = { projectRoot };
