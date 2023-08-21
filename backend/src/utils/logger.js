const debug = require("debug")("verduleria-app:server");
const moment = require("moment");

const logTime = () => moment().format("YYYY-MM-DD HH:mm:ss");

// Nombres de los loggers que vamos a utilizar
const APP_NAME = "verduleria-app";
const DB_NAME = "verduleria-db";

// Creamos los loggers para nuestra aplicación y la base de datos
const appLogger = {
  debug: (message) => {
    debug(`${logTime()} - DEBUG - ${message}`);
  },
  error: (message, err) => {
    if (err && err.stack) {
      debug(`${logTime()} - ERROR - ${message}: ${err.stack}`);
    } else {
      debug(`${logTime()} - ERROR - ${message}`);
    }
  },
  info: (message) => {
    debug(`${logTime()} - INFO - ${message}`);
  },
};
const dbLogger = {
  debug: (message) => debug(`${logTime()} - DEBUG - ${message}`),
  error: (message, err) => debug(`${logTime()} - ERROR - ${message}: ${err.stack}`),
  info: (message) => debug(`${logTime()} - INFO - ${message}`),
};

// Establecemos el nivel de cada logger
appLogger.enabled = true;
dbLogger.enabled = true;

// Exportamos los loggers para poder usarlos en otros componentes
module.exports = {
  appLogger,
  dbLogger,
};
