require('../src/config/loadEnv')

const ssl =
  String(process.env.PGSSLMODE || '').toLowerCase() === 'disable'
    ? false
    : {
        require: true,
        rejectUnauthorized: false,
      }

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: ssl ? { ssl } : {},
  },
  test: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: ssl ? { ssl } : {},
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: ssl ? { ssl } : {},
  },
}

