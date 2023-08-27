const { app, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  const indexPath = path.join(__dirname, "dist", "verduleria-app");
  const indexHtmlName = fs
    .readdirSync(indexPath)
    .find((file) => file.startsWith("index.") && file.endsWith(".html"));

  // Cargar la URL del archivo index.html empaquetado con el hash actual
  mainWindow.loadURL(
    url.format({
      pathname: path.join(indexPath, indexHtmlName),
      protocol: "file:",
      slashes: true,
    })
  );

  // Manejar el evento de cierre de la ventana
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Agregar rutas relativas para los archivos estáticos
app.get("/static/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "dist",
    "verduleria-app",
    req.params.filename
  );
  res.sendFile(filePath);
});
