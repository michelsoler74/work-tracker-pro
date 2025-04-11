// Utilidades y funciones helper
import { config } from "../config/config.js";

// Validación de imágenes
export const validateImage = (file) => {
  if (!file)
    return { valid: false, error: "No se ha seleccionado ningún archivo" };

  if (!config.app.allowedImageTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        "Tipo de archivo no permitido. Use: " +
        config.app.allowedImageTypes.join(", "),
    };
  }

  if (file.size > config.app.maxImageSize) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo: ${
        config.app.maxImageSize / 1024 / 1024
      }MB`,
    };
  }

  return { valid: true };
};

// Formateo de fechas
export const formatDate = (date) => {
  if (!date) return "";
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("es-ES", options);
};

// Validación de formularios
export function validateForm(data) {
  const errors = {};

  // Validación de trabajo
  if (data.hasOwnProperty("descripcion")) {
    if (
      data.descripcion.length < config.validation.trabajo.minDescriptionLength
    ) {
      errors.descripcion = `La descripción debe tener al menos ${config.validation.trabajo.minDescriptionLength} caracteres`;
    }
    if (
      data.descripcion.length > config.validation.trabajo.maxDescriptionLength
    ) {
      errors.descripcion = `La descripción no puede exceder ${config.validation.trabajo.maxDescriptionLength} caracteres`;
    }
  }

  // Validación de trabajador
  if (data.hasOwnProperty("edad")) {
    if (data.edad < config.validation.trabajador.minAge) {
      errors.edad = `La edad mínima es ${config.validation.trabajador.minAge} años`;
    }
    if (data.edad > config.validation.trabajador.maxAge) {
      errors.edad = `La edad máxima es ${config.validation.trabajador.maxAge} años`;
    }
  }

  if (data.hasOwnProperty("experiencia")) {
    if (data.experiencia < config.validation.trabajador.minExperience) {
      errors.experiencia = `La experiencia mínima es ${config.validation.trabajador.minExperience} años`;
    }
    if (data.experiencia > config.validation.trabajador.maxExperience) {
      errors.experiencia = `La experiencia máxima es ${config.validation.trabajador.maxExperience} años`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Manejo de errores
export function handleError(error) {
  console.error("Error:", error);

  let message = "Ha ocurrido un error inesperado";
  let code = "UNKNOWN_ERROR";

  if (error instanceof Error) {
    message = error.message;
    code = error.code || code;
  }

  return {
    message,
    code,
  };
}

// Generador de IDs únicos
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
