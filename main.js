const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const Store = require("electron-store");

// Inicializar electron store
const store = new Store();

let mainWindow;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // Cargar el archivo index.html
  mainWindow.loadFile(path.join(__dirname, "src/index.html"));

  // Abrir las herramientas de desarrollo en modo desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Cuando la aplicación esté lista, crear la ventana
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
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
ipcMain.handle("save-data", async (event, { key, data }) => {
  try {
    store.set(key, data);
    return { success: true, message: "Datos guardados correctamente" };
  } catch (error) {
    console.error("Error al guardar datos:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-data", async (event, { key }) => {
  try {
    const data = store.get(key);
    return { success: true, data };
  } catch (error) {
    console.error("Error al cargar datos:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-data", async (event, { key }) => {
  try {
    store.delete(key);
    return { success: true, message: "Datos eliminados correctamente" };
  } catch (error) {
    console.error("Error al eliminar datos:", error);
    return { success: false, error: error.message };
  }
});
