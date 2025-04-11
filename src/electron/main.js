const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const express = require("express");
const server = express();
const portfinder = require("portfinder");
const Store = require("electron-store");
const store = new Store();

let mainWindow;
let serverProcess;
let serverPort;

// Configurar el servidor Express
function setupServer() {
  server.use(express.static(path.join(__dirname, "../")));

  // Ruta para la página principal
  server.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
  });

  // Encontrar un puerto disponible y iniciar el servidor
  return portfinder.getPortPromise().then((port) => {
    serverPort = port;
    return new Promise((resolve, reject) => {
      serverProcess = server.listen(port, "localhost", (err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "../assets/icons/icon-512x512.png"),
    title: "Work Tracker Pro",
  });

  // Cargar la aplicación
  mainWindow.loadURL(`http://localhost:${serverPort}`);

  // Ocultar el menú por defecto
  mainWindow.setMenu(null);

  // Evento cuando se cierra la ventana
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Cuando la aplicación está lista
app
  .whenReady()
  .then(setupServer)
  .then(() => {
    createWindow();

    // En macOS, crear una nueva ventana cuando se hace clic en el dock
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

// Cerrar la aplicación cuando todas las ventanas estén cerradas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Limpiar al salir
app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.close();
  }
});
