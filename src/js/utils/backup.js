// Sistema completo de backup y restore
import { showNotification } from './notifications.js';
import { formatDate, downloadJSON } from './helpers.js';

export class BackupManager {
  constructor() {
    this.version = '1.0.0';
    this.autoBackupKey = 'worktracker_auto_backup';
    this.backupHistoryKey = 'worktracker_backup_history';
    this.maxAutoBackups = 5;
    this.autoBackupInterval = 24 * 60 * 60 * 1000; // 24 horas
  }

  // Crear backup completo de todos los datos
  async createFullBackup(jobService, workerService) {
    try {
      const timestamp = new Date().toISOString();
      const backup = {
        version: this.version,
        timestamp,
        metadata: {
          appName: 'Work Tracker Pro',
          exportedBy: 'System',
          totalJobs: jobService.getAllJobs().length,
          totalWorkers: workerService.getAllWorkers().length,
          userAgent: navigator.userAgent
        },
        data: {
          jobs: jobService.getAllJobs(),
          workers: workerService.getAllWorkers(),
          settings: this.getAppSettings()
        }
      };

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Error al crear el backup: ' + error.message);
    }
  }

  // Exportar backup como archivo JSON
  async exportBackup(jobService, workerService, options = {}) {
    const config = {
      includeImages: true,
      filename: null,
      ...options
    };

    try {
      const backup = await this.createFullBackup(jobService, workerService);

      // Si no incluir imágenes, removerlas para reducir tamaño
      if (!config.includeImages) {
        backup.data.jobs.forEach(job => {
          if (job.images) job.images = [];
        });
        backup.data.workers.forEach(worker => {
          if (worker.profileImage) worker.profileImage = null;
        });
      }

      const filename = config.filename ||
        `work-tracker-backup-${formatDate(new Date()).replace(/[:/]/g, '-')}.json`;

      downloadJSON(backup, filename);

      showNotification('Backup exportado exitosamente', 'success');
      return backup;
    } catch (error) {
      console.error('Error exporting backup:', error);
      showNotification('Error al exportar backup: ' + error.message, 'danger');
      throw error;
    }
  }

