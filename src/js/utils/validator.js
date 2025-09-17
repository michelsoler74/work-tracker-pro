// Sistema de validación robusto
import { isValidEmail, isValidPhone } from './helpers.js';

export class Validator {
  constructor() {
    this.rules = new Map();
    this.errors = new Map();
  }

  // Definir reglas de validación
  addRule(field, rule) {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field).push(rule);
    return this;
  }

  // Validar un campo específico
  validateField(field, value) {
    const fieldRules = this.rules.get(field) || [];
    const fieldErrors = [];

    for (const rule of fieldRules) {
      const result = rule.validate(value);
      if (!result.isValid) {
        fieldErrors.push(result.message);
      }
    }

    if (fieldErrors.length > 0) {
      this.errors.set(field, fieldErrors);
    } else {
      this.errors.delete(field);
    }

    return fieldErrors.length === 0;
  }

  // Validar todos los campos
  validate(data) {
    this.errors.clear();
    let isValid = true;

    for (const [field] of this.rules) {
      const value = this.getNestedValue(data, field);
      if (!this.validateField(field, value)) {
        isValid = false;
      }
    }

    return {
      isValid,
      errors: Object.fromEntries(this.errors),
      errorMessages: this.getErrorMessages()
    };
  }

  // Obtener mensajes de error
  getErrorMessages() {
    const messages = [];
    for (const [field, fieldErrors] of this.errors) {
      fieldErrors.forEach(error => {
        messages.push(`${field}: ${error}`);
      });
    }
    return messages;
  }

  // Obtener errores de un campo específico
  getFieldErrors(field) {
    return this.errors.get(field) || [];
  }

  // Limpiar errores
  clearErrors(field = null) {
    if (field) {
      this.errors.delete(field);
    } else {
      this.errors.clear();
    }
  }

  // Verificar si hay errores
  hasErrors(field = null) {
    if (field) {
      return this.errors.has(field);
    }
    return this.errors.size > 0;
  }

  // Obtener valor anidado
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Reglas de validación predefinidas
export const ValidationRules = {
  required: (message = 'Este campo es requerido') => ({
    validate: (value) => ({
      isValid: value !== null && value !== undefined && String(value).trim() !== '',
      message
    })
  }),

  minLength: (min, message = `Debe tener al menos ${min} caracteres`) => ({
    validate: (value) => ({
      isValid: !value || String(value).length >= min,
      message
    })
  }),

  maxLength: (max, message = `No puede exceder ${max} caracteres`) => ({
    validate: (value) => ({
      isValid: !value || String(value).length <= max,
      message
    })
  }),

  email: (message = 'Debe ser un email válido') => ({
    validate: (value) => ({
      isValid: !value || isValidEmail(value),
      message
    })
  }),

  phone: (message = 'Debe ser un teléfono válido') => ({
    validate: (value) => ({
      isValid: !value || isValidPhone(value),
      message
    })
  }),

  pattern: (regex, message = 'Formato inválido') => ({
    validate: (value) => ({
      isValid: !value || regex.test(value),
      message
    })
  }),

  custom: (validatorFn, message = 'Valor inválido') => ({
    validate: (value) => {
      try {
        const result = validatorFn(value);
        return {
          isValid: result === true,
          message: typeof result === 'string' ? result : message
        };
      } catch (error) {
        return {
          isValid: false,
          message: error.message || message
        };
      }
    }
  }),

  date: (message = 'Debe ser una fecha válida') => ({
    validate: (value) => {
      if (!value) return { isValid: true, message };
      const date = new Date(value);
      return {
        isValid: !isNaN(date.getTime()),
        message
      };
    }
  }),

  futureDate: (message = 'La fecha debe ser futura') => ({
    validate: (value) => {
      if (!value) return { isValid: true, message };
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        isValid: date >= today,
        message
      };
    }
  }),

  pastDate: (message = 'La fecha debe ser pasada') => ({
    validate: (value) => {
      if (!value) return { isValid: true, message };
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return {
        isValid: date <= today,
        message
      };
    }
  })
};

// Validadores específicos para la aplicación
export class JobValidator extends Validator {
  constructor() {
    super();
    this.setupJobRules();
  }

