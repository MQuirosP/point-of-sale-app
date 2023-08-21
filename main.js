const { app } = require('electron');
const { exec } = require('child_process');

app.on('ready', () => {
  // Iniciar el servidor de backend
  const serverProcess = exec('npm run start', { cwd: __dirname }, (error) => {
    if (error) {
      console.error('Error al iniciar el servidor de backend:', error);
      app.quit();
    }
  });
});

app.on('before-quit', () => {
  // Matar el proceso del servidor de backend al salir de la aplicación
  serverProcess.kill();
});
