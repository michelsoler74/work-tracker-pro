class UI {
  constructor() {
    // Contenedores principales
    this.jobsContainer = document.querySelector("#jobs-container");
    this.workersContainer = document.querySelector("#workers-container");
    this.notificationContainer = document.querySelector(
      "#notification-container"
    );

    // Formularios
    this.jobForm = document.querySelector("#jobForm");
    this.workerForm = document.querySelector("#workerForm");

    // Modales
    this.initializeModals();

    // Elementos de formulario para trabajos
    this.jobTitleInput = document.querySelector("#titulo");
    this.jobDescriptionInput = document.querySelector("#descripcion");
    this.jobDateInput = document.querySelector("#fecha");
    this.jobStatusSelect = document.querySelector("#estado");
    this.jobWorkersSelect = document.querySelector("#trabajador");

    // Botón de submit del formulario de trabajo
    this.jobSubmitButton = this.jobForm?.querySelector('button[type="submit"]');
  }

  initializeModals() {
    // Esperar a que Bootstrap esté disponible
    if (typeof bootstrap !== "undefined") {
      const jobDetailsModalEl = document.querySelector("#jobDetailsModal");
      const workerDetailsModalEl = document.querySelector(
        "#workerDetailsModal"
      );

      if (jobDetailsModalEl) {
        this.jobDetailsModal = new bootstrap.Modal(jobDetailsModalEl);
      }

      if (workerDetailsModalEl) {
        this.workerDetailsModal = new bootstrap.Modal(workerDetailsModalEl);
      }
    } else {
      console.warn(
        "Bootstrap no está disponible. Los modales podrían no funcionar correctamente."
      );
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = "alert";
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    this.notificationContainer.appendChild(notification);
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 150);
    }, 3000);
  }

  showJobDetailsModal(job) {
    const modalBody = document.querySelector("#jobDetailsModal .modal-body");
    modalBody.innerHTML = `
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
        
        ${this.renderAssignedWorkers(job)}
        ${this.renderJobImages(job)}
      </div>
    `;
    this.jobDetailsModal.show();
  }

  showWorkerDetailsModal(worker) {
    const modalBody = document.querySelector("#workerDetailsModal .modal-body");
    modalBody.innerHTML = `
      <div class="worker-details">
        <div class="d-flex align-items-center mb-4">
          ${this.renderWorkerAvatar(worker)}
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
      </div>
    `;
    this.workerDetailsModal.show();
  }

  fillJobForm(job) {
    this.jobTitleInput.value = job.title;
    this.jobDescriptionInput.value = job.description;
    this.jobDateInput.value = job.date;
    this.jobStatusSelect.value = job.status;

    // Seleccionar trabajadores asignados
    if (this.jobWorkersSelect) {
      Array.from(this.jobWorkersSelect.options).forEach((option) => {
        option.selected = job.workerIds?.includes(option.value);
      });
    }

    // Cambiar el texto del botón
    if (this.jobSubmitButton) {
      this.jobSubmitButton.textContent = "Actualizar Trabajo";
      this.jobForm.dataset.editingJobId = job.id;
    }

    // Hacer scroll al formulario
    this.jobForm.scrollIntoView({ behavior: "smooth" });
  }

  resetJobForm() {
    this.jobForm.reset();
    if (this.jobSubmitButton) {
      this.jobSubmitButton.textContent = "Guardar Trabajo";
    }
    delete this.jobForm.dataset.editingJobId;
  }

  getStatusBadgeClass(status) {
    const statusClasses = {
      Pendiente: "warning",
      "En Progreso": "info",
      Completado: "success",
      pending: "warning",
      "in-progress": "info",
      completed: "success",
    };
    return statusClasses[status] || "secondary";
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  renderAssignedWorkers(job) {
    if (!job.workerIds || job.workerIds.length === 0) {
      return "";
    }

    return `
      <div class="info-item mb-3">
        <strong>Trabajadores Asignados:</strong>
        <div class="trabajadores-asignados mt-2">
          ${job.workers
            .map(
              (worker) => `
            <div class="trabajador-asignado">
              ${this.renderWorkerAvatar(worker)}
              <div>
                <h5 class="mb-1">${worker.name}</h5>
                <p class="mb-0">${worker.specialty}</p>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  renderWorkerAvatar(worker) {
    return worker.photo
      ? `<img src="${worker.photo}" alt="${worker.name}" class="worker-avatar me-3">`
      : `<div class="worker-avatar-placeholder me-3">
          <i class="fas fa-user"></i>
         </div>`;
  }

  renderJobImages(job) {
    if (!job.images || job.images.length === 0) {
      return "";
    }

    return `
      <div class="info-item mb-3">
        <strong>Fotos:</strong>
        <div class="fotos-trabajo mt-2">
          ${job.images
            .map(
              (image) => `
            <img src="${image}" alt="Foto del trabajo" class="job-image me-2">
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }
}

// Exportar la clase UI
export default UI;

function createJobCard(job) {
  const jobCard = document.createElement("div");
  jobCard.className = "job-card";
  jobCard.innerHTML = `
    <h3>${job.title}</h3>
    <p>${job.description}</p>
    <p>Fecha: ${job.date}</p>
    <p>${
      job.assignedWorkers.length
        ? "Trabajadores asignados"
        : "Sin trabajadores asignados"
    }</p>
    ${
      job.photos.length
        ? `<img src="${job.photos[0]}" alt="Foto del trabajo" class="job-photo"/>`
        : ""
    }
    <div class="button-group">
      <button class="btn btn-info" data-job-id="${job.id}">
        <i class="fas fa-eye"></i> Ver detalles
      </button>
      <button class="btn btn-warning" data-job-id="${job.id}">
        <i class="fas fa-edit"></i> Editar
      </button>
      <button class="btn btn-danger" data-job-id="${job.id}">
        <i class="fas fa-trash"></i> Eliminar
      </button>
    </div>
  `;
  return jobCard;
}

function createWorkerCard(worker) {
  const workerCard = document.createElement("div");
  workerCard.className = "worker-card";
  workerCard.innerHTML = `
    <div class="worker-info">
      <div class="worker-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="worker-details">
        <h3>${worker.name}</h3>
        <p>${worker.role}</p>
      </div>
    </div>
    <div class="button-group">
      <button class="btn btn-info" data-worker-id="${worker.id}">
        <i class="fas fa-eye"></i>
      </button>
      <button class="btn btn-danger" data-worker-id="${worker.id}">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  return workerCard;
}
