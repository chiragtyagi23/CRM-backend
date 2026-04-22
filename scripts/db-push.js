require("dotenv").config();

const { sequelize } = require("../src/models");

async function main() {
  await sequelize.sync({ alter: true });
  // eslint-disable-next-line no-console
  console.log("Database synced with models (sequelize.sync alter: true).");
  await sequelize.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
