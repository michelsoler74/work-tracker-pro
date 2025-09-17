// Sistema de loading states y feedback visual

export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.defaultOptions = {
      overlay: true,
      message: 'Cargando...',
      spinner: true,
      backdrop: true,
      timeout: 30000 // 30 segundos timeout por defecto
    };
  }

  // Mostrar loading en un elemento específico
  show(targetElement, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    const elementId = this.getElementId(targetElement);

    // Si ya hay un loading activo, no crear otro
    if (this.loadingStates.has(elementId)) {
      return this.loadingStates.get(elementId);
    }

    const loadingInstance = this.createLoadingElement(targetElement, config);
    this.loadingStates.set(elementId, loadingInstance);

    // Auto-hide después del timeout
    if (config.timeout > 0) {
      setTimeout(() => {
        this.hide(targetElement);
      }, config.timeout);
    }

    return loadingInstance;
  }

  // Ocultar loading de un elemento específico
  hide(targetElement) {
    const elementId = this.getElementId(targetElement);
    const loadingInstance = this.loadingStates.get(elementId);

    if (loadingInstance) {
      this.removeLoadingElement(loadingInstance);
      this.loadingStates.delete(elementId);
    }
  }

  // Verificar si un elemento tiene loading activo
  isLoading(targetElement) {
    const elementId = this.getElementId(targetElement);
    return this.loadingStates.has(elementId);
  }

  // Ocultar todos los loadings
  hideAll() {
    for (const [elementId, loadingInstance] of this.loadingStates) {
      this.removeLoadingElement(loadingInstance);
    }
    this.loadingStates.clear();
  }

  // Obtener ID único para elemento
  getElementId(element) {
    if (typeof element === 'string') {
      return element;
    }

    if (!element.id) {
      element.id = 'loading-target-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    return element.id;
  }

  // Crear elemento de loading
  createLoadingElement(targetElement, options) {
    const target = typeof targetElement === 'string'
      ? document.querySelector(targetElement)
      : targetElement;

    if (!target) {
      console.warn('Target element not found for loading');
      return null;
    }

    // Crear contenedor de loading
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.style.cssText = this.getLoadingStyles(options);

    // Crear contenido de loading
    const loadingContent = document.createElement('div');
    loadingContent.className = 'loading-content';
    loadingContent.innerHTML = this.getLoadingHTML(options);

    loadingContainer.appendChild(loadingContent);

    // Posicionar según el tipo de elemento
    const targetPosition = window.getComputedStyle(target).position;
    if (targetPosition === 'static') {
      target.style.position = 'relative';
    }

    target.appendChild(loadingContainer);

    // Desactivar interacciones en el elemento target
    target.style.pointerEvents = 'none';
    target.setAttribute('aria-busy', 'true');

    return {
      container: loadingContainer,
      target: target,
      originalPointerEvents: target.style.pointerEvents,
      originalPosition: targetPosition
    };
  }

  // Remover elemento de loading
  removeLoadingElement(loadingInstance) {
    if (!loadingInstance) return;

    const { container, target, originalPointerEvents, originalPosition } = loadingInstance;

    // Restaurar estilos originales
    target.style.pointerEvents = originalPointerEvents;
    target.removeAttribute('aria-busy');

    if (originalPosition === 'static') {
      target.style.position = '';
    }

    // Remover container con animación
    if (container && container.parentElement) {
      container.style.opacity = '0';
      setTimeout(() => {
        if (container.parentElement) {
          container.parentElement.removeChild(container);
        }
      }, 200);
    }
  }

  // Obtener estilos CSS para loading
  getLoadingStyles(options) {
    const baseStyles = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      transition: opacity 0.2s ease-in-out;
    `;

    const backdropStyles = options.backdrop
      ? 'background-color: rgba(255, 255, 255, 0.8); backdrop-filter: blur(2px);'
      : '';

    return baseStyles + backdropStyles;
  }

  // Obtener HTML para loading
  getLoadingHTML(options) {
    const spinner = options.spinner ? this.getSpinnerHTML() : '';
    const message = options.message ? `<div class="loading-message">${options.message}</div>` : '';

    return `
      <div class="loading-inner">
        ${spinner}
        ${message}
      </div>
    `;
  }

  // Obtener HTML del spinner
  getSpinnerHTML() {
    return `
      <div class="loading-spinner">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    `;
  }
}

// Clase para skeleton loaders
export class SkeletonLoader {
  static create(type = 'text', options = {}) {
    const defaults = {
      width: '100%',
      height: '1rem',
      borderRadius: '0.25rem',
      animation: true,
      count: 1,
      className: ''
    };

    const config = { ...defaults, ...options };

    const skeletons = [];
    for (let i = 0; i < config.count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type} ${config.className}`;
      skeleton.style.cssText = `
        width: ${config.width};
        height: ${config.height};
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        border-radius: ${config.borderRadius};
        margin-bottom: 0.5rem;
        ${config.animation ? 'animation: skeleton-loading 1.5s infinite;' : ''}
      `;
      skeletons.push(skeleton);
    }

    return skeletons.length === 1 ? skeletons[0] : skeletons;
  }

  static createJobCard() {
    const container = document.createElement('div');
    container.className = 'skeleton-job-card list-group-item';

    container.innerHTML = `
      <div class="d-flex w-100 justify-content-between mb-2">
        ${this.create('text', { width: '60%', height: '1.25rem' }).outerHTML}
        ${this.create('text', { width: '80px', height: '1.5rem', borderRadius: '1rem' }).outerHTML}
      </div>
      ${this.create('text', { width: '100%', height: '1rem' }).outerHTML}
      ${this.create('text', { width: '80%', height: '1rem' }).outerHTML}
      <div class="d-flex justify-content-between align-items-center mt-2">
        ${this.create('text', { width: '100px', height: '0.875rem' }).outerHTML}
        <div class="d-flex gap-1">
          ${this.create('text', { width: '32px', height: '32px', borderRadius: '0.25rem' }).outerHTML}
          ${this.create('text', { width: '32px', height: '32px', borderRadius: '0.25rem' }).outerHTML}
          ${this.create('text', { width: '32px', height: '32px', borderRadius: '0.25rem' }).outerHTML}
        </div>
      </div>
    `;

    return container;
  }

  static createWorkerCard() {
    const container = document.createElement('div');
    container.className = 'skeleton-worker-card list-group-item';

    container.innerHTML = `
      <div class="d-flex w-100 justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          ${this.create('text', { width: '50px', height: '50px', borderRadius: '50%' }).outerHTML}
          <div class="ms-3">
            ${this.create('text', { width: '120px', height: '1.25rem' }).outerHTML}
            ${this.create('text', { width: '100px', height: '1rem' }).outerHTML}
            ${this.create('text', { width: '150px', height: '0.875rem' }).outerHTML}
          </div>
        </div>
        <div class="d-flex gap-1">
          ${this.create('text', { width: '32px', height: '32px', borderRadius: '0.25rem' }).outerHTML}
          ${this.create('text', { width: '32px', height: '32px', borderRadius: '0.25rem' }).outerHTML}
        </div>
      </div>
    `;

    return container;
  }
}

