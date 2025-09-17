import { openDB } from "../utils/indexedDB.js";
import WorkerService from "./worker.service.js";
import { showNotification } from "../utils/notifications.js";
import { generateId, formatDate, validateForm } from "../utils/helpers.js";

class JobService {
  constructor() {
    this.jobs = [];
    this.storeName = "jobs";
    this.workerService = new WorkerService();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await Promise.all([this.loadJobs(), this.workerService.init()]);
    this.initialized = true;
  }

  async loadJobs() {
    try {
      const db = await openDB();
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      this.jobs = await store.getAll();
      return this.jobs;
    } catch (error) {
      console.error("Error loading jobs:", error);
      showNotification("Error al cargar los trabajos", "danger");
      throw error;
    }
  }

  async addJob(job) {
    try {
      const db = await openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      await store.add(job);
      await this.loadJobs();
      return true;
    } catch (error) {
      console.error("Error adding job:", error);
      throw error;
    }
  }

  async updateJob(job) {
    try {
      const db = await openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      await store.put(job);
      await this.loadJobs();
      return true;
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  }

  async deleteJob(jobId) {
    try {
      const db = await openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      await store.delete(jobId);
      await this.loadJobs();
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      throw error;
    }
  }

  getJobById(jobId) {
    return this.jobs.find((job) => job.id === jobId);
  }

  getAllJobs() {
    return this.jobs;
  }

  getWorkerJobs(workerId) {
    return this.jobs.filter((job) => job.workerId === workerId);
  }

  getJobStats() {
    const totalJobs = this.jobs.length;
    const completedJobs = this.jobs.filter(
      (j) => j.status === "Completado"
    ).length;
    const pendingJobs = this.jobs.filter(
      (j) => j.status === "Pendiente"
    ).length;
    const inProgressJobs = this.jobs.filter(
      (j) => j.status === "En Progreso"
    ).length;

    return {
      total: totalJobs,
      completed: completedJobs,
      pending: pendingJobs,
      inProgress: inProgressJobs,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
    };
  }

  validateJobData(jobData) {
    const requiredFields = ["title", "description", "date", "status"];
    const missingFields = validateForm(jobData, requiredFields);

    if (missingFields.length > 0) {
      throw new Error(
        `Campos requeridos faltantes: ${missingFields.join(", ")}`
      );
    }

    return true;
  }

  async processImages(images) {
    if (!images || images.length === 0) return [];

    if (typeof images[0] === "string") return images;

    return Promise.all(
      Array.from(images).map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );
  }

  async exportJobData() {
    const dataStr = JSON.stringify(this.jobs, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `trabajos_${formatDate(new Date())}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    showNotification("Datos de trabajos exportados correctamente", "success");
  }

  async reset() {
    try {
      this.jobs = [];
      return true;
    } catch (error) {
      console.error("Error al restablecer el servicio de trabajos:", error);
      return false;
    }
  }

  async completeJob(id) {
    return this.updateJob(id, { status: "Completado" });
  }

  async startJob(id) {
    return this.updateJob(id, { status: "En Progreso" });
  }

  getPendingJobs() {
    return this.jobs.filter((job) => job.status === "Pendiente");
  }

  getCompletedJobs() {
    return this.jobs.filter((job) => job.status === "Completado");
  }

  getInProgressJobs() {
    return this.jobs.filter((job) => job.status === "En Progreso");
  }
}

export default JobService;
