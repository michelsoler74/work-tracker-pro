const CACHE_NAME = "work-tracker-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/storage.js",
  "/js/voice.js",
  "/js/services/job.service.js",
  "/js/services/worker.service.js",
  "/js/utils/helpers.js",
  "/js/utils/notifications.js",
  "/manifest.json",
  "/assets/icons/icon-72x72.png",
  "/assets/icons/icon-96x96.png",
  "/assets/icons/icon-128x128.png",
  "/assets/icons/icon-144x144.png",
  "/assets/icons/icon-152x152.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-384x384.png",
  "/assets/icons/icon-512x512.png",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache abierto");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error("Error en la instalación del SW:", error);
      })
  );
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Eliminando caché antiguo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché: Network First, fallback to Cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos recuperar de caché
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si no está en caché y es una página, devolver la página offline
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          return new Response("Sin conexión", {
            status: 503,
            statusText: "Sin conexión",
          });
        });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncData());
  }
});

// Manejo de notificaciones push
self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver detalles",
      },
      {
        action: "close",
        title: "Cerrar",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Work Tracker Pro", options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Función para sincronizar datos
async function syncData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();

    const syncPromises = requests
      .filter((request) => request.url.includes("/api/"))
      .map(async (request) => {
        try {
          const response = await fetch(request);
          await cache.put(request, response);
        } catch (error) {
          console.error("Error sincronizando:", error);
        }
      });

    await Promise.all(syncPromises);
  } catch (error) {
    console.error("Error en sincronización:", error);
  }
}
