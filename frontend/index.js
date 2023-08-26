const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Cargar la URL del archivo index.html empaquetado
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist', 'verduleria-app', 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  // Manejar el evento de cierre de la ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Cuando Electron esté listo, crea la ventana
app.on('ready', createWindow);

// Manejar el evento de todas las ventanas cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manejar el evento de activación (para macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
