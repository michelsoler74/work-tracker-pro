// Lógica para el reconocimiento de voz
// Referencia API Web Speech: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
import { showNotification } from "./utils/notifications.js";
import { sanitizeText, debounce } from "./utils/helpers.js";

// Detectar si es un dispositivo móvil y el navegador
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
const isChrome = /Chrome/i.test(navigator.userAgent);
const isSafari =
  /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);

// Función para formatear el texto según el tipo de campo
function formatText(text, inputType) {
  text = sanitizeText(text);
  switch (inputType) {
    case "tel":
      // Eliminar todo excepto números y espacios
      return text.replace(/[^\d\s]/g, "").trim();
    case "email":
      // Eliminar espacios y convertir a minúsculas
      return text.toLowerCase().replace(/\s/g, "");
    default:
      return text.trim();
  }
}

// Función para procesar comandos especiales
function processSpecialCommands(text, inputElement) {
  const commands = {
    borrar: () => {
      inputElement.value = "";
      showNotification("Campo borrado", "info");
      return true;
    },
    limpiar: () => {
      inputElement.value = "";
      showNotification("Campo limpiado", "info");
      return true;
    },
    espacio: () => {
      inputElement.value += " ";
      return true;
    },
    arroba: () => {
      if (inputElement.type === "email") {
        inputElement.value += "@";
        return true;
      }
      return false;
    },
    punto: () => (inputElement.value += "."),
    "punto com": () => {
      if (inputElement.type === "email") {
        inputElement.value += ".com";
        return true;
      }
      return false;
    },
    "punto es": () => {
      if (inputElement.type === "email") {
        inputElement.value += ".es";
        return true;
      }
      return false;
    },
    guion: () => (inputElement.value += "-"),
    "guion bajo": () => (inputElement.value += "_"),
  };

  const command = text.toLowerCase().trim();
  return commands[command] ? commands[command]() : false;
}

let recognition = null;
let currentInput = null;
let isListening = false;

// Función para inicializar el reconocimiento de voz
export async function initVoiceRecognition(inputElement) {
  if (!inputElement) {
    showNotification(
      "Error: No se proporcionó un elemento de entrada",
      "danger"
    );
    return;
  }

  // Si ya está escuchando, detener
  if (isListening) {
    stopListening();
    return;
  }

  try {
    // Inicializar el reconocimiento de voz si aún no existe
    if (!recognition) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error(
          "El reconocimiento de voz no está soportado en este navegador"
        );
      }
      recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.continuous = true;
      recognition.interimResults = true;

      // Ajustes específicos para móviles
      if (isMobile) {
        recognition.continuous = false;
      }
    }

    currentInput = inputElement;
    const button = inputElement.parentElement?.querySelector(".btn-voice");

    // Configurar eventos del reconocimiento
    recognition.onstart = () => {
      console.log("Reconocimiento de voz iniciado");
      isListening = true;

      if (button) {
        button.classList.add("listening");
        const icon = button.querySelector(".fa-microphone");
        if (icon) icon.style.color = "red";
      }
      currentInput.classList.add("listening");

      showNotification("Escuchando... Habla ahora", "info");
    };

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      let finalTranscript = "";
      let interimTranscript = "";

      results.forEach((result) => {
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript = transcript;
        }
      });

      // Mostrar resultados intermedios
      if (interimTranscript) {
        currentInput.value = formatText(interimTranscript, currentInput.type);
      }

      // Procesar resultado final
      if (finalTranscript) {
        currentInput.value = formatText(finalTranscript, currentInput.type);
        currentInput.dispatchEvent(new Event("input", { bubbles: true }));

        if (isMobile) {
          stopListening();
          showNotification("Texto reconocido correctamente", "success");
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento de voz:", event.error);
      if (event.error === "not-allowed") {
        showNotification(
          "Por favor, permite el acceso al micrófono para usar el reconocimiento de voz",
          "warning"
        );
      } else if (event.error === "no-speech") {
        showNotification(
          "No se detectó ninguna voz. Por favor, intenta hablar de nuevo",
          "warning"
        );
      } else {
        showNotification(
          "Error en el reconocimiento de voz. Por favor, intenta de nuevo",
          "warning"
        );
      }
      stopListening();
    };

    recognition.onend = () => {
      console.log("Reconocimiento de voz finalizado");
      stopListening();

      // Reiniciar automáticamente en dispositivos móviles si no hay resultado final
      if (isMobile && currentInput && currentInput.value === "") {
        setTimeout(() => {
          recognition.start();
        }, 100);
      }
    };

    // Iniciar reconocimiento
    recognition.start();
  } catch (error) {
    console.error("Error al iniciar reconocimiento de voz:", error);
    if (error.name === "NotAllowedError") {
      showNotification(
        "Por favor, permite el acceso al micrófono para usar el reconocimiento de voz",
        "warning"
      );
    } else {
      showNotification(
        "El reconocimiento de voz no está disponible en este navegador",
        "danger"
      );
    }
    stopListening();
  }
}

// Función para detener el reconocimiento
function stopListening() {
  isListening = false;

  // Restaurar UI
  if (currentInput) {
    const button = currentInput.parentElement?.querySelector(".btn-voice");
    if (button) {
      button.classList.remove("listening");
      const icon = button.querySelector(".fa-microphone");
      if (icon) icon.style.color = "";
    }
    currentInput.classList.remove("listening");
  }

  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      console.error("Error al detener reconocimiento:", error);
    }
  }

  currentInput = null;
}

// Exponer la función globalmente
window.initVoiceRecognition = initVoiceRecognition;
