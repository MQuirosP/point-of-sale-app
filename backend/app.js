const express = require("express");
const sequelize = require("./src/database/sequelize");
const routes = require("./src/routes/index");
const cors = require("cors");
const compression = require("compression");
const path = require("path");

require("dotenv").config();
const appLogger = require("./src/utils/logger").appLogger;
const dbLogger = require("./src/utils/logger").dbLogger;

const app = express();
const server = require("http").createServer(app);
const port = process.env.APP_PORT || 3000;

const corsOptions = {
  origin: [
    "http://localhost:4200",
    "https://verduleria-app-142c1.firebaseapp.com",
    "http://192.168.0.18:4200",
    "https://verduleria-app-142c1.web.app",
    "file://"
  ],
  optionsSuccessStatus: 200,
};

server.listen(port, () => {
  appLogger.debug(`Server running on port ${port}`);
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(compression());

app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, path) => {
    if (path.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    }
  }
}));

app.use("/", routes);

// sequelize.authenticate()
//   .then(() => {
//     dbLogger.debug("Connection to DataBase has been established successfully.");
//   })
//   .catch((err) => {
//     dbLogger.error("Unable to connect to the database:", err);
//   });

module.exports = app;