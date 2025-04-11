// Servicio de base de datos local usando IndexedDB
import { openDB } from "idb";

const DB_NAME = "worktracker-db";
const DB_VERSION = 1;

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Crear stores si no existen
      if (!db.objectStoreNames.contains("trabajos")) {
        db.createObjectStore("trabajos", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("trabajadores")) {
        db.createObjectStore("trabajadores", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("fotos")) {
        db.createObjectStore("fotos", { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export class LocalDB {
  static async getDB() {
    return await initDB();
  }

  // Trabajos
  static async guardarTrabajo(trabajo) {
    const db = await this.getDB();
    const tx = db.transaction("trabajos", "readwrite");
    const store = tx.objectStore("trabajos");
    const id = await store.add(trabajo);
    await tx.done;
    return { id, ...trabajo };
  }

  static async obtenerTrabajos() {
    const db = await this.getDB();
    return db.getAll("trabajos");
  }

  static async actualizarTrabajo(id, trabajo) {
    const db = await this.getDB();
    const tx = db.transaction("trabajos", "readwrite");
    const store = tx.objectStore("trabajos");
    await store.put({ ...trabajo, id });
    await tx.done;
  }

  static async eliminarTrabajo(id) {
    const db = await this.getDB();
    const tx = db.transaction("trabajos", "readwrite");
    const store = tx.objectStore("trabajos");
    await store.delete(id);
    await tx.done;
  }

  // Trabajadores
  static async guardarTrabajador(trabajador) {
    const db = await this.getDB();
    const tx = db.transaction("trabajadores", "readwrite");
    const store = tx.objectStore("trabajadores");
    const id = await store.add(trabajador);
    await tx.done;
    return { id, ...trabajador };
  }

  static async obtenerTrabajadores() {
    const db = await this.getDB();
    return db.getAll("trabajadores");
  }

  static async actualizarTrabajador(id, trabajador) {
    const db = await this.getDB();
    const tx = db.transaction("trabajadores", "readwrite");
    const store = tx.objectStore("trabajadores");
    await store.put({ ...trabajador, id });
    await tx.done;
  }

  static async eliminarTrabajador(id) {
    const db = await this.getDB();
    const tx = db.transaction("trabajadores", "readwrite");
    const store = tx.objectStore("trabajadores");
    await store.delete(id);
    await tx.done;
  }

  // Fotos
  static async guardarFoto(foto) {
    const db = await this.getDB();
    const tx = db.transaction("fotos", "readwrite");
    const store = tx.objectStore("fotos");
    const id = await store.add(foto);
    await tx.done;
    return { id, ...foto };
  }

  static async obtenerFotos(trabajoId) {
    const db = await this.getDB();
    const tx = db.transaction("fotos", "readonly");
    const store = tx.objectStore("fotos");
    const fotos = await store.getAll();
    await tx.done;
    return fotos.filter((foto) => foto.trabajoId === trabajoId);
  }
}
