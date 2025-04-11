import { storageService } from "../storage.js";
import { showNotification } from "../utils/notifications.js";
import { generateId, formatDate, validateForm } from "../utils/helpers.js";

export class WorkerService {
  constructor() {
    this.workers = [];
    this.storeName = "workers";
    this.loadWorkers();
  }

  async loadWorkers() {
    try {
      await storageService.ensureStoresExist();

      this.workers = await storageService.getAll(this.storeName);
      console.log(`Cargados ${this.workers.length} trabajadores`);
      return this.workers;
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
      showNotification("Error al cargar los trabajadores", "danger");
      this.workers = [];
      return [];
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

      await storageService.add(this.storeName, worker);

      this.workers.push(worker);

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
      await storageService.delete(this.storeName, workerId);

      this.workers = this.workers.filter((worker) => worker.id !== workerId);

      showNotification("Trabajador eliminado con éxito", "success");
    } catch (error) {
      console.error("Error al eliminar trabajador:", error);
      showNotification("Error al eliminar el trabajador", "danger");
      throw error;
    }
  }

  async updateWorker(workerData) {
    try {
      this.validateWorkerData(workerData);

      const existingWorker = await storageService.getById(
        this.storeName,
        workerData.id
      );
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

      await storageService.update(this.storeName, updatedWorker);

      const index = this.workers.findIndex(
        (worker) => worker.id === updatedWorker.id
      );
      if (index !== -1) {
        this.workers[index] = updatedWorker;
      }

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

      const worker = await storageService.getById(this.storeName, workerId);
      if (!worker) {
        throw new Error("Trabajador no encontrado");
      }

      worker.hours = Number(worker.hours || 0) + Number(hours);
      worker.updatedAt = new Date().toISOString();

      await storageService.update(this.storeName, worker);

      const index = this.workers.findIndex((w) => w.id === workerId);
      if (index !== -1) {
        this.workers[index] = worker;
      }

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

  async getWorkerById(workerId) {
    try {
      const worker = await storageService.getById(this.storeName, workerId);
      if (!worker) {
        console.warn(`Trabajador con ID ${workerId} no encontrado`);
        return null;
      }
      return worker;
    } catch (error) {
      console.error("Error al obtener trabajador:", error);
      showNotification(
        "Error al obtener los detalles del trabajador",
        "danger"
      );
      throw error;
    }
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
}

export const workerService = new WorkerService();
