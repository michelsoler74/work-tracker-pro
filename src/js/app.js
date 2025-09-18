/**
 * @fileoverview Work Tracker Pro - Aplicación principal para gestión de trabajos y trabajadores
 * @author Work Tracker Pro Team
 * @version 2.0.0
 */

// Importaciones
import JobService from "./services/job.service.js";
import WorkerService from "./services/worker.service.js";
import { showNotification } from "./utils/notifications.js";
import { generateId } from "./utils/helpers.js";
import { searchService } from "./utils/search.js";
import { FormValidator, jobValidator, workerValidator } from "./utils/validator.js";
import { loadingManager, SkeletonLoader, ConfirmationModal, FeedbackUtils } from "./utils/loading.js";

/**
 * Clase principal de la aplicación Work Tracker Pro
 * Gestiona trabajos, trabajadores y la interfaz de usuario
 */
class WorkTrackerApp {
  /**
   * Constructor de la aplicación
   * Inicializa servicios y estado
   */
  constructor() {
    // Inicializar servicios
    this.jobService = new JobService();
    this.workerService = new WorkerService();

    // Estado inicial
    this.state = {
      fotosSeleccionadas: [],
      workerPhotoSelected: null,
      currentJobSearch: '',
      currentJobStatusFilter: '',
      currentWorkerSearch: '',
      filteredJobs: [],
      filteredWorkers: [],
    };

    // Validadores de formulario
    this.formValidators = {
      job: null,
      worker: null
    };
  }

  async initializeApp() {
    try {
      console.log("Inicializando aplicación...");

      // Inicializar servicios
      await Promise.all([this.jobService.init(), this.workerService.init()]);

      // Configurar event listeners
      this.setupEventListeners();

      // Renderizar interfaz inicial
      await this.renderInitialUI();

      console.log("Aplicación inicializada correctamente");
    } catch (error) {
      console.error("Error al inicializar:", error);
      this.ui.showNotification("Error al inicializar la aplicación", "danger");
      throw error;
    }
  }

  async renderInitialUI() {
    await Promise.all([
      this.renderJobs(),
      this.renderWorkers(),
      this.updateWorkerSelect(),
      this.updateSummary(),
    ]);
  }

  setupEventListeners() {
    // Event delegation para trabajos
    const jobsContainer = document.querySelector("#jobList");
    if (jobsContainer) {
      jobsContainer.addEventListener("click", async (e) => {
        const button = e.target.closest("button[data-job-id]");
        if (!button) return;

        const jobId = button.dataset.jobId;
        if (!jobId) return;

        try {
          if (button.classList.contains("btn-info")) {
            await this.showJobDetails(jobId);
          } else if (button.classList.contains("btn-warning")) {
            await this.editJob(jobId);
          } else if (button.classList.contains("btn-danger")) {
            await this.deleteJob(jobId);
          }
        } catch (error) {
          console.error("Error en acción de trabajo:", error);
          this.ui.showNotification("Error al procesar la acción", "danger");
        }
      });
    }

    // Event delegation para trabajadores
    const workersContainer = document.querySelector("#workerList");
    if (workersContainer) {
      workersContainer.addEventListener("click", async (e) => {
        const button = e.target.closest("button[data-worker-id]");
        if (!button) return;

        const workerId = button.dataset.workerId;
        if (!workerId) return;

        try {
          if (button.classList.contains("btn-info")) {
            await this.showWorkerDetails(workerId);
          } else if (button.classList.contains("btn-danger")) {
            await this.deleteWorker(workerId);
          }
        } catch (error) {
          console.error("Error en acción de trabajador:", error);
          this.ui.showNotification("Error al procesar la acción", "danger");
        }
      });
    }

    // Configurar validadores de formulario
    this.setupFormValidators();

    // Formulario de trabajo
    const jobForm = document.querySelector("#jobForm");
    if (jobForm) {
      jobForm.addEventListener("submit", this.handleJobSubmit.bind(this));
    }

    // Formulario de trabajador
    const workerForm = document.querySelector("#workerForm");
    if (workerForm) {
      workerForm.addEventListener("submit", this.handleWorkerSubmit.bind(this));
    }

    // Búsqueda de trabajos
    const jobSearchInput = document.querySelector("#jobSearchInput");
    if (jobSearchInput) {
      jobSearchInput.addEventListener("input", (e) => {
        this.state.currentJobSearch = e.target.value;
        this.searchAndFilterJobs();
      });
    }

    // Filtro de estado de trabajos
    const jobStatusFilter = document.querySelector("#jobStatusFilter");
    if (jobStatusFilter) {
      jobStatusFilter.addEventListener("change", (e) => {
        this.state.currentJobStatusFilter = e.target.value;
        this.searchAndFilterJobs();
      });
    }

    // Búsqueda de trabajadores
    const workerSearchInput = document.querySelector("#workerSearchInput");
    if (workerSearchInput) {
      workerSearchInput.addEventListener("input", (e) => {
        this.state.currentWorkerSearch = e.target.value;
        this.searchAndFilterWorkers();
      });
    }

    // Limpiar filtros de trabajadores
    const clearWorkerFilters = document.querySelector("#clearWorkerFilters");
    if (clearWorkerFilters) {
      clearWorkerFilters.addEventListener("click", () => {
        this.clearWorkerFilters();
      });
    }
  }