// Sistema de confirmación para acciones críticas
export class ConfirmationModal {
  static show(options = {}) {
    const defaults = {
      title: 'Confirmar acción',
      message: '¿Estás seguro de que quieres continuar?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      type: 'warning' // success, info, warning, danger
    };

    const config = { ...defaults, ...options };

    return new Promise((resolve) => {
      // Crear modal
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.tabIndex = -1;
      modal.setAttribute('aria-hidden', 'true');

      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-${this.getIcon(config.type)} text-${config.type} me-2"></i>
                ${config.title}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">${config.message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                ${config.cancelText}
              </button>
              <button type="button" class="btn btn-${config.type}" id="confirmAction">
                ${config.confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Configurar eventos
      const confirmBtn = modal.querySelector('#confirmAction');
      const bootstrapModal = new bootstrap.Modal(modal);

      confirmBtn.addEventListener('click', () => {
        bootstrapModal.hide();
        resolve(true);
      });

      modal.addEventListener('hidden.bs.modal', () => {
        if (modal.parentElement) {
          modal.parentElement.removeChild(modal);
        }
        resolve(false);
      });

      bootstrapModal.show();
    });
  }

  static getIcon(type) {
    const icons = {
      success: 'check-circle',
      info: 'info-circle',
      warning: 'exclamation-triangle',
      danger: 'exclamation-circle'
    };
    return icons[type] || icons.warning;
  }
}

// Instancia singleton
export const loadingManager = new LoadingManager();

// Utilidades de feedback visual
export const FeedbackUtils = {
  // Parpadeo sutil para llamar la atención
  pulse(element, options = {}) {
    const config = {
      duration: 600,
      color: '#0d6efd',
      intensity: 0.3,
      ...options
    };

    const originalBoxShadow = element.style.boxShadow;

    element.style.transition = `box-shadow ${config.duration}ms ease-in-out`;
    element.style.boxShadow = `0 0 0 3px rgba(13, 110, 253, ${config.intensity})`;

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
      setTimeout(() => {
        element.style.transition = '';
      }, config.duration);
    }, config.duration);
  },

  // Destacar elemento temporalmente
  highlight(element, options = {}) {
    const config = {
      duration: 2000,
      backgroundColor: '#fff3cd',
      ...options
    };

    const originalBackground = element.style.backgroundColor;

    element.style.transition = `background-color 200ms ease-in-out`;
    element.style.backgroundColor = config.backgroundColor;

    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
      setTimeout(() => {
        element.style.transition = '';
      }, 200);
    }, config.duration);
  },

  // Shake animation para errores
  shake(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      element.style.animation = '';
    }, 500);
  }
};