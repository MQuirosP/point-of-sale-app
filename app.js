require("dotenv").config();
const express = require("express");
const app = express();
const { appLogger, dbLogger } = require("./backend/src/utils/logger");
const http = require("http");
const sequelize = require("./backend/src/database/sequelize");
const routes = require("./backend/src/routes");
const cors = require("cors");
const compression = require("compression")

// Configuración de la aplicación

const server = http.createServer(app);
const port = process.env.APP_PORT;

const corsOptions = {
  origin: [
    "http://localhost:4200",
    "https://verduleria-app-142c1.firebaseapp.com",
    "http://192.168.0.8:4200",
    "https://verduleria-app-142c1.web.app",
  ],
  optionsSuccessStatus: 200,
};

server.listen(port, () => {
  appLogger.debug(`Server running on port ${port}`);
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(compression())

// Rutas
app.use("/", routes);

// Conexión a la base de datos
sequelize
  .authenticate()
  .then(() => {
    dbLogger.debug("Connection to DataBase has been established successfully.");
  })
  .catch((err) => {
    dbLogger.error("Unable to connect to the database:", err);
  });

module.exports = app;
