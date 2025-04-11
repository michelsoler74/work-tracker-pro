const CACHE_NAME = "work-tracker-v1";
const BASE_PATH = "/work-tracker-pro";

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/assets/icons/icon-72x72.png`,
  `${BASE_PATH}/assets/icons/icon-96x96.png`,
  `${BASE_PATH}/assets/icons/icon-128x128.png`,
  `${BASE_PATH}/assets/icons/icon-144x144.png`,
  `${BASE_PATH}/assets/icons/icon-152x152.png`,
  `${BASE_PATH}/assets/icons/icon-192x192.png`,
  `${BASE_PATH}/assets/icons/icon-384x384.png`,
  `${BASE_PATH}/assets/icons/icon-512x512.png`,
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
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
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
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
