// Importa las funciones de firebase.js
import { cargarTrabajosRegistrados, registrarTrabajador } from "./firebase.js";

// Ejecutar la función para cargar trabajos al inicio de la página
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("Cargando trabajos registrados...");
    cargarTrabajosRegistrados();
  } catch (error) {
    console.error("Error al cargar los trabajos registrados: ", error);
  }
});

// Function to add a worker and hours to the list
function agregarTrabajadorHoras() {
  const nombreTrabajador = document
    .getElementById("nombreTrabajador")
    .value.trim();
  const horasTrabajadas = document
    .getElementById("horasTrabajadas")
    .value.trim();

  if (!nombreTrabajador || !horasTrabajadas) {
    alert(
      "Por favor, introduce tanto el nombre del trabajador como las horas trabajadas."
    );
    return;
  }

  const listaTrabajadoresHoras = document.getElementById(
    "listaTrabajadoresHoras"
  );
  const nuevoElemento = document.createElement("li");
  nuevoElemento.textContent = `${nombreTrabajador}: ${horasTrabajadas} horas`;
  listaTrabajadoresHoras.appendChild(nuevoElemento);

  // Clear the fields after adding
  document.getElementById("nombreTrabajador").value = "";
  document.getElementById("horasTrabajadas").value = "";
}

// Conectar la función `agregarTrabajadorHoras` a un botón (si existe)
const btnAgregarHoras = document.getElementById("btnAgregarHoras");
if (btnAgregarHoras) {
  btnAgregarHoras.addEventListener("click", agregarTrabajadorHoras);
  console.log("Botón de agregar horas conectado.");
}

// Manejador para el formulario de registro de trabajadores
document
  .getElementById("trabajadorForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita el envío del formulario

    try {
      // Obtener los valores del formulario
      const nombre = document
        .getElementById("nombreTrabajadorForm")
        .value.trim();
      const edad = document.getElementById("edadTrabajador").value.trim();
      const direccion = document
        .getElementById("direccionTrabajador")
        .value.trim();
      const telefono = document
        .getElementById("telefonoTrabajador")
        .value.trim();
      const especialidad = document
        .getElementById("especialidadTrabajador")
        .value.trim();
      const experiencia = document
        .getElementById("experienciaTrabajador")
        .value.trim();

      // Validar campos obligatorios
      if (
        !nombre ||
        !edad ||
        !direccion ||
        !telefono ||
        !especialidad ||
        !experiencia
      ) {
        alert("Por favor, completa todos los campos del formulario.");
        return;
      }

      // Validar que edad y experiencia sean números válidos
      if (isNaN(edad) || isNaN(experiencia)) {
        alert("La edad y la experiencia deben ser números.");
        return;
      }

      // Mostrar datos de depuración en la consola
      console.log("Datos del trabajador:");
      console.log("Nombre:", nombre);
      console.log("Edad:", edad);
      console.log("Dirección:", direccion);
      console.log("Teléfono:", telefono);
      console.log("Especialidad:", especialidad);
      console.log("Experiencia:", experiencia);

      // Llamar a la función para registrar el trabajador
      console.log("Llamando a registrarTrabajador...");
      await registrarTrabajador(
        nombre,
        edad,
        direccion,
        telefono,
        especialidad,
        experiencia
      );

      // Limpiar el formulario después de enviar los datos
      console.log("Formulario enviado y limpiado.");
      e.target.reset();
    } catch (error) {
      console.error("Error al registrar el trabajador: ", error);
      alert(
        "Ocurrió un error al registrar el trabajador. Revisa la consola para más detalles."
      );
    }
  });