  setupJobRules() {
    this.addRule('title', ValidationRules.required('El título es requerido'))
        .addRule('title', ValidationRules.minLength(3, 'El título debe tener al menos 3 caracteres'))
        .addRule('title', ValidationRules.maxLength(100, 'El título no puede exceder 100 caracteres'))
        .addRule('description', ValidationRules.required('La descripción es requerida'))
        .addRule('description', ValidationRules.minLength(10, 'La descripción debe tener al menos 10 caracteres'))
        .addRule('description', ValidationRules.maxLength(500, 'La descripción no puede exceder 500 caracteres'))
        .addRule('date', ValidationRules.required('La fecha es requerida'))
        .addRule('date', ValidationRules.date())
        .addRule('status', ValidationRules.required('El estado es requerido'))
        .addRule('status', ValidationRules.custom(
          (value) => ['Pendiente', 'En Progreso', 'Completado'].includes(value),
          'Estado inválido'
        ));
  }
}

export class WorkerValidator extends Validator {
  constructor() {
    super();
    this.setupWorkerRules();
  }

  setupWorkerRules() {
    this.addRule('name', ValidationRules.required('El nombre es requerido'))
        .addRule('name', ValidationRules.minLength(2, 'El nombre debe tener al menos 2 caracteres'))
        .addRule('name', ValidationRules.maxLength(50, 'El nombre no puede exceder 50 caracteres'))
        .addRule('name', ValidationRules.pattern(
          /^[a-zA-ZÀ-ÿ\s]+$/,
          'El nombre solo puede contener letras y espacios'
        ))
        .addRule('specialty', ValidationRules.required('La especialidad es requerida'))
        .addRule('specialty', ValidationRules.minLength(3, 'La especialidad debe tener al menos 3 caracteres'))
        .addRule('specialty', ValidationRules.maxLength(50, 'La especialidad no puede exceder 50 caracteres'))
        .addRule('email', ValidationRules.email())
        .addRule('phone', ValidationRules.phone());
  }
}

// Sistema de validación en tiempo real para formularios
export class FormValidator {
  constructor(formElement, validator) {
    this.form = formElement;
    this.validator = validator;
    this.realTimeValidation = true;
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.form) return;

    // Validación en tiempo real
    this.form.addEventListener('input', (e) => {
      if (this.realTimeValidation) {
        this.validateField(e.target);
      }
    });

    // Validación al perder foco
    this.form.addEventListener('blur', (e) => {
      this.validateField(e.target);
    }, true);

    // Validación al enviar
    this.form.addEventListener('submit', (e) => {
      if (!this.validateForm()) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  validateField(field) {
    if (!field.name) return;

    const value = field.value;
    const isValid = this.validator.validateField(field.name, value);

    this.updateFieldUI(field, isValid);
    return isValid;
  }

  validateForm() {
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());
    const result = this.validator.validate(data);

    // Actualizar UI de todos los campos
    for (const field of this.form.elements) {
      if (field.name) {
        const hasErrors = this.validator.hasErrors(field.name);
        this.updateFieldUI(field, !hasErrors);
      }
    }

    // Mostrar resumen de errores si hay
    if (!result.isValid) {
      this.showValidationSummary(result.errorMessages);
    } else {
      this.hideValidationSummary();
    }

    return result.isValid;
  }

  updateFieldUI(field, isValid) {
    // Remover clases previas
    field.classList.remove('is-valid', 'is-invalid');

    // Remover mensajes de error previos
    const existingError = field.parentElement.querySelector('.invalid-feedback');
    if (existingError) {
      existingError.remove();
    }

    if (isValid) {
      field.classList.add('is-valid');
    } else {
      field.classList.add('is-invalid');

      // Mostrar mensaje de error
      const errors = this.validator.getFieldErrors(field.name);
      if (errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = errors[0]; // Mostrar solo el primer error
        field.parentElement.appendChild(errorDiv);
      }
    }
  }

  showValidationSummary(messages) {
    this.hideValidationSummary();

    const summary = document.createElement('div');
    summary.className = 'alert alert-danger validation-summary';
    summary.innerHTML = `
      <h6><i class="fas fa-exclamation-triangle"></i> Errores de validación:</h6>
      <ul class="mb-0">
        ${messages.map(msg => `<li>${msg}</li>`).join('')}
      </ul>
    `;

    this.form.insertBefore(summary, this.form.firstChild);
  }

  hideValidationSummary() {
    const existing = this.form.querySelector('.validation-summary');
    if (existing) {
      existing.remove();
    }
  }

  toggleRealTimeValidation(enabled) {
    this.realTimeValidation = enabled;
  }

  clearValidation() {
    this.validator.clearErrors();

    // Limpiar UI
    for (const field of this.form.elements) {
      field.classList.remove('is-valid', 'is-invalid');
      const errorMsg = field.parentElement.querySelector('.invalid-feedback');
      if (errorMsg) {
        errorMsg.remove();
      }
    }

    this.hideValidationSummary();
  }
}

// Instancias singleton para uso global
export const jobValidator = new JobValidator();
export const workerValidator = new WorkerValidator();