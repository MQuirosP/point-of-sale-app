const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // Permite la integración de Node.js en el contexto de la página web
      webSecurity: true, // Deshabilita la seguridad del navegador (¡solo para desarrollo!)
    },
  });

  // Obtener la ruta absoluta del directorio donde se encuentra este script (main.js)
  const appPath = app.getAppPath();

  // Construir la ruta completa al index.html de la aplicación Angular
  const indexPath = path.join(__dirname, 'dist', 'verduleria-app', 'index.html');

  // Cargar el index.html en la ventana de Electron
  win.loadFile(indexPath);

  // Escuchar el evento de cierre de la ventana
  win.on('closed', () => {
    win = null;
  });
}

// Cuando la aplicación esté lista, crea la ventana
app.on('ready', createWindow);

// Cuando todas las ventanas estén cerradas, cierra la aplicación (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cuando la aplicación se active (haga clic en el icono en el dock en macOS), crea la ventana si no existe
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});