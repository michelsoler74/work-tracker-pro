const DB_NAME = "workTrackerDB";
const DB_VERSION = 1;

export async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Error al abrir la base de datos"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Crear almacén de trabajadores si no existe
      if (!db.objectStoreNames.contains("workers")) {
        db.createObjectStore("workers", { keyPath: "id" });
      }

      // Crear almacén de trabajos si no existe
      if (!db.objectStoreNames.contains("jobs")) {
        db.createObjectStore("jobs", { keyPath: "id" });
      }
    };
  });
}
