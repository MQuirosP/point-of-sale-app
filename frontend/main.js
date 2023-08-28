const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true, // Usar contexto de seguridad
      preload: path.join(__dirname, 'preload.js'), // Archivo de preload
    },
  });

  const appPath = app.getAppPath(); // Obtiene la ruta absoluta de la aplicación

  const appPathToIndex = app.isPackaged
    ? path.join(__dirname, 'dist/verduleria-app/index.html')
    : path.resolve('dist/verduleria-app/index.html');

  // Carga la aplicación de Angular
  win.loadFile(appPathToIndex);

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
