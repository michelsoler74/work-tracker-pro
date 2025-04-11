// Configuración general de la aplicación
export const config = {
  // Configuración de la aplicación
  app: {
    name: "WorkTracker Pro",
    version: "2.0.0",
    defaultLanguage: "es-ES",
    supportedLanguages: ["es", "en"],
    itemsPerPage: 10,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ["image/jpeg", "image/png", "image/gif"],
    voiceRecognitionTimeout: 10000, // 10 segundos
  },

  // Configuración de validaciones
  validation: {
    trabajo: {
      minDescriptionLength: 10,
      maxDescriptionLength: 500,
      maxPhotos: 10,
    },
    trabajador: {
      minAge: 18,
      maxAge: 80,
      minExperience: 0,
      maxExperience: 60,
    },
  },

  // Configuración de notificaciones
  notifications: {
    duration: 5000, // duración en milisegundos
    position: "top-right",
  },

  // Configuración de reconocimiento de voz
  voiceRecognition: {
    language: "es-ES",
    maxAlternatives: 1,
    continuous: false,
  },
};
