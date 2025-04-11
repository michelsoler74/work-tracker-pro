// Service Worker para WorkTracker Pro
const CACHE_NAME = "work-tracker-pro-v1";
const OFFLINE_URL = "/offline.html";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/css/style.css",
  "/js/app.js",
  "/js/firebase.js",
  "/js/voice.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Cacheando recursos iniciales");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error("[Service Worker] Error durante la instalación:", error);
        throw error;
      })
  );
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activando...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(
                "[Service Worker] Eliminando caché antigua:",
                cacheName
              );
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[Service Worker] Reclamando control de clientes");
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("[Service Worker] Error durante la activación:", error);
        throw error;
      })
  );
});

// Estrategia de caché: Network First con fallback a caché
self.addEventListener("fetch", (event) => {
  // No interceptar peticiones a Firebase o análisis
  if (
    event.request.url.includes("firebase") ||
    event.request.url.includes("analytics") ||
    event.request.url.includes("googleapis")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si encontramos una coincidencia en el cache, la devolvemos
      if (response) {
        return response;
      }

      // Si no hay coincidencia, hacemos la petición a la red
      return fetch(event.request)
        .then((response) => {
          // Si la respuesta no es válida, devolvemos el error
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clonamos la respuesta para poder almacenarla en el cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Si falla la petición a la red, devolvemos la página offline
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// Manejo de mensajes desde la aplicación
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(
      // Aquí iría la lógica para sincronizar datos pendientes
      syncData()
    );
  }
});

// Función para sincronizar datos (placeholder)
async function syncData() {
  try {
    // Aquí iría la lógica para obtener datos pendientes del IndexedDB
    // y enviarlos al servidor cuando haya conexión
    console.log("Sincronizando datos...");
  } catch (error) {
    console.error("Error durante la sincronización:", error);
  }
}
