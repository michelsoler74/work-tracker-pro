// Servicio de almacenamiento usando IndexedDB
const DB_NAME = "work-tracker-db";
const DB_VERSION = 1;

class StorageService {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        console.log("Creando/actualizando estructura de base de datos");
        const db = event.target.result;

        // Crear almacenes de objetos si no existen
        if (!db.objectStoreNames.contains("jobs")) {
          db.createObjectStore("jobs", { keyPath: "id" });
          console.log("Almacén 'jobs' creado");
        }

        if (!db.objectStoreNames.contains("workers")) {
          db.createObjectStore("workers", { keyPath: "id" });
          console.log("Almacén 'workers' creado");
        }

        // Asegurarse de que existan otros almacenes necesarios
        if (!db.objectStoreNames.contains("sync-queue")) {
          db.createObjectStore("sync-queue", {
            keyPath: "id",
            autoIncrement: true,
          });
          console.log("Almacén 'sync-queue' creado");
        }

        console.log("Estructura de base de datos actualizada");
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log("Conexión a IndexedDB establecida con éxito");
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("Error al abrir la base de datos:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAll(storeName) {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("La base de datos no está inicializada"));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async add(storeName, item) {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("La base de datos no está inicializada"));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async update(storeName, item) {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("La base de datos no está inicializada"));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async delete(storeName, id) {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("La base de datos no está inicializada"));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async getById(storeName, id) {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("La base de datos no está inicializada"));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Método auxiliar para asegurar que la base de datos esté inicializada
  async ensureDBInitialized() {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  // Método para asegurar que todos los almacenes existen
  async ensureStoresExist() {
    await this.ensureDBInitialized();

    try {
      // Lista de almacenes requeridos
      const requiredStores = ["jobs", "workers", "sync-queue"];

      // Verificar si todos los almacenes necesarios existen
      let needsUpgrade = false;
      const existingStores = Array.from(this.db.objectStoreNames);

      for (const storeName of requiredStores) {
        if (!existingStores.includes(storeName)) {
          console.warn(
            `El almacén ${storeName} no existe. Se necesita actualizar la base de datos.`
          );
          needsUpgrade = true;
          break;
        }
      }

      // Si falta algún almacén, reiniciar la base de datos
      if (needsUpgrade) {
        console.log("Actualizando estructura de la base de datos...");
        await this.resetDatabase();
      }

      return true;
    } catch (error) {
      console.error("Error al verificar almacenes:", error);
      throw error;
    }
  }

  // Método para limpiar todos los datos de un almacén específico
  async clearStore(storeName) {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("La base de datos no está inicializada"));
        return;
      }

      try {
        console.log(`Limpiando almacén: ${storeName}`);
        const transaction = this.db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`Almacén ${storeName} limpiado con éxito`);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error(
            `Error al limpiar almacén ${storeName}:`,
            event.target.error
          );
          reject(event.target.error);
        };
      } catch (error) {
        console.error(`Error al limpiar almacén ${storeName}:`, error);
        reject(error);
      }
    });
  }

  // Método para reiniciar completamente la base de datos
  async resetDatabase() {
    // Cerrar la conexión actual si existe
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      console.log("Solicitando eliminación de la base de datos...");
      const request = indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = () => {
        console.log("Base de datos eliminada con éxito");
        // Reiniciar la base de datos
        this.initDB()
          .then(() => {
            console.log("Base de datos recreada con éxito");
            resolve(true);
          })
          .catch((error) => {
            console.error("Error al recrear la base de datos:", error);
            reject(error);
          });
      };

      request.onerror = (event) => {
        console.error(
          "Error al eliminar la base de datos:",
          event.target.error
        );
        reject(event.target.error);
      };

      request.onblocked = () => {
        console.warn("La eliminación de la base de datos está bloqueada");
        alert(
          "Por favor, cierre todas las demás pestañas con esta aplicación para reiniciar la base de datos"
        );
        reject(new Error("Eliminación de base de datos bloqueada"));
      };
    });
  }
}

// Crear una instancia del servicio
export const storageService = new StorageService();
