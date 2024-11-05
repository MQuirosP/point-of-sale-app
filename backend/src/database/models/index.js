"use strict";

const debug = require("debug")("verduleria-app:database");
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require("../../../config/config.json")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    ...config,
    // logging: console.log,
    hooks: true,
  });
  sequelize
    .authenticate()
    .then(() => {
      debug("Connection to database has been established successfully.");
    })
    .catch((error) => {
      debug("Unable to connect to the database:", error);
    });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: console.log,
  });
  sequelize
    .authenticate()
    .then(() => {
      debug("Connection to database has been established successfully.");
    })
    .catch((error) => {
      debug("Unable to connect to the database:", error);
    });
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Código para sincronizar la base de datos solo si es en desarrollo
if (env === "development") {
  sequelize
    .sync()
    .then(() => {
      debug("Base de datos sincronizada correctamente.");
    })
    .catch((error) => {
      debug("Error al sincronizar la base de datos:", error);
    });
}

// Llama a la función de sincronización al final solo si es en desarrollo
if (env === "development") {
  const syncDatabase = async () => {
    try {
      await sequelize.sync({ force: false }); // Cambia a true solo en desarrollo si necesitas reiniciar las tablas
      debug("Base de datos sincronizada correctamente.");
    } catch (error) {
      debug("Error al sincronizar la base de datos:", error);
    }
  };

  syncDatabase();
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = {
  db,
  Product: db.Product,
  Purchase: db.Purchase,
  Sale: db.Sale,
  PurchaseItems: db.PurchaseItems,
  SaleItems: db.SaleItems,
  User: db.User,
  Provider: db.Provider,
  Customer: db.Customer,
  BlacklistedToken: db.BlacklistedToken,
  Options: db.Options,
  // AuditDocument: db.AuditDocument,
  // AuditItem: db.AuditItem,
};
