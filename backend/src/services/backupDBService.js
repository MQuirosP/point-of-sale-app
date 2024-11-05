const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

function backupDataBase() {
  const backupFolder = "C:/respaldo_bd";
  const backupName = moment().format("YYYYMMDD-HHmm");

  // Verificar si la carpeta de respaldo existe, de lo contrario, crearla
  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder);
  }

  // Ruta completa del archivo de respaldo
  const backupPath = path.join(backupFolder, `${backupName}.backup`);

  // Ruta completa al ejecutable pg_dump
  const pgDumpPath = "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe";

  // Contraseña de la base de datos
  const password = "3az5bkhr"; // Reemplaza con la contraseña correcta

  // Establecer la variable de entorno PGPASSWORD con la contraseña
  process.env.PGPASSWORD = password;

  // Comando para realizar el respaldo usando pg_dump
  const command = `"${pgDumpPath}" --file "${backupPath}" --host "localhost" --port "5432" --username "postgres" --no-password --verbose --role "postgres" --format=d "verduleria_db"`;

  try {
    // Ejecutar el command de respaldo
    execSync(command);
    console.log("El respaldo se ha creado exitosamente.");

    // Devolver una respuesta de éxito
    return { success: true, message: "El respaldo se ha creado exitosamente." };
  } catch (error) {
    console.error("Error al crear el respaldo:", error.message);

    // Devolver una respuesta de error
    return { success: false, message: "Error al crear el respaldo." };
  } finally {
    // Limpiar la variable de entorno PGPASSWORD después de usarla
    delete process.env.PGPASSWORD;
  }
}

module.exports = {
  backupDataBase,
};
