// Lógica para el reconocimiento de voz
// Referencia API Web Speech: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
import { showNotification } from "./utils/notifications.js";
import { sanitizeText, debounce } from "./utils/helpers.js";

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

// Configuración del reconocimiento de voz
const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();
recognition.lang = "es-ES";
recognition.continuous = false;
recognition.interimResults = false;

let currentInput = null;
let isListening = false;

// Función para inicializar el reconocimiento de voz
export function initVoiceRecognition(inputElement) {
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

  currentInput = inputElement;
  const button = inputElement.parentElement?.querySelector(".btn-voice");

  try {
    // Configurar eventos del reconocimiento
    recognition.onstart = () => {
      console.log("Reconocimiento de voz iniciado");
      isListening = true;

      // Actualizar UI
      if (button) {
        button.classList.add("listening");
        const icon = button.querySelector(".fa-microphone");
        if (icon) icon.style.color = "red";
      }
      currentInput.classList.add("listening");

      // Mostrar notificación
      showNotification("Escuchando... Habla ahora", "info");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Texto reconocido:", transcript);

      // Procesar comandos especiales primero
      if (!processSpecialCommands(transcript, currentInput)) {
        const formattedText = formatText(transcript, currentInput.type);

        // Si es un textarea, insertar en la posición del cursor
        if (currentInput.tagName.toLowerCase() === "textarea") {
          const start = currentInput.selectionStart;
          const end = currentInput.selectionEnd;
          const text = currentInput.value;
          const before = text.substring(0, start);
          const after = text.substring(end);
          currentInput.value = before + formattedText + after;
          currentInput.selectionStart = currentInput.selectionEnd =
            start + formattedText.length;
        } else {
          // Para inputs normales
          currentInput.value = formattedText;
        }

        // Mostrar notificación de éxito
        showNotification(`Texto reconocido: "${formattedText}"`, "success");
      }

      // Disparar evento de input para activar validaciones
      currentInput.dispatchEvent(new Event("input", { bubbles: true }));
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento de voz:", event.error);
      showNotification(
        `Error en reconocimiento de voz: ${event.error}`,
        "danger"
      );
      stopListening();
    };

    recognition.onend = () => {
      console.log("Reconocimiento de voz finalizado");
      stopListening();
    };

    // Iniciar reconocimiento
    recognition.start();
  } catch (error) {
    console.error("Error al iniciar reconocimiento de voz:", error);
    showNotification(
      "El reconocimiento de voz no está disponible en este navegador",
      "danger"
    );
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

  try {
    recognition.stop();
  } catch (error) {
    console.error("Error al detener reconocimiento:", error);
  }

  currentInput = null;
}

// Exponer la función globalmente para que sea accesible desde el HTML
window.initVoiceRecognition = initVoiceRecognition;
