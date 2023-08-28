const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
  });

  const appPath = app.getAppPath();
  const appPathToIndex = app.isPackaged
    ? path.join(appPath, 'dist' , 'verduleria-app', 'index.html')
    : path.resolve('dist/verduleria-app/index.html');

    console.log(appPathToIndex);
  // Crea una instancia de la sesión del contenido y limpia la caché antes de cargar la página
  const webContents = win.webContents;
  const session = webContents.session;
  session.clearCache().then(() => {
    // Carga la aplicación de Angular después de limpiar la caché
    win.loadFile(appPathToIndex);

    // Agregar esta línea para cargar la URL
    // win.webContents.loadURL(appPathToIndex);
  });

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
