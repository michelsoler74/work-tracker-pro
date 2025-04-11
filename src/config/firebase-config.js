// Configuración del proyecto Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyBJuUndhHEHdxRJmW89CDe0pfx76fFt0GM",
  authDomain: "worktracker-pro-a52d2.firebaseapp.com",
  projectId: "worktracker-pro-a52d2",
  storageBucket: "worktracker-pro-a52d2.appspot.com",
  messagingSenderId: "875903002791",
  appId: "1:875903002791:web:a38dab83f0cd7ec0a19382",
  measurementId: "G-3TJG2QXWYS",
};

/*
// Reglas de seguridad para Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

// Reglas de seguridad para Storage
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
*/
