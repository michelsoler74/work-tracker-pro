import { storageService } from "../storage.js";
import { showNotification } from "../utils/notifications.js";
import { workerService } from "./worker.service.js";
import { generateId, formatDate, validateForm } from "../utils/helpers.js";

export class JobService {
  constructor() {
    this.jobs = [];
    this.storeName = "jobs";
    this.loadJobs();
  }

  async loadJobs() {
    try {
      await storageService.ensureStoresExist();

      this.jobs = await storageService.getAll(this.storeName);
      console.log(`Cargados ${this.jobs.length} trabajos`);
      return this.jobs;
    } catch (error) {
      console.error("Error al cargar trabajos:", error);
      showNotification("Error al cargar los trabajos", "danger");
      this.jobs = [];
      return [];
    }
  }

  async addJob(jobData) {
    try {
      this.validateJobData(jobData);

      const processedImages = await this.processImages(jobData.images);

      const job = {
        id: generateId(),
        title: jobData.title,
        description: jobData.description,
        date: jobData.date,
        status: jobData.status,
        workerId: jobData.workerId || null,
        images: processedImages,
        createdAt: new Date().toISOString(),
      };

      await storageService.add(this.storeName, job);

      this.jobs.push(job);

      showNotification("Trabajo guardado con éxito", "success");
      return job;
    } catch (error) {
      console.error("Error al añadir trabajo:", error);
      showNotification(
        error.message || "Error al guardar el trabajo",
        "danger"
      );
      throw error;
    }
  }

  async deleteJob(jobId) {
    try {
      await storageService.delete(this.storeName, jobId);

      this.jobs = this.jobs.filter((job) => job.id !== jobId);

      showNotification("Trabajo eliminado con éxito", "success");
    } catch (error) {
      console.error("Error al eliminar trabajo:", error);
      showNotification("Error al eliminar el trabajo", "danger");
      throw error;
    }
  }

  async updateJob(jobData) {
    try {
      this.validateJobData(jobData);

      const existingJob = await storageService.getById(
        this.storeName,
        jobData.id
      );
      if (!existingJob) {
        throw new Error("Trabajo no encontrado");
      }

      let processedImages = existingJob.images || [];
      if (jobData.images && jobData.images.length > 0) {
        const newImages = await this.processImages(jobData.images);
        processedImages = [...processedImages, ...newImages];
      }

      const updatedJob = {
        ...existingJob,
        title: jobData.title,
        description: jobData.description,
        date: jobData.date,
        status: jobData.status,
        workerId: jobData.workerId || null,
        images: processedImages,
        updatedAt: new Date().toISOString(),
      };

      await storageService.update(this.storeName, updatedJob);

      const index = this.jobs.findIndex((job) => job.id === updatedJob.id);
      if (index !== -1) {
        this.jobs[index] = updatedJob;
      }

      showNotification("Trabajo actualizado con éxito", "success");
      return updatedJob;
    } catch (error) {
      console.error("Error al actualizar trabajo:", error);
      showNotification(
        error.message || "Error al actualizar el trabajo",
        "danger"
      );
      throw error;
    }
  }

  async getJobById(jobId) {
    try {
      const job = await storageService.getById(this.storeName, jobId);
      if (!job) {
        console.warn(`Trabajo con ID ${jobId} no encontrado`);
        return null;
      }
      return job;
    } catch (error) {
      console.error("Error al obtener trabajo:", error);
      showNotification("Error al obtener los detalles del trabajo", "danger");
      throw error;
    }
  }

  getJobsByWorker(workerId) {
    return this.jobs.filter((j) => j.workerId === workerId);
  }

  getJobStats() {
    const totalJobs = this.jobs.length;
    const completedJobs = this.jobs.filter(
      (j) => j.status === "completed"
    ).length;
    const pendingJobs = this.jobs.filter((j) => j.status === "pending").length;
    const inProgressJobs = this.jobs.filter(
      (j) => j.status === "in-progress"
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
}

export const jobService = new JobService();