  async showJobDetails(jobId) {
    try {
      const job = this.jobService.getJobById(jobId);
      if (!job) {
        this.ui.showNotification("Trabajo no encontrado", "warning");
        return;
      }

      // Obtener información de trabajadores asignados
      if (job.workerIds && job.workerIds.length > 0) {
        job.workers = job.workerIds
          .map((id) => this.workerService.getWorkerById(id))
          .filter(Boolean);
      }

      this.ui.showJobDetailsModal(job);
    } catch (error) {
      console.error("Error al mostrar detalles:", error);
      this.ui.showNotification(
        "Error al mostrar detalles del trabajo",
        "danger"
      );
    }
  }

  async editJob(jobId) {
    try {
      const job = this.jobService.getJobById(jobId);
      if (!job) {
        this.ui.showNotification("Trabajo no encontrado", "warning");
        return;
      }

      // Rellenar el formulario
      const form = document.querySelector("#jobForm");
      if (!form) return;

      form.querySelector("#titulo").value = job.title;
      form.querySelector("#descripcion").value = job.description;
      form.querySelector("#fecha").value = job.date;
      form.querySelector("#estado").value = job.status;

      // Seleccionar trabajadores
      const trabajadorSelect = document.querySelector("#trabajador");
      if (trabajadorSelect) {
        Array.from(trabajadorSelect.options).forEach((option) => {
          option.selected = job.workerIds?.includes(option.value);
        });
      }

      // Guardar ID del trabajo en edición
      form.dataset.editingJobId = jobId;

      // Cambiar texto del botón
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = "Actualizar Trabajo";
      }

      // Scroll al formulario
      form.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error al editar:", error);
      this.ui.showNotification(
        "Error al cargar el trabajo para editar",
        "danger"
      );
    }
  }

  async deleteJob(jobId) {
    const job = this.jobService.getJobById(jobId);
    if (!job) {
      showNotification("Trabajo no encontrado", "warning");
      return;
    }

    // Mostrar confirmación moderna
    const confirmed = await ConfirmationModal.show({
      title: 'Eliminar trabajo',
      message: `¿Estás seguro de que deseas eliminar el trabajo "${job.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // Mostrar loading en la lista de trabajos
      loadingManager.show('#jobList', {
        message: 'Eliminando trabajo...'
      });

      await this.jobService.deleteJob(jobId);

      showNotification("Trabajo eliminado con éxito", "success");

      // Actualizar UI
      this.renderJobs();
      this.updateSummary();
    } catch (error) {
      console.error("Error al eliminar:", error);
      showNotification(
        error.message || "Error al eliminar el trabajo",
        "danger"
      );
    } finally {
      // Ocultar loading
      loadingManager.hide('#jobList');
    }
  }

  async handleJobSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const jobId = form.dataset.editingJobId;
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      // Habilitar validación en tiempo real para futuras interacciones
      if (this.formValidators.job) {
        this.formValidators.job.toggleRealTimeValidation(true);
      }

      // Mostrar loading en el botón
      this.setButtonLoading(submitBtn, true);

      const jobData = {
        id: jobId || generateId(),
        title: formData.get("titulo"),
        description: formData.get("descripcion"),
        date: formData.get("fecha"),
        status: formData.get("estado"),
        workerIds: Array.from(form.querySelector("#trabajador").selectedOptions)
          .map((option) => option.value)
          .filter(Boolean),
        images: this.state.fotosSeleccionadas,
        createdAt: jobId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validar datos del formulario
      const validation = jobValidator.validate(jobData);
      if (!validation.isValid) {
        showNotification(
          `Error de validación: ${validation.errorMessages.join(', ')}`,
          'danger'
        );
        return;
      }

      // Verificar duplicados
      await this.checkForDuplicates('job', jobData);

      if (jobId) {
        // Actualizar trabajo existente
        await this.jobService.updateJob(jobData);
        showNotification("Trabajo actualizado con éxito", "success");
        FeedbackUtils.pulse(form);
      } else {
        // Crear nuevo trabajo
        await this.jobService.addJob(jobData);
        showNotification("Trabajo guardado con éxito", "success");
        FeedbackUtils.highlight(form);
      }

      // Resetear formulario y validación
      form.reset();
      delete form.dataset.editingJobId;

      // Limpiar validación visual
      if (this.formValidators.job) {
        this.formValidators.job.clearValidation();
        this.formValidators.job.toggleRealTimeValidation(false);
      }

      // Resetear estado de fotos
      this.state.fotosSeleccionadas = [];

      // Actualizar UI
      await Promise.all([
        this.renderJobs(),
        this.updateSummary()
      ]);
    } catch (error) {
      console.error("Error al guardar:", error);
      showNotification(
        error.message || "Error al guardar el trabajo",
        "danger"
      );
      FeedbackUtils.shake(form);
    } finally {
      // Ocultar loading del botón
      this.setButtonLoading(submitBtn, false);
    }
  }

  async renderJobs() {
    const container = document.querySelector("#jobList");
    if (!container) return;

    // Asegurar que el servicio esté inicializado
    if (!this.jobService.initialized) {
      await this.jobService.init();
    }

    const jobs = this.jobService.getAllJobs();

    // Validar que jobs sea un array
    if (!Array.isArray(jobs)) {
      console.warn('Jobs no es un array en renderJobs:', jobs);
      container.innerHTML = '<p class="text-muted">No se pudieron cargar los trabajos</p>';
      return;
    }
    container.innerHTML = jobs
      .map(
        (job) => `
      <div class="list-group-item">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${job.title}</h5>
          <span class="badge bg-${this.getStatusBadgeClass(job.status)}">${
          job.status
        }</span>
        </div>
        <p class="mb-1">${job.description}</p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">Fecha: ${new Date(
            job.date
          ).toLocaleDateString()}</small>
          <div class="btn-group">
            <button class="btn btn-sm btn-info" data-job-id="${
              job.id
            }" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning" data-job-id="${
              job.id
            }" title="Editar trabajo">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-job-id="${
              job.id
            }" title="Eliminar trabajo">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  getStatusBadgeClass(status) {
    const statusClasses = {
      Pendiente: "warning",
      "En Progreso": "info",
      Completado: "success",
    };
    return statusClasses[status] || "secondary";
  }

  async updateWorkerSelect() {
    const select = document.querySelector("#trabajador");
    if (!select) return;

    // Verificar que el servicio esté inicializado
    if (!this.workerService || typeof this.workerService.getAllWorkers !== 'function') {
      console.warn('WorkerService no está inicializado correctamente');
      select.innerHTML = '<option value="">Seleccionar trabajador...</option>';
      return;
    }

    // Asegurar que el servicio esté completamente inicializado
    if (!this.workerService.initialized) {
      await this.workerService.init();
    }

    const workers = this.workerService.getAllWorkers();

    // Validar que workers sea un array
    if (!Array.isArray(workers)) {
      console.warn('Workers no es un array:', workers);
      select.innerHTML = '<option value="">Seleccionar trabajador...</option>';
      return;
    }

    select.innerHTML = `
      <option value="">Seleccionar trabajador...</option>
      ${workers
        .map(
          (worker) => `
        <option value="${worker.id}">${worker.name}</option>
      `
        )
        .join("")}
    `;
  }

  async updateSummary() {
    const summarySection = document.querySelector("#summarySection");
    if (!summarySection) return;

    const jobStats = await this.jobService.getJobStats();
    const workerStats = await this.workerService.getWorkerStats();

    summarySection.innerHTML = `
      <div class="row">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${jobStats.total}</h3>
            <p>Trabajos Totales</p>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${jobStats.completed}</h3>
            <p>Trabajos Completados</p>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${workerStats.total}</h3>
            <p>Trabajadores</p>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${workerStats.totalHours}</h3>
            <p>Horas Totales</p>
          </div>
        </div>
      </div>
    `;
  }

  async showWorkerDetails(workerId) {
    try {
      const worker = this.workerService.getWorkerById(workerId);
      if (worker) {
        // Obtener trabajos asignados al trabajador
        worker.jobs = this.jobService.getWorkerJobs(workerId);
        this.ui.showWorkerDetailsModal(worker);
      } else {
        this.ui.showNotification("Trabajador no encontrado", "warning");
      }
    } catch (error) {
      console.error("Error showing worker details:", error);
      this.ui.showNotification(
        "Error al mostrar detalles del trabajador",
        "danger"
      );
    }
  }

  async deleteWorker(workerId) {
    const worker = this.workerService.getWorkerById(workerId);
    if (!worker) {
      showNotification("Trabajador no encontrado", "warning");
      return;
    }

    // Verificar si el trabajador tiene trabajos asignados
    const assignedJobs = this.jobService.getAllJobs().filter(job =>
      job.workerIds && job.workerIds.includes(workerId)
    );

    let message = `¿Estás seguro de que deseas eliminar al trabajador "${worker.name}"?`;
    if (assignedJobs.length > 0) {
      message += ` Este trabajador tiene ${assignedJobs.length} trabajo(s) asignado(s).`;
    }
    message += ' Esta acción no se puede deshacer.';

    // Mostrar confirmación moderna
    const confirmed = await ConfirmationModal.show({
      title: 'Eliminar trabajador',
      message,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // Mostrar loading en la lista de trabajadores
      loadingManager.show('#workerList', {
        message: 'Eliminando trabajador...'
      });

      await this.workerService.deleteWorker(workerId);

      showNotification("Trabajador eliminado exitosamente", "success");

      // Actualizar UI
      this.renderWorkers();
      this.updateWorkerSelect();
      this.updateSummary();
    } catch (error) {
      console.error("Error deleting worker:", error);
      showNotification(
        error.message || "Error al eliminar el trabajador",
        "danger"
      );
    } finally {
      // Ocultar loading
      loadingManager.hide('#workerList');
    }
  }

  async handleWorkerSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      // Habilitar validación en tiempo real para futuras interacciones
      if (this.formValidators.worker) {
        this.formValidators.worker.toggleRealTimeValidation(true);
      }

      // Mostrar loading en el botón
      this.setButtonLoading(submitBtn, true);

      const workerData = {
        id: generateId(),
        name: formData.get("nombre"),
        specialty: formData.get("especialidad"),
        phone: formData.get("telefono") || '',
        email: formData.get("email") || '',
        profileImage: this.state.workerPhotoSelected,
        createdAt: new Date().toISOString(),
      };

      // Validar datos del formulario
      const validation = workerValidator.validate(workerData);
      if (!validation.isValid) {
        showNotification(
          `Error de validación: ${validation.errorMessages.join(', ')}`,
          'danger'
        );
        return;
      }

      // Verificar duplicados
      await this.checkForDuplicates('worker', workerData);

      await this.workerService.addWorker(workerData);
      showNotification("Trabajador guardado con éxito", "success");

      // Feedback visual positivo
      FeedbackUtils.highlight(form);

      // Resetear formulario y estado
      form.reset();
      this.state.workerPhotoSelected = null;

      // Limpiar validación visual
      if (this.formValidators.worker) {
        this.formValidators.worker.clearValidation();
        this.formValidators.worker.toggleRealTimeValidation(false);
      }

      // Actualizar UI
      await Promise.all([
        this.renderWorkers(),
        this.updateWorkerSelect(),
        this.updateSummary()
      ]);
    } catch (error) {
      console.error("Error al guardar trabajador:", error);
      showNotification(
        error.message || "Error al guardar el trabajador",
        "danger"
      );
      FeedbackUtils.shake(form);
    } finally {
      // Ocultar loading del botón
      this.setButtonLoading(submitBtn, false);
    }
  }

  async renderWorkers() {
    const container = document.querySelector("#workerList");
    if (!container) return;

    // Asegurar que el servicio esté inicializado
    if (!this.workerService.initialized) {
      await this.workerService.init();
    }

    const workers = this.workerService.getAllWorkers();

    // Validar que workers sea un array
    if (!Array.isArray(workers)) {
      console.warn('Workers no es un array en renderWorkers:', workers);
      container.innerHTML = '<p class="text-muted">No se pudieron cargar los trabajadores</p>';
      return;
    }
    container.innerHTML = workers
      .map(
        (worker) => `
      <div class="list-group-item">
        <div class="d-flex w-100 justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            ${
              worker.profileImage
                ? `<img src="${worker.profileImage}" alt="${worker.name}" class="worker-avatar me-3">`
                : '<div class="worker-avatar-placeholder me-3"><i class="fas fa-user"></i></div>'
            }
            <div>
              <h5 class="mb-1">${worker.name}</h5>
              <p class="mb-1">${worker.specialty}</p>
              <small class="text-muted">
                ${
                  worker.email
                    ? `<i class="fas fa-envelope me-1"></i>${worker.email}`
                    : ""
                }
                ${
                  worker.phone
                    ? `<i class="fas fa-phone ms-2 me-1"></i>${worker.phone}`
                    : ""
                }
              </small>
            </div>
          </div>
          <div class="btn-group">
            <button class="btn btn-sm btn-info" data-worker-id="${
              worker.id
            }" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-worker-id="${
              worker.id
            }" title="Eliminar trabajador">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Métodos de búsqueda y filtrado
  searchAndFilterJobs() {
    searchService.searchWithDebounce(() => {
      const allJobs = this.jobService.getAllJobs();

      // Añadir información de trabajadores a cada trabajo
      const jobsWithWorkers = allJobs.map(job => ({
        ...job,
        workers: job.workerIds
          ? job.workerIds.map(id => this.workerService.getWorkerById(id)).filter(Boolean)
          : []
      }));

      this.state.filteredJobs = searchService.searchJobs(
        jobsWithWorkers,
        this.state.currentJobSearch,
        this.state.currentJobStatusFilter
      );

      this.renderFilteredJobs();
      this.updateJobSearchStats();
    });
  }

  searchAndFilterWorkers() {
    searchService.searchWithDebounce(() => {
      const allWorkers = this.workerService.getAllWorkers();

      this.state.filteredWorkers = searchService.searchWorkers(
        allWorkers,
        this.state.currentWorkerSearch
      );

      this.renderFilteredWorkers();
      this.updateWorkerSearchStats();
    });
  }

  renderFilteredJobs() {
    const container = document.querySelector("#jobList");
    if (!container) return;

    if (this.state.filteredJobs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-search fa-2x mb-2"></i>
          <p>No se encontraron trabajos que coincidan con tu búsqueda</p>
          ${this.state.currentJobSearch || this.state.currentJobStatusFilter
            ? '<small>Intenta modificar los filtros de búsqueda</small>'
            : '<small>Añade tu primer trabajo usando el formulario de arriba</small>'
          }
        </div>
      `;
      return;
    }

    container.innerHTML = this.state.filteredJobs
      .map(job => {
        let title = job.title;
        let description = job.description;

        // Destacar coincidencias en la búsqueda
        if (this.state.currentJobSearch) {
          title = searchService.highlightMatch(title, this.state.currentJobSearch);
          description = searchService.highlightMatch(description, this.state.currentJobSearch);
        }

        return `
          <div class="list-group-item">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">${title}</h5>
              <span class="badge bg-${this.getStatusBadgeClass(job.status)}">${job.status}</span>
            </div>
            <p class="mb-1">${description}</p>
            ${job.workers && job.workers.length > 0
              ? `<small class="text-info">
                  <i class="fas fa-users me-1"></i>
                  ${job.workers.map(w => w.name).join(', ')}
                 </small>`
              : ''
            }
            <div class="d-flex justify-content-between align-items-center mt-2">
              <small class="text-muted">Fecha: ${new Date(job.date).toLocaleDateString()}</small>
              <div class="btn-group">
                <button class="btn btn-sm btn-info" data-job-id="${job.id}" title="Ver detalles">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" data-job-id="${job.id}" title="Editar trabajo">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" data-job-id="${job.id}" title="Eliminar trabajo">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  renderFilteredWorkers() {
    const container = document.querySelector("#workerList");
    if (!container) return;

    if (this.state.filteredWorkers.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-search fa-2x mb-2"></i>
          <p>No se encontraron trabajadores que coincidan con tu búsqueda</p>
          ${this.state.currentWorkerSearch
            ? '<small>Intenta modificar el término de búsqueda</small>'
            : '<small>Añade tu primer trabajador usando el formulario de arriba</small>'
          }
        </div>
      `;
      return;
    }

    container.innerHTML = this.state.filteredWorkers
      .map(worker => {
        let name = worker.name;
        let specialty = worker.specialty;

        // Destacar coincidencias en la búsqueda
        if (this.state.currentWorkerSearch) {
          name = searchService.highlightMatch(name, this.state.currentWorkerSearch);
          specialty = searchService.highlightMatch(specialty, this.state.currentWorkerSearch);
        }

        return `
          <div class="list-group-item">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                ${worker.profileImage
                  ? `<img src="${worker.profileImage}" alt="${worker.name}" class="worker-avatar me-3">`
                  : '<div class="worker-avatar-placeholder me-3"><i class="fas fa-user"></i></div>'
                }
                <div>
                  <h5 class="mb-1">${name}</h5>
                  <p class="mb-1">${specialty}</p>
                  <small class="text-muted">
                    ${worker.email
                      ? `<i class="fas fa-envelope me-1"></i>${worker.email}`
                      : ""
                    }
                    ${worker.phone
                      ? `<i class="fas fa-phone ms-2 me-1"></i>${worker.phone}`
                      : ""
                    }
                  </small>
                </div>
              </div>
              <div class="btn-group">
                <button class="btn btn-sm btn-info" data-worker-id="${worker.id}" title="Ver detalles">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" data-worker-id="${worker.id}" title="Eliminar trabajador">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  updateJobSearchStats() {
    // Opcional: mostrar estadísticas de búsqueda
    const allJobs = this.jobService.getAllJobs();
    const stats = searchService.getSearchStats(
      allJobs.length,
      this.state.filteredJobs.length,
      this.state.currentJobSearch
    );

    console.log('Job search stats:', stats);
  }

  updateWorkerSearchStats() {
    // Opcional: mostrar estadísticas de búsqueda
    const allWorkers = this.workerService.getAllWorkers();
    const stats = searchService.getSearchStats(
      allWorkers.length,
      this.state.filteredWorkers.length,
      this.state.currentWorkerSearch
    );

    console.log('Worker search stats:', stats);
  }

  clearWorkerFilters() {
    this.state.currentWorkerSearch = '';
    const searchInput = document.querySelector("#workerSearchInput");
    if (searchInput) {
      searchInput.value = '';
    }
    this.searchAndFilterWorkers();
  }

  // Actualizar el método renderJobs para usar el sistema de filtros
  renderJobs() {
    // Inicializar búsqueda si no hay filtros activos
    if (!this.state.currentJobSearch && !this.state.currentJobStatusFilter) {
      this.state.filteredJobs = this.jobService.getAllJobs();
    }
    this.renderFilteredJobs();
  }

  // Actualizar el método renderWorkers para usar el sistema de filtros
  renderWorkers() {
    // Inicializar búsqueda si no hay filtros activos
    if (!this.state.currentWorkerSearch) {
      this.state.filteredWorkers = this.workerService.getAllWorkers();
    }
    this.renderFilteredWorkers();
  }

  // Configurar validadores de formulario
  setupFormValidators() {
    const jobForm = document.querySelector("#jobForm");
    const workerForm = document.querySelector("#workerForm");

    if (jobForm) {
      this.formValidators.job = new FormValidator(jobForm, jobValidator);
      // Desactivar validación en tiempo real inicial
      this.formValidators.job.toggleRealTimeValidation(false);
    }

    if (workerForm) {
      this.formValidators.worker = new FormValidator(workerForm, workerValidator);
      // Desactivar validación en tiempo real inicial
      this.formValidators.worker.toggleRealTimeValidation(false);
    }
  }

  // Manejar errores de duplicados
  async checkForDuplicates(type, data) {
    if (type === 'job') {
      // Asegurar que el servicio esté inicializado
      if (!this.jobService.initialized) {
        await this.jobService.init();
      }

      const jobs = this.jobService.getAllJobs();

      // Validar que jobs sea un array
      if (!Array.isArray(jobs)) {
        console.warn('Jobs no es un array en checkForDuplicates:', jobs);
        return; // No podemos verificar duplicados si no tenemos un array válido
      }

      const duplicateTitle = jobs.find(job =>
        job.title.toLowerCase() === data.title.toLowerCase() &&
        job.id !== data.id
      );

      if (duplicateTitle) {
        throw new Error('Ya existe un trabajo con este título');
      }
    } else if (type === 'worker') {
      // Asegurar que el servicio esté inicializado
      if (!this.workerService.initialized) {
        await this.workerService.init();
      }

      const workers = this.workerService.getAllWorkers();

      // Validar que workers sea un array
      if (!Array.isArray(workers)) {
        console.warn('Workers no es un array en checkForDuplicates:', workers);
        return; // No podemos verificar duplicados si no tenemos un array válido
      }

      // Verificar nombre duplicado
      const duplicateName = workers.find(worker =>
        worker.name.toLowerCase() === data.name.toLowerCase() &&
        worker.id !== data.id
      );

      if (duplicateName) {
        throw new Error('Ya existe un trabajador con este nombre');
      }

      // Verificar email duplicado (si se proporciona)
      if (data.email) {
        const duplicateEmail = workers.find(worker =>
          worker.email &&
          worker.email.toLowerCase() === data.email.toLowerCase() &&
          worker.id !== data.id
        );

        if (duplicateEmail) {
          throw new Error('Ya existe un trabajador con este email');
        }
      }

      // Verificar teléfono duplicado (si se proporciona)
      if (data.phone) {
        const duplicatePhone = workers.find(worker =>
          worker.phone &&
          worker.phone === data.phone &&
          worker.id !== data.id
        );

        if (duplicatePhone) {
          throw new Error('Ya existe un trabajador con este teléfono');
        }
      }
    }
  }

  // Métodos para loading states
  setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      // Guardar texto original si no está guardado
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.innerHTML;
      }

      button.disabled = true;
      button.classList.add('btn-loading');
      button.innerHTML = `
        <span class="btn-text">${button.dataset.originalText}</span>
      `;
    } else {
      button.disabled = false;
      button.classList.remove('btn-loading');
      if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
      }
    }
  }

  showSkeletonLoaders(container, type = 'job', count = 3) {
    if (!container) return;

    const skeletons = [];
    for (let i = 0; i < count; i++) {
      if (type === 'job') {
        skeletons.push(SkeletonLoader.createJobCard());
      } else if (type === 'worker') {
        skeletons.push(SkeletonLoader.createWorkerCard());
      }
    }

    container.innerHTML = '';
    skeletons.forEach(skeleton => container.appendChild(skeleton));
  }

}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Crear e inicializar la aplicación
    window.app = new WorkTrackerApp();
    await window.app.initializeApp();

    console.log("Aplicación inicializada correctamente");

    // Configurar funcionalidades adicionales
    // TODO: Implementar reconocimiento de voz si se requiere
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
    const container = document.querySelector("#notification-container");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          Error al inicializar la aplicación
        </div>
      `;
    }
  }
});
