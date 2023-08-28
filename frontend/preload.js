// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Expone funciones o métodos que necesitas desde Node.js
  // Por ejemplo, si necesitas acceder a las APIs de Node.js para operaciones específicas
});
