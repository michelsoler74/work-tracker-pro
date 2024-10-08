import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJuUndhHEHdxRJmW89CDe0pfx76fFt0GM",
  authDomain: "worktracker-pro-a52d2.firebaseapp.com",
  projectId: "worktracker-pro-a52d2",
  storageBucket: "worktracker-pro-a52d2.appspot.com",
  messagingSenderId: "875903002791",
  appId: "1:875903002791:web:a38dab83f0cd7ec0a19382",
  measurementId: "G-3TJG2QXWYS",
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Function to load and display registered work from Firestore
export async function cargarTrabajosRegistrados() {
  try {
    const trabajosSnapshot = await getDocs(collection(db, "trabajos"));
    const listaTrabajosRegistrados = document.getElementById(
      "listaTrabajosRegistrados"
    );
    listaTrabajosRegistrados.innerHTML = "";

    trabajosSnapshot.forEach((doc) => {
      const trabajo = doc.data();
      const trabajoHTML = `
        <div class="trabajo-card">
          <h3>${trabajo.nombre}</h3>
          <p><strong>Descripción:</strong> ${trabajo.descripcion}</p>
          <p><strong>Ubicación:</strong> ${trabajo.ubicacion}</p>
          <p><strong>Fecha de Inicio:</strong> ${trabajo.fechaInicio}</p>
          <p><strong>Fecha de Finalización:</strong> ${
            trabajo.fechaFin || "No especificada"
          }</p>
        </div>
      `;
      listaTrabajosRegistrados.innerHTML += trabajoHTML;
    });
  } catch (error) {
    console.error("Error al cargar los trabajos: ", error);
    alert("Hubo un error al cargar los trabajos.");
  }
}

// Function to add new work to Firestore
document.getElementById("trabajoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombreTrabajo = document.getElementById("nombreTrabajo").value;
  const descripcionTrabajo =
    document.getElementById("descripcionTrabajo").value;
  const ubicacionTrabajo = document.getElementById("ubicacionTrabajo").value;
  const fechaInicioTrabajo =
    document.getElementById("fechaInicioTrabajo").value;
  const fechaFinTrabajo = document.getElementById("fechaFinTrabajo").value;

  try {
    await addDoc(collection(db, "trabajos"), {
      nombre: nombreTrabajo,
      descripcion: descripcionTrabajo,
      ubicacion: ubicacionTrabajo,
      fechaInicio: fechaInicioTrabajo,
      fechaFin: fechaFinTrabajo,
    });
    alert("Trabajo registrado exitosamente.");
    e.target.reset();
  } catch (error) {
    console.error("Error al agregar el documento: ", error);
    alert("Error al registrar el trabajo.");
  }
});

// Function to register a worker in Firestore
export async function registrarTrabajador(
  nombre,
  edad,
  direccion,
  telefono,
  especialidad,
  experiencia
) {
  try {
    // Add document to the "trabajadores" collection
    await addDoc(collection(db, "trabajadores"), {
      nombre,
      edad,
      direccion,
      telefono,
      especialidad,
      experiencia,
    });
    alert("Trabajador registrado exitosamente.");
  } catch (error) {
    console.error("Error al registrar el trabajador: ", error);
    alert("Hubo un error al registrar el trabajador.");
  }
}
