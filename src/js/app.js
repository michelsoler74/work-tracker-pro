// Registro del Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registrado con éxito:", registration.scope);
      })
      .catch((error) => {
        console.error("Error al registrar el Service Worker:", error);
      });
  });
}

// Aplicación principal
import { storageService } from "./storage.js";
import { jobService } from "./services/job.service.js";
import { workerService } from "./services/worker.service.js";
import { initVoiceRecognition } from "./voice.js";
import { showNotification } from "./utils/notifications.js";

class WorkTrackerApp {
  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    console.log("Inicializando WorkTrackerApp...");

    // Estado de la aplicación
    this.state = {
      fotosSeleccionadas: [],
      workerPhotoSelected: null,
    };

    // Inicializar la interfaz
    this.initializeUI();

    // Cargar datos existentes
    await this.loadData();

    // Configurar eventos
    this.setupEventListeners();

    // Mostrar mensaje de bienvenida
    showNotification("¡Bienvenido a Work Tracker Pro!", "info");
  }

  initializeUI() {
    console.log("Inicializando UI...");

    // Formulario de trabajo
    this.jobForm = document.getElementById("jobForm");
    this.jobList = document.getElementById("jobList");
    this.photoInput = document.getElementById("photoInput");
    this.photoPreview = document.getElementById("photoPreview");

    // Formulario de trabajador
    this.workerForm = document.getElementById("workerForm");
    this.workerList = document.getElementById("workerList");
    this.workerPhotoInput = document.getElementById("workerPhotoInput");
    this.workerPhotoPreview = document.getElementById("workerPhotoPreview");

    // Resumen y estadísticas
    this.summarySection = document.getElementById("summarySection");

    // Configurar botones de voz
    this.setupVoiceButtons();
  }

  setupVoiceButtons() {
    console.log("Configurando botones de voz...");

    // Lista de IDs y botones correspondientes
    const voiceFields = [
      { inputId: "titulo", label: "título" },
      { inputId: "descripcion", label: "descripción" },
      { inputId: "nombre", label: "nombre" },
      { inputId: "especialidad", label: "especialidad" },
      { inputId: "telefono", label: "teléfono" },
      { inputId: "email", label: "email" },
    ];

    // Aplicar forzosamente los estilos a todos los botones de voz
    const forceButtonStyles = () => {
      document.querySelectorAll(".btn-voice").forEach((button) => {
        console.log("Aplicando estilos al botón:", button);
        button.style.backgroundColor = "#0d6efd";
        button.style.color = "white";
        button.style.border = "2px solid #0d6efd";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.minWidth = "40px";
        button.style.borderTopRightRadius = "0.25rem";
        button.style.borderBottomRightRadius = "0.25rem";
        button.style.zIndex = "100";
        button.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
        button.style.position = "relative";

        // Si es parte de un textarea, ajustar para cubrir toda la altura
        const parentGroup = button.closest(".input-group");
        if (parentGroup && parentGroup.querySelector("textarea")) {
          button.style.alignSelf = "stretch";
          button.style.height = "auto";
        }
      });
    };

    // Asegurarse de que los botones sean visibles inmediatamente
    forceButtonStyles();

    // Configurar eventos para cada botón
    voiceFields.forEach((field) => {
      const input = document.getElementById(field.inputId);
      if (!input) {
        console.warn(`Input con id ${field.inputId} no encontrado`);
        return;
      }

      const button = input.parentElement?.querySelector(".btn-voice");
      if (!button) {
        console.warn(`Botón de voz para ${field.inputId} no encontrado`);
        return;
      }

      // Configurar el evento click
      button.onclick = () => {
        console.log(`Iniciando reconocimiento de voz para ${field.inputId}`);
        initVoiceRecognition(input);
      };
    });

    // Aplicar los estilos nuevamente después de un tiempo para asegurar que se muestren
    setTimeout(forceButtonStyles, 500);
    setTimeout(forceButtonStyles, 1000);

    console.log("Botones de voz configurados correctamente");
  }

  async loadData() {
    try {
      console.log("Cargando datos...");

      // Cargar trabajos y trabajadores usando los servicios
      await jobService.loadJobs();
      await workerService.loadWorkers();

      // Renderizar la interfaz
      this.renderJobs();
      this.renderWorkers();
      this.updateWorkerSelect();
      this.updateSummary();
    } catch (error) {
      showNotification("Error al cargar los datos", "danger");
      console.error("Error loading data:", error);
    }
  }

  updateWorkerSelect() {
    const select = document.getElementById("trabajador");
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar trabajador...</option>';
    workerService.workers.forEach((worker) => {
      const option = document.createElement("option");
      option.value = worker.id;
      option.textContent = worker.name;
      select.appendChild(option);
    });
  }

  setupEventListeners() {
    console.log("Configurando event listeners...");

    // Eventos del formulario de trabajo
    if (this.jobForm) {
      this.jobForm.addEventListener("submit", (e) => this.handleJobSubmit(e));
    }
    if (this.photoInput) {
      this.photoInput.addEventListener("change", (e) =>
        this.handlePhotoSelect(e)
      );
    }

    // Eventos del formulario de trabajador
    if (this.workerForm) {
      this.workerForm.addEventListener("submit", (e) =>
        this.handleWorkerSubmit(e)
      );
    }
    if (this.workerPhotoInput) {
      this.workerPhotoInput.addEventListener("change", (e) =>
        this.handleWorkerPhotoSelect(e)
      );
    }

    // Botones de exportar
    const btnExportarTrabajos = document.getElementById("btnExportarTrabajos");
    if (btnExportarTrabajos) {
      btnExportarTrabajos.addEventListener("click", () =>
        this.exportarTrabajos()
      );
    }

    const btnExportarTrabajadores = document.getElementById(
      "btnExportarTrabajadores"
    );
    if (btnExportarTrabajadores) {
      btnExportarTrabajadores.addEventListener("click", () =>
        this.exportarTrabajadores()
      );
    }
  }

  async handleJobSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.jobForm);

    try {
      const jobData = {
        title: formData.get("titulo"),
        description: formData.get("descripcion"),
        date: formData.get("fecha"),
        status: formData.get("estado"),
        workerId: formData.get("trabajador"),
        images: this.state.fotosSeleccionadas,
      };

      await jobService.addJob(jobData);
      this.renderJobs();
      this.updateSummary();
      this.jobForm.reset();
      this.clearPhotoPreview();
    } catch (error) {
      showNotification(
        error.message || "Error al guardar el trabajo",
        "danger"
      );
    }
  }

  async handleWorkerSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.workerForm);

    try {
      const workerData = {
        name: formData.get("nombre"),
        specialty: formData.get("especialidad"),
        phone: formData.get("telefono"),
        email: formData.get("email"),
        photo: this.state.workerPhotoSelected,
      };

      await workerService.addWorker(workerData);
      this.renderWorkers();
      this.updateWorkerSelect();
      this.workerForm.reset();
      this.clearWorkerPhotoPreview();
    } catch (error) {
      showNotification(
        error.message || "Error al guardar el trabajador",
        "danger"
      );
    }
  }

  handlePhotoSelect(e) {
    const files = Array.from(e.target.files);
    this.state.fotosSeleccionadas = files;

    // Mostrar vista previa
    this.photoPreview.innerHTML = "";
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "preview-img me-2 mb-2";
        this.photoPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  handleWorkerPhotoSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.state.workerPhotoSelected = file;

      // Mostrar vista previa
      const reader = new FileReader();
      reader.onload = (e) => {
        this.workerPhotoPreview.innerHTML = `
                    <img src="${e.target.result}" class="worker-preview-img">
                `;
      };
      reader.readAsDataURL(file);
    }
  }

  renderJobs() {
    if (!this.jobList) return;

    this.jobList.innerHTML = jobService.jobs
      .map(
        (job) => `
        <div class="list-group-item list-group-item-action">
          <div class="d-flex w-100 justify-content-between align-items-center">
            <h5 class="mb-1">${job.title}</h5>
            <span class="badge bg-${this.getStatusBadgeClass(job.status)}">${
          job.status
        }</span>
          </div>
          <p class="mb-1 text-truncate">${job.description}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">Fecha: ${this.formatDate(
              job.date
            )}</small>
            <div>
              <button class="btn btn-sm btn-info me-2" data-job-id="${
                job.id
              }" onclick="window.app.showJobDetails('${
          job.id
        }')" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-danger" data-job-id="${
                job.id
              }" onclick="window.app.deleteJob('${
          job.id
        }')" title="Eliminar trabajo">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          ${this.renderJobImages(job.images)}
        </div>
      `
      )
      .join("");
  }

  renderWorkers() {
    if (!this.workerList) return;

    this.workerList.innerHTML = workerService.workers
      .map(
        (worker) => `
        <div class="list-group-item list-group-item-action">
          <div class="d-flex w-100 justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              ${
                worker.photo
                  ? `<img src="${worker.photo}" alt="${worker.name}" class="worker-avatar me-3">`
                  : `<div class="worker-avatar-placeholder me-3">
                      <i class="fas fa-user"></i>
                     </div>`
              }
              <div>
                <h5 class="mb-1">${worker.name}</h5>
                <p class="mb-1">${worker.specialty}</p>
              </div>
            </div>
            <div>
              <button class="btn btn-sm btn-info me-2" data-worker-id="${
                worker.id
              }" onclick="window.app.showWorkerDetails('${
          worker.id
        }')" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-danger" data-worker-id="${
                worker.id
              }" onclick="window.app.deleteWorker('${
          worker.id
        }')" title="Eliminar trabajador">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  renderJobImages(images) {
    if (!images || images.length === 0) return "";
    return `
      <div class="job-images mt-2">
        ${Array.from(images)
          .map((image) => {
            const imgSrc =
              typeof image === "string" ? image : URL.createObjectURL(image);
            return `<img src="${imgSrc}" class="job-image me-2" alt="Foto del trabajo" onclick="window.app.showImageModal('${imgSrc}')">`;
          })
          .join("")}
      </div>
    `;
  }

  async showJobDetails(jobId) {
    console.log("Mostrando detalles del trabajo:", jobId);
    const job = await jobService.getJobById(jobId);
    if (!job) return;

    const worker = job.workerId
      ? await workerService.getWorkerById(job.workerId)
      : null;

    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = `
      <div class="job-details">
        <h4>${job.title}</h4>
        <p class="text-muted mb-4">${job.description}</p>
        
        <div class="info-item mb-3">
          <strong>Estado:</strong>
          <span class="badge bg-${this.getStatusBadgeClass(job.status)}">${
      job.status
    }</span>
        </div>
        
        <div class="info-item mb-3">
          <strong>Fecha:</strong>
          <span>${this.formatDate(job.date)}</span>
        </div>
        
        ${
          worker
            ? `
          <div class="info-item mb-3">
            <strong>Trabajador Asignado:</strong>
            <div class="d-flex align-items-center mt-2">
              ${
                worker.photo
                  ? `<img src="${worker.photo}" alt="${worker.name}" class="worker-avatar me-3">`
                  : `<div class="worker-avatar-placeholder me-3">
                      <i class="fas fa-user"></i>
                     </div>`
              }
              <div>
                <h5 class="mb-1">${worker.name}</h5>
                <p class="mb-0">${worker.specialty}</p>
              </div>
            </div>
          </div>
          `
            : ""
        }
        
        ${
          job.images && job.images.length > 0
            ? `
          <div class="info-item mb-3">
            <strong>Fotos:</strong>
            <div class="fotos-trabajo mt-2">
              ${this.renderJobImages(job.images)}
            </div>
          </div>
          `
            : ""
        }
      </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById("detallesModal"));
    modal.show();
  }

  async showWorkerDetails(workerId) {
    console.log("Mostrando detalles del trabajador:", workerId);
    const worker = await workerService.getWorkerById(workerId);
    if (!worker) return;

    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = `
      <div class="worker-details">
        <div class="d-flex align-items-center mb-4">
          ${
            worker.photo
              ? `<img src="${worker.photo}" alt="${worker.name}" class="worker-preview-img me-4">`
              : `<div class="worker-avatar-placeholder me-4" style="width: 150px; height: 150px;">
                  <i class="fas fa-user"></i>
                 </div>`
          }
          <div>
            <h4>${worker.name}</h4>
            <p class="text-muted mb-0">${worker.specialty}</p>
          </div>
        </div>
        
        ${
          worker.phone
            ? `
          <div class="info-item mb-3">
            <strong>Teléfono:</strong>
            <p class="mb-0">${worker.phone}</p>
          </div>
          `
            : ""
        }
        
        ${
          worker.email
            ? `
          <div class="info-item mb-3">
            <strong>Email:</strong>
            <p class="mb-0">${worker.email}</p>
          </div>
          `
            : ""
        }
        
        <div class="info-item mb-3">
          <strong>Trabajos Asignados:</strong>
          <div class="list-group mt-2">
            ${this.getWorkerJobs(worker.id)}
          </div>
        </div>
      </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById("detallesModal"));
    modal.show();
  }

  getWorkerJobs(workerId) {
    const workerJobs = jobService.jobs.filter(
      (job) => job.workerId === workerId
    );
    if (workerJobs.length === 0) {
      return '<p class="text-muted">No hay trabajos asignados</p>';
    }

    return workerJobs
      .map(
        (job) => `
        <div class="list-group-item">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${job.title}</h6>
            <span class="badge bg-${this.getStatusBadgeClass(job.status)}">${
          job.status
        }</span>
          </div>
          <p class="mb-1 text-truncate">${job.description}</p>
          <small class="text-muted">Fecha: ${this.formatDate(job.date)}</small>
        </div>
      `
      )
      .join("");
  }

  async deleteJob(jobId) {
    if (confirm("¿Estás seguro de que deseas eliminar este trabajo?")) {
      try {
        await jobService.deleteJob(jobId);
        this.renderJobs();
        this.updateSummary();
        showNotification("Trabajo eliminado con éxito", "success");
      } catch (error) {
        showNotification(
          error.message || "Error al eliminar el trabajo",
          "danger"
        );
      }
    }
  }

  async deleteWorker(workerId) {
    if (confirm("¿Estás seguro de que deseas eliminar este trabajador?")) {
      try {
        await workerService.deleteWorker(workerId);
        this.renderWorkers();
        this.updateWorkerSelect();
        this.updateSummary();
        showNotification("Trabajador eliminado con éxito", "success");
      } catch (error) {
        showNotification(
          error.message || "Error al eliminar el trabajador",
          "danger"
        );
      }
    }
  }

  getStatusBadgeClass(status) {
    const statusClasses = {
      Pendiente: "warning",
      "En Progreso": "info",
      Completado: "success",
      // Valores antiguos (compatibilidad hacia atrás)
      pending: "warning",
      "in-progress": "info",
      completed: "success",
    };
    return statusClasses[status] || "secondary";
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  showImageModal(imgSrc) {
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = `
      <img src="${imgSrc}" class="img-fluid" alt="Foto del trabajo">
    `;
    const modal = new bootstrap.Modal(document.getElementById("detallesModal"));
    modal.show();
  }

  updateSummary() {
    if (!this.summarySection) return;

    const totalJobs = jobService.jobs.length;
    const completedJobs = jobService.jobs.filter(
      (job) => job.status === "Completado" || job.status === "completed"
    ).length;
    const totalWorkers = workerService.workers.length;
    const assignedWorkers = new Set(
      jobService.jobs.map((job) => job.workerId).filter(Boolean)
    ).size;

    this.summarySection.innerHTML = `
      <div class="row">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${totalJobs}</h3>
            <p>Trabajos Totales</p>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${completedJobs}</h3>
            <p>Trabajos Completados</p>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${totalWorkers}</h3>
            <p>Trabajadores</p>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <h3>${assignedWorkers}</h3>
            <p>Trabajadores Asignados</p>
          </div>
        </div>
      </div>
    `;
  }

  exportarTrabajos() {
    try {
      const trabajosJSON = JSON.stringify(jobService.jobs, null, 2);
      const blob = new Blob([trabajosJSON], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `trabajos_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      showNotification("Datos de trabajos exportados correctamente", "success");
    } catch (error) {
      showNotification("Error al exportar los datos de trabajos", "danger");
      console.error("Error exportando trabajos:", error);
    }
  }

  exportarTrabajadores() {
    try {
      const trabajadoresJSON = JSON.stringify(workerService.workers, null, 2);
      const blob = new Blob([trabajadoresJSON], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `trabajadores_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      showNotification(
        "Datos de trabajadores exportados correctamente",
        "success"
      );
    } catch (error) {
      showNotification("Error al exportar los datos de trabajadores", "danger");
      console.error("Error exportando trabajadores:", error);
    }
  }

  clearPhotoPreview() {
    this.photoPreview.innerHTML = "";
    this.state.fotosSeleccionadas = [];
  }

  clearWorkerPhotoPreview() {
    this.workerPhotoPreview.innerHTML = "";
    this.state.workerPhotoSelected = null;
  }

  // Exponer la función de reconocimiento de voz para ser accesible desde HTML
  initVoiceRecognition(inputElement) {
    return initVoiceRecognition(inputElement);
  }

  async resetApp() {
    console.log("Reiniciando la aplicación...");
    showNotification("Reiniciando la aplicación...", "info");

    try {
      // Mostrar indicador de carga
      document.body.classList.add("loading");

      // Limpiar el estado actual
      this.state = {
        fotosSeleccionadas: [],
        workerPhotoSelected: null,
      };

      // Limpiar las vistas
      this.clearPhotoPreview();
      this.clearWorkerPhotoPreview();

      if (this.jobList) this.jobList.innerHTML = "";
      if (this.workerList) this.workerList.innerHTML = "";
      if (this.summarySection) this.summarySection.innerHTML = "";

      // Resetear formularios
      if (this.jobForm) this.jobForm.reset();
      if (this.workerForm) this.workerForm.reset();

      // Reiniciar la base de datos
      await storageService.resetDatabase();

      // Restablecer los servicios
      await jobService.reset();
      await workerService.reset();

      // Recargar los datos de los servicios
      await jobService.loadJobs();
      await workerService.loadWorkers();

      // Refrescar la interfaz
      this.renderJobs();
      this.renderWorkers();
      this.updateSummary();

      // Quitar indicador de carga
      document.body.classList.remove("loading");

      showNotification("¡Aplicación reiniciada con éxito!", "success");
    } catch (error) {
      // Quitar indicador de carga en caso de error
      document.body.classList.remove("loading");

      console.error("Error al reiniciar la aplicación:", error);
      showNotification("Error al reiniciar la aplicación", "danger");
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM completamente cargado, inicializando aplicación...");

  // Agregar un evento para el botón de reinicio si existe
  const resetButton = document.getElementById("resetAppButton");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (window.app) {
        // Mostrar confirmación antes de reiniciar
        if (
          confirm(
            "¿Estás seguro de que deseas reiniciar la aplicación? Todos los datos serán eliminados."
          )
        ) {
          window.app.resetApp();
        }
      }
    });
  }

  // Función para forzar los estilos de los botones de micrófono
  const forceVoiceButtonStyles = () => {
    console.log("Aplicando estilos forzados a los botones de micrófono...");
    document.querySelectorAll(".btn-voice").forEach((button) => {
      console.log("Botón encontrado:", button);
      // Aplicar estilos inline directamente
      Object.assign(button.style, {
        backgroundColor: "#0d6efd",
        color: "white",
        border: "2px solid #0d6efd",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "40px",
        borderTopRightRadius: "0.25rem",
        borderBottomRightRadius: "0.25rem",
        zIndex: "100",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
        position: "relative",
      });

      // Si es parte de un textarea, ajustar para cubrir toda la altura
      const parentGroup = button.closest(".input-group");
      if (parentGroup && parentGroup.querySelector("textarea")) {
        button.style.alignSelf = "stretch";
        button.style.height = "auto";
      }

      // Asegurar que el ícono sea visible
      const icon = button.querySelector(".fa-microphone");
      if (icon) {
        icon.style.color = "white";
      }

      // Configurar el evento directamente
      button.onclick = function () {
        const input = this.previousElementSibling;
        if (input && typeof initVoiceRecognition === "function") {
          console.log(
            `Activando reconocimiento de voz para ${input.id || "input"}`
          );
          initVoiceRecognition(input);
        } else {
          console.error("No se puede activar el reconocimiento de voz");
        }
      };
    });
  };

  // Inicializar la aplicación
  try {
    window.app = new WorkTrackerApp();
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
  }

  // Aplicar estilos a los botones de voz en varios momentos para garantizar que se muestren
  forceVoiceButtonStyles();
  setTimeout(forceVoiceButtonStyles, 500);
  setTimeout(forceVoiceButtonStyles, 1000);
  setTimeout(forceVoiceButtonStyles, 2000);
});
