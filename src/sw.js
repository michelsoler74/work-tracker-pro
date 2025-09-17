const CACHE_NAME = "work-tracker-pro-v1.0.0";

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/style.css",
  "/css/styles.css",
  "/js/app.js",
  "/js/ui.js",
  "/js/voice.js",
  "/js/storage.js",
  "/js/services/job.service.js",
  "/js/services/worker.service.js",
  "/js/utils/backup.js",
  "/js/utils/helpers.js",
  "/js/utils/loading.js",
  "/js/utils/notifications.js",
  "/js/utils/search.js",
  "/js/utils/validator.js",
  "/js/utils/indexedDB.js",
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
  console.log("Service Worker: Instalando...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cache abierto");
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("Error al cachear archivos:", error);
        // Continuar instalación aunque algunos archivos fallen
        return Promise.resolve();
      });
    })
  );

  // Forzar activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activando...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Eliminando caché antiguo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Tomar control inmediato de todas las páginas
  self.clients.claim();
});

// Estrategia de caché: Cache First para recursos estáticos, Network First para datos
self.addEventListener("fetch", (event) => {
  // Ignorar requests no GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar extensiones del navegador
  if (event.request.url.startsWith('chrome-extension://') ||
      event.request.url.startsWith('moz-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en cache, devolverlo
      if (response) {
        console.log('Service Worker: Sirviendo desde cache:', event.request.url);
        return response;
      }

      // Si no está en cache, hacer fetch
      return fetch(event.request).then((response) => {
        // Verificar respuesta válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clonar respuesta para cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('Service Worker: Error en fetch:', error);

        // Para navegación, devolver página offline si existe
        if (event.request.destination === 'document') {
          return caches.match('/offline.html').then((offlineResponse) => {
            return offlineResponse || new Response(
              '<!DOCTYPE html><html><head><title>Sin conexión</title></head><body><h1>Sin conexión</h1><p>La aplicación no está disponible sin conexión.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        }

        throw error;
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
