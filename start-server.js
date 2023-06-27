const { exec } = require('child_process');

exec('ng serve --proxy-config proxy.conf.json', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al ejecutar el servidor Angular: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error en la salida del servidor Angular: ${stderr}`);
    return;
  }
  console.log(stdout);
});
