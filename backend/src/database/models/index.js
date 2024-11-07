// src/database/server.js
const { Sequelize } = require('sequelize');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../../../config/config.json')[env];
const db = {};

// Crear la instancia de Sequelize con la configuración del archivo .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

// Autenticación con la base de datos
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos establecida correctamente.');
  })
  .catch((error) => {
    console.error('No se pudo conectar a la base de datos:', error);
  });

// Cargar los modelos
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Sincronización con la base de datos solo en desarrollo
if (env === 'development') {
  sequelize.sync({ force: false }) // Cambia a true solo en desarrollo si necesitas reiniciar las tablas
    .then(() => {
      console.log('Base de datos sincronizada correctamente.');
    })
    .catch((error) => {
      console.error('Error al sincronizar la base de datos:', error);
    });
}

// Exportar la instancia de sequelize y los modelos
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
