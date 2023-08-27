const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Obtener el nombre de archivo con hash de index.html
  const indexPath = path.join(__dirname, 'dist', 'verduleria-app');
  const indexHtmlName = fs.readdirSync(indexPath).find(file => file.startsWith('index.') && file.endsWith('.html'));

  // Cargar la URL del archivo index.html empaquetado con el hash actual
  mainWindow.loadURL(
    url.format({
      pathname: path.join(indexPath, indexHtmlName),
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
