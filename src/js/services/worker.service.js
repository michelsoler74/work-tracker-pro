import { storageService } from "../storage.js";
import { showNotification } from "../utils/notifications.js";
import { generateId, formatDate, validateForm } from "../utils/helpers.js";
import { openDB } from "../utils/indexedDB.js";

export class WorkerService {
  constructor() {
    this.workers = [];
    this.storeName = "workers";
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.loadWorkers();
    this.initialized = true;
  }

  async loadWorkers() {
    try {
      const db = await openDB();
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      this.workers = await store.getAll();
      return this.workers;
    } catch (error) {
      console.error("Error loading workers:", error);
      showNotification("Error al cargar los trabajadores", "danger");
      throw error;
    }
  }

  async addWorker(workerData) {
    try {
      this.validateWorkerData(workerData);

      const profileImage = workerData.profileImage
        ? await this.processImage(workerData.profileImage)
        : null;

      const worker = {
        id: generateId(),
        name: workerData.name,
        specialty: workerData.specialty,
        phone: workerData.phone || "",
        email: workerData.email || "",
        profileImage: profileImage,
        hours: workerData.hours || 0,
        jobs: workerData.jobs || [],
        createdAt: new Date().toISOString(),
      };

      const db = await openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      await store.add(worker);
      await this.loadWorkers();

      showNotification("Trabajador guardado con éxito", "success");
      return worker;
    } catch (error) {
      console.error("Error al añadir trabajador:", error);
      showNotification(
        error.message || "Error al guardar el trabajador",
        "danger"
      );
      throw error;
    }
  }

  async deleteWorker(workerId) {
    try {
      const db = await openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      await store.delete(workerId);
      await this.loadWorkers();

      showNotification("Trabajador eliminado con éxito", "success");
      return true;
    } catch (error) {
      console.error("Error al eliminar trabajador:", error);
      showNotification("Error al eliminar el trabajador", "danger");
      throw error;
    }
  }

  async updateWorker(workerData) {
    try {
      this.validateWorkerData(workerData);

      const db = await openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);

      const existingWorker = await store.get(workerData.id);
      if (!existingWorker) {
        throw new Error("Trabajador no encontrado");
      }

      let profileImage = existingWorker.profileImage;
      if (
        workerData.profileImage &&
        workerData.profileImage !== existingWorker.profileImage
      ) {
        profileImage = await this.processImage(workerData.profileImage);
      }

      const updatedWorker = {
        ...existingWorker,
        name: workerData.name,
        specialty: workerData.specialty,
        phone: workerData.phone || existingWorker.phone || "",
        email: workerData.email || existingWorker.email || "",
        profileImage: profileImage,
        updatedAt: new Date().toISOString(),
      };

      await store.put(updatedWorker);
      await this.loadWorkers();

      showNotification("Trabajador actualizado con éxito", "success");
      return updatedWorker;
    } catch (error) {
      console.error("Error al actualizar trabajador:", error);
      showNotification(
        error.message || "Error al actualizar el trabajador",
        "danger"
      );
      throw error;
    }
  }

  async updateWorkerHours(workerId, hours) {
    try {
      if (isNaN(Number(hours)) || Number(hours) < 0) {
        throw new Error("Las horas deben ser un número positivo");
      }

      const db = await openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);

      const worker = await store.get(workerId);
      if (!worker) {
        throw new Error("Trabajador no encontrado");
      }

      worker.hours = Number(worker.hours || 0) + Number(hours);
      worker.updatedAt = new Date().toISOString();

      await store.put(worker);
      await this.loadWorkers();

      showNotification(`Horas actualizadas para ${worker.name}`, "success");
      return worker;
    } catch (error) {
      console.error("Error al actualizar horas:", error);
      showNotification(
        error.message || "Error al actualizar las horas",
        "danger"
      );
      throw error;
    }
  }

  getWorkerById(workerId) {
    return this.workers.find((worker) => worker.id === workerId);
  }

  getWorkerStats() {
    const totalWorkers = this.workers.length;
    const totalHours = this.workers.reduce(
      (sum, worker) => sum + (Number(worker.hours) || 0),
      0
    );
    const averageHours = totalWorkers > 0 ? totalHours / totalWorkers : 0;

    let topWorker = null;
    let maxHours = 0;

    for (const worker of this.workers) {
      const hours = Number(worker.hours) || 0;
      if (hours > maxHours) {
        maxHours = hours;
        topWorker = worker;
      }
    }

    return {
      total: totalWorkers,
      totalHours,
      averageHours,
      topWorker: topWorker
        ? {
            id: topWorker.id,
            name: topWorker.name,
            hours: maxHours,
          }
        : null,
    };
  }

  validateWorkerData(workerData) {
    const requiredFields = ["name", "specialty"];
    const missingFields = validateForm(workerData, requiredFields);

    if (missingFields.length > 0) {
      throw new Error(
        `Campos requeridos faltantes: ${missingFields.join(", ")}`
      );
    }

    return true;
  }

  async processImage(imageFile) {
    if (!imageFile) return null;

    if (typeof imageFile === "string") return imageFile;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  }

  exportWorkerData() {
    const dataStr = JSON.stringify(this.workers, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `trabajadores_${formatDate(new Date())}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    showNotification(
      "Datos de trabajadores exportados correctamente",
      "success"
    );
  }

  async reset() {
    try {
      this.workers = [];
      return true;
    } catch (error) {
      console.error("Error al restablecer el servicio de trabajadores:", error);
      return false;
    }
  }

  getAllWorkers() {
    return this.workers;
  }
}

export default WorkerService;
