// Sistema de notificaciones

/**
 * Muestra una notificación en la interfaz
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, info, warning, danger)
 * @param {number} duration - Duración en ms (por defecto 3000)
 */
export function showNotification(message, type = "info", duration = 3000) {
  // Crear contenedor si no existe
  let container = document.getElementById("notifications-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notifications-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(container);
  }

  // Crear notificación
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    margin-bottom: 10px;
    padding: 15px 25px 15px 15px;
    border-radius: 4px;
    color: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 500px;
    animation: slideIn 0.3s ease-out;
  `;

  // Establecer color según tipo
  const colors = {
    success: "#28a745",
    info: "#17a2b8",
    warning: "#ffc107",
    danger: "#dc3545",
  };
  notification.style.backgroundColor = colors[type] || colors.info;

  // Crear contenido
  const content = document.createElement("div");
  content.textContent = message;
  content.style.flex = "1";

  // Crear botón de cerrar
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0 0 0 10px;
    opacity: 0.7;
  `;
  closeButton.addEventListener(
    "mouseover",
    () => (closeButton.style.opacity = "1")
  );
  closeButton.addEventListener(
    "mouseout",
    () => (closeButton.style.opacity = "0.7")
  );

  // Agregar elementos a la notificación
  notification.appendChild(content);
  notification.appendChild(closeButton);

  // Agregar notificación al contenedor
  container.appendChild(notification);

  // Agregar estilos de animación si no existen
  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Función para remover la notificación
  const remove = () => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
      // Remover contenedor si está vacío
      if (container.children.length === 0) {
        container.parentElement.removeChild(container);
      }
    }, 300);
  };

  // Configurar eventos
  closeButton.onclick = remove;
  if (duration > 0) {
    setTimeout(remove, duration);
  }

  // Permitir cerrar al hacer clic
  notification.addEventListener("click", remove);

  return notification;
}
