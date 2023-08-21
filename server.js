const app = require("./app");
const { appLogger, dbLogger } = require("./backend/src/utils/logger");
const sequelize = require("./backend/src/database/sequelize");

const port = process.env.APP_PORT || 3000;

app.listen(port, () => {
  appLogger.debug(`Server running on port ${port}`);
  console.log("Conexión exitosa");
});

sequelize
  .authenticate()
  .then(() => {
    dbLogger.debug("Connection has been established successfully.");
    console.log("Connection has been established successfully");
  })
  .catch((err) => {
    dbLogger.error("Unable to connect to the database:", err);
    console.log("Unable to connect to the database", err);
  });
