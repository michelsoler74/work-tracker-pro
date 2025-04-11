// Archivo para la configuración y las funciones de Firebase
// Referencia: https://firebase.google.com/docs/web/setup?hl=es-419

import { firebaseConfig } from "../config/firebase-config.js";

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Habilitar persistencia offline y caché ilimitado
try {
  await firebase.firestore().enableIndexedDbPersistence({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  });
} catch (err) {
  if (err.code == "failed-precondition") {
    console.warn("La persistencia offline falló: múltiples pestañas abiertas");
  } else if (err.code == "unimplemented") {
    console.warn("El navegador no soporta persistencia offline");
  }
}

// Servicio para gestión de trabajos
export class TrabajoService {
  static async crear(trabajo) {
    try {
      const docRef = await db.collection("trabajos").add(trabajo);
      return { id: docRef.id, ...trabajo };
    } catch (error) {
      console.error("Error al crear trabajo:", error);
      throw new Error(
        "No se pudo crear el trabajo. Por favor, intenta de nuevo."
      );
    }
  }

  static async obtenerTodos() {
    try {
      const snapshot = await db.collection("trabajos").get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error al obtener trabajos:", error);
      throw new Error(
        "No se pudieron obtener los trabajos. Por favor, intenta de nuevo."
      );
    }
  }

  static async eliminar(id) {
    try {
      await db.collection("trabajos").doc(id).delete();
      return true;
    } catch (error) {
      console.error("Error al eliminar trabajo:", error);
      throw new Error(
        "No se pudo eliminar el trabajo. Por favor, intenta de nuevo."
      );
    }
  }
}

// Servicio para gestión de trabajadores
export class TrabajadorService {
  static async crear(trabajador) {
    try {
      const docRef = await db.collection("trabajadores").add(trabajador);
      return { id: docRef.id, ...trabajador };
    } catch (error) {
      console.error("Error al crear trabajador:", error);
      throw new Error(
        "No se pudo crear el trabajador. Por favor, intenta de nuevo."
      );
    }
  }

  static async obtenerTodos() {
    try {
      const snapshot = await db.collection("trabajadores").get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error al obtener trabajadores:", error);
      throw new Error(
        "No se pudieron obtener los trabajadores. Por favor, intenta de nuevo."
      );
    }
  }

  static async eliminar(id) {
    try {
      await db.collection("trabajadores").doc(id).delete();
      return true;
    } catch (error) {
      console.error("Error al eliminar trabajador:", error);
      throw new Error(
        "No se pudo eliminar el trabajador. Por favor, intenta de nuevo."
      );
    }
  }
}

// Servicio para gestión de almacenamiento
export class StorageService {
  static async subirImagen(file, carpeta) {
    try {
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`${carpeta}/${file.name}`);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();
      return url;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      throw new Error(
        "No se pudo subir la imagen. Por favor, intenta de nuevo."
      );
    }
  }
}