  // Validar estructura de backup
  validateBackup(backupData) {
    const errors = [];

    // Validar estructura básica
    if (!backupData || typeof backupData !== 'object') {
      errors.push('El archivo no contiene datos válidos');
      return { isValid: false, errors };
    }

    // Validar versión
    if (!backupData.version) {
      errors.push('Versión de backup no especificada');
    }

    // Validar timestamp
    if (!backupData.timestamp || isNaN(new Date(backupData.timestamp).getTime())) {
      errors.push('Timestamp de backup inválido');
    }

    // Validar datos
    if (!backupData.data) {
      errors.push('No se encontraron datos en el backup');
      return { isValid: false, errors };
    }

    // Validar trabajos
    if (!Array.isArray(backupData.data.jobs)) {
      errors.push('Datos de trabajos inválidos');
    } else {
      backupData.data.jobs.forEach((job, index) => {
        if (!job.id || !job.title || !job.description) {
          errors.push(`Trabajo ${index + 1} tiene datos faltantes`);
        }
      });
    }

    // Validar trabajadores
    if (!Array.isArray(backupData.data.workers)) {
      errors.push('Datos de trabajadores inválidos');
    } else {
      backupData.data.workers.forEach((worker, index) => {
        if (!worker.id || !worker.name) {
          errors.push(`Trabajador ${index + 1} tiene datos faltantes`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.getCompatibilityWarnings(backupData)
    };
  }

  // Obtener advertencias de compatibilidad
  getCompatibilityWarnings(backupData) {
    const warnings = [];

    if (backupData.version !== this.version) {
      warnings.push(`Versión de backup (${backupData.version}) diferente a la actual (${this.version})`);
    }

    // Verificar si hay campos nuevos que no existían en versiones anteriores
    const currentFields = new Set(['id', 'title', 'description', 'date', 'status', 'workerIds', 'images', 'createdAt', 'updatedAt']);

    if (backupData.data.jobs.length > 0) {
      const jobFields = new Set(Object.keys(backupData.data.jobs[0]));
      const missingFields = [...currentFields].filter(field => !jobFields.has(field));
      if (missingFields.length > 0) {
        warnings.push(`Algunos trabajos pueden estar incompletos (campos faltantes: ${missingFields.join(', ')})`);
      }
    }

    return warnings;
  }

  // Restaurar desde backup
  async restoreFromBackup(backupData, jobService, workerService, options = {}) {
    const config = {
      clearExisting: false,
      mergeStrategy: 'skip', // 'skip', 'overwrite', 'merge'
      ...options
    };

    try {
      // Validar backup
      const validation = this.validateBackup(backupData);
      if (!validation.isValid) {
        throw new Error('Backup inválido: ' + validation.errors.join(', '));
      }

      // Mostrar advertencias si las hay
      if (validation.warnings.length > 0) {
        console.warn('Advertencias de compatibilidad:', validation.warnings);
        showNotification(`Advertencias: ${validation.warnings.join(', ')}`, 'warning');
      }

      // Crear backup de seguridad antes de restaurar
      const currentBackup = await this.createFullBackup(jobService, workerService);
      this.saveAutoBackup(currentBackup, 'before-restore');

      let restoredJobs = 0;
      let restoredWorkers = 0;
      let skippedJobs = 0;
      let skippedWorkers = 0;

      // Limpiar datos existentes si se solicita
      if (config.clearExisting) {
        // Implementar limpieza si es necesario
        console.log('Clearing existing data...');
      }

      // Restaurar trabajadores primero (los trabajos pueden referenciarlos)
      if (backupData.data.workers) {
        for (const worker of backupData.data.workers) {
          try {
            const existingWorker = workerService.getWorkerById(worker.id);

            if (existingWorker && config.mergeStrategy === 'skip') {
              skippedWorkers++;
              continue;
            }

            if (existingWorker && config.mergeStrategy === 'overwrite') {
              await workerService.updateWorker(worker);
            } else {
              await workerService.addWorker(worker);
            }

            restoredWorkers++;
          } catch (error) {
            console.error('Error restoring worker:', worker.id, error);
            skippedWorkers++;
          }
        }
      }

      // Restaurar trabajos
      if (backupData.data.jobs) {
        for (const job of backupData.data.jobs) {
          try {
            const existingJob = jobService.getJobById(job.id);

            if (existingJob && config.mergeStrategy === 'skip') {
              skippedJobs++;
              continue;
            }

            if (existingJob && config.mergeStrategy === 'overwrite') {
              await jobService.updateJob(job);
            } else {
              await jobService.addJob(job);
            }

            restoredJobs++;
          } catch (error) {
            console.error('Error restoring job:', job.id, error);
            skippedJobs++;
          }
        }
      }

      // Restaurar configuraciones si existen
      if (backupData.data.settings) {
        this.restoreAppSettings(backupData.data.settings);
      }

      const summary = {
        restoredJobs,
        restoredWorkers,
        skippedJobs,
        skippedWorkers,
        totalJobs: backupData.data.jobs?.length || 0,
        totalWorkers: backupData.data.workers?.length || 0
      };

      showNotification(
        `Restauración completada: ${restoredJobs} trabajos y ${restoredWorkers} trabajadores restaurados`,
        'success'
      );

      return summary;
    } catch (error) {
      console.error('Error during restore:', error);
      showNotification('Error durante la restauración: ' + error.message, 'danger');
      throw error;
    }
  }

  // Importar desde archivo
  async importFromFile(file, jobService, workerService, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          const result = await this.restoreFromBackup(backupData, jobService, workerService, options);
          resolve(result);
        } catch (error) {
          reject(new Error('Error al leer el archivo: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsText(file);
    });
  }

  // Sistema de backup automático
  saveAutoBackup(backupData, type = 'auto') {
    try {
      const backupEntry = {
        id: Date.now().toString(),
        type,
        timestamp: new Date().toISOString(),
        size: JSON.stringify(backupData).length,
        metadata: backupData.metadata
      };

      // Guardar el backup
      localStorage.setItem(`${this.autoBackupKey}_${backupEntry.id}`, JSON.stringify(backupData));

      // Actualizar historial
      const history = this.getBackupHistory();
      history.unshift(backupEntry);

      // Mantener solo los últimos N backups
      const toKeep = history.slice(0, this.maxAutoBackups);
      const toDelete = history.slice(this.maxAutoBackups);

      // Eliminar backups antiguos
      toDelete.forEach(backup => {
        localStorage.removeItem(`${this.autoBackupKey}_${backup.id}`);
      });

      // Guardar historial actualizado
      localStorage.setItem(this.backupHistoryKey, JSON.stringify(toKeep));

      console.log(`Auto backup saved: ${backupEntry.id}`);
      return backupEntry.id;
    } catch (error) {
      console.error('Error saving auto backup:', error);
      return null;
    }
  }

  // Obtener historial de backups
  getBackupHistory() {
    try {
      const history = localStorage.getItem(this.backupHistoryKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading backup history:', error);
      return [];
    }
  }

  // Restaurar desde backup automático
  async restoreAutoBackup(backupId, jobService, workerService) {
    try {
      const backupData = localStorage.getItem(`${this.autoBackupKey}_${backupId}`);
      if (!backupData) {
        throw new Error('Backup no encontrado');
      }

      const parsedBackup = JSON.parse(backupData);
      return await this.restoreFromBackup(parsedBackup, jobService, workerService);
    } catch (error) {
      console.error('Error restoring auto backup:', error);
      throw error;
    }
  }

  // Eliminar backup automático
  deleteAutoBackup(backupId) {
    try {
      localStorage.removeItem(`${this.autoBackupKey}_${backupId}`);

      const history = this.getBackupHistory();
      const updatedHistory = history.filter(backup => backup.id !== backupId);
      localStorage.setItem(this.backupHistoryKey, JSON.stringify(updatedHistory));

      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  // Configurar backup automático periódico
  setupAutoBackup(jobService, workerService) {
    const lastBackup = this.getLastAutoBackupTime();
    const timeSinceLastBackup = Date.now() - lastBackup;

    if (timeSinceLastBackup >= this.autoBackupInterval) {
      this.createAutoBackup(jobService, workerService);
    }

    // Programar próximo backup automático
    setInterval(() => {
      this.createAutoBackup(jobService, workerService);
    }, this.autoBackupInterval);
  }

  async createAutoBackup(jobService, workerService) {
    try {
      const backup = await this.createFullBackup(jobService, workerService);
      this.saveAutoBackup(backup, 'auto');
      console.log('Auto backup created successfully');
    } catch (error) {
      console.error('Error creating auto backup:', error);
    }
  }

  getLastAutoBackupTime() {
    const history = this.getBackupHistory();
    const autoBackups = history.filter(backup => backup.type === 'auto');

    if (autoBackups.length === 0) {
      return 0;
    }

    return new Date(autoBackups[0].timestamp).getTime();
  }

  // Gestión de configuraciones de la app
  getAppSettings() {
    try {
      return {
        language: localStorage.getItem('app_language') || 'es',
        theme: localStorage.getItem('app_theme') || 'light',
        notifications: localStorage.getItem('app_notifications') !== 'false',
        autoBackup: localStorage.getItem('app_auto_backup') !== 'false'
      };
    } catch (error) {
      return {};
    }
  }

  restoreAppSettings(settings) {
    try {
      if (settings.language) {
        localStorage.setItem('app_language', settings.language);
      }
      if (settings.theme) {
        localStorage.setItem('app_theme', settings.theme);
      }
      if (typeof settings.notifications === 'boolean') {
        localStorage.setItem('app_notifications', settings.notifications.toString());
      }
      if (typeof settings.autoBackup === 'boolean') {
        localStorage.setItem('app_auto_backup', settings.autoBackup.toString());
      }
    } catch (error) {
      console.error('Error restoring settings:', error);
    }
  }

  // Obtener estadísticas de backup
  getBackupStats() {
    const history = this.getBackupHistory();
    const totalBackups = history.length;
    const autoBackups = history.filter(b => b.type === 'auto').length;
    const manualBackups = history.filter(b => b.type === 'manual').length;
    const totalSize = history.reduce((sum, backup) => sum + (backup.size || 0), 0);

    return {
      totalBackups,
      autoBackups,
      manualBackups,
      totalSize,
      lastBackup: history[0]?.timestamp || null,
      oldestBackup: history[history.length - 1]?.timestamp || null
    };
  }
}

// Instancia singleton
export const backupManager = new BackupManager();