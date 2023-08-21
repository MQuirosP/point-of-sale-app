const backupDBService = require('../services/backupDBService');
const responseUtils = require('../utils/responseUtils')

async function createBackup() {
  try {
    const statusBackup = await backupDBService.backupDataBase();
    
    return { success: true, message: "El respaldo se ha creado exitosamente." };
  } catch (error) {
    console.error(error);
    // return { success: false, message: "Error al crear el respaldo." }
    throw error; // Puedes lanzar el error para manejarlo en otro nivel
  }
}

module.exports = {
  // // createBackup,
};