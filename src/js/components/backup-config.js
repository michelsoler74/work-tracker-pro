import { storageService } from "../storage.js";

class BackupConfig {
  constructor() {
    this.initializeUI();
    this.setupEventListeners();
  }

  initializeUI() {
    // Crear el botón de configuración
    const configButton = document.createElement("button");
    configButton.className =
      "btn btn-outline-primary position-fixed bottom-0 end-0 m-3";
    configButton.innerHTML = '<i class="fas fa-cog"></i> Configurar Respaldo';
    configButton.id = "configBackupBtn";
    document.body.appendChild(configButton);

    // Crear el modal de configuración
    const modalHTML = `
            <div class="modal fade" id="backupConfigModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Configuración de Respaldo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Directorio de Respaldo</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="backupDirectory" readonly>
                                    <button class="btn btn-outline-secondary" type="button" id="selectDirectoryBtn">
                                        Seleccionar
                                    </button>
                                </div>
                                <small class="text-muted">
                                    Los respaldos se guardarán automáticamente en este directorio
                                </small>
                            </div>
                            <div class="mb-3">
                                <button class="btn btn-primary" id="createBackupBtn">
                                    Crear Respaldo Ahora
                                </button>
                                <button class="btn btn-secondary ms-2" id="restoreBackupBtn">
                                    Restaurar Respaldo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  setupEventListeners() {
    // Botón de configuración
    document.getElementById("configBackupBtn").addEventListener("click", () => {
      const modal = new bootstrap.Modal(
        document.getElementById("backupConfigModal")
      );
      modal.show();
    });

    // Botón de crear respaldo
    document
      .getElementById("createBackupBtn")
      .addEventListener("click", async () => {
        try {
          await storageService.createBackup();
          this.showNotification("Respaldo creado exitosamente", "success");
        } catch (error) {
          this.showNotification("Error al crear el respaldo", "danger");
          console.error(error);
        }
      });

    // Botón de restaurar respaldo
    document
      .getElementById("restoreBackupBtn")
      .addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            try {
              const success = await storageService.restoreFromBackup(file);
              if (success) {
                this.showNotification(
                  "Respaldo restaurado exitosamente",
                  "success"
                );
                window.location.reload();
              } else {
                this.showNotification(
                  "Error al restaurar el respaldo",
                  "danger"
                );
              }
            } catch (error) {
              this.showNotification("Error al restaurar el respaldo", "danger");
              console.error(error);
            }
          }
        };
        input.click();
      });

    // Botón de seleccionar directorio
    document
      .getElementById("selectDirectoryBtn")
      .addEventListener("click", () => {
        this.showNotification(
          "Los respaldos se descargarán automáticamente a tu carpeta de Descargas",
          "info"
        );
      });
  }

  showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
  }
}

// Exportar la instancia del componente
export const backupConfig = new BackupConfig();
