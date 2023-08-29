const { app, BrowserWindow } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 800,
    title: "Mi Punto de Venta",
    icon: path.join(__dirname, "favicon.ico"),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: true,
    },
    autoHideMenuBar: true,
  });

  const appPath = app.getAppPath();

  const indexPath = path.join(
    __dirname,
    "dist",
    "verduleria-app",
    "index.html"
  );

  win.loadFile(indexPath);

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
