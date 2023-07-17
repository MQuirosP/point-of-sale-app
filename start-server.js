// const { exec } = require('child_process');

// exec('ng serve --proxy-config proxy.conf.json', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`Error al ejecutar el servidor Angular: ${error.message}`);
//     return;
//   }
//   if (stderr) {
//     console.error(`Error en la salida del servidor Angular: ${stderr}`);
//     return;
//   }
//   console.log(stdout);
// });

const { exec } = require('child_process');
const { networkInterfaces } = require('os');

// Función para obtener la dirección IP local del dispositivo
function getLocalIpAddress() {
  const interfaces = networkInterfaces();

  for (const interfaceName in interfaces) {
    const interface = interfaces[interfaceName];
    
    for (const iface of interface) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }

  return null; // Si no se encuentra ninguna dirección IP válida
}

// Obtener la dirección IP local
const ipAddress = getLocalIpAddress();

if (ipAddress) {
  // Ejecutar ng serve con la dirección IP local
  exec(`ng serve --host=${ipAddress} --disable-host-check`, (error, stdout, stderr) => {
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
} else {
  console.error('No se pudo obtener la dirección IP local del dispositivo.');
}

