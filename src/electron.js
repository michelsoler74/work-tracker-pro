const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const Store = require("electron-store");

// Initialize electron store
const store = new Store();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, "assets/icons/icon.png"),
  });

  // Cargar la URL de la app
  mainWindow.loadURL(
    isDev
      ? "http://localhost:5174"
      : `file://${path.join(__dirname, "../dist/index.html")}`
  );

  // Abrir las herramientas de desarrollo en modo desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Crear ventana cuando la app esté lista
app.whenReady().then(createWindow);

// Cerrar cuando todas las ventanas estén cerradas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Manejar eventos IPC
ipcMain.on("save-data", (event, data) => {
  store.set(data.key, data.value);
  event.reply("save-data-reply", { success: true });
});

ipcMain.on("load-data", (event, key) => {
  const data = store.get(key);
  event.reply("load-data-reply", data);
});

ipcMain.on("delete-data", (event, key) => {
  store.delete(key);
  event.reply("delete-data-reply", { success: true });
});
