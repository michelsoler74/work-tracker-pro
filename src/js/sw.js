const CACHE_NAME = "work-tracker-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/css/style.css",
  "/js/app.js",
  "/js/firebase.js",
  "/js/voice.js",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
];

// Apertura de IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WorkTrackerDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Crear almacenes si no existen
      if (!db.objectStoreNames.contains("trabajos")) {
        db.createObjectStore("trabajos", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("trabajadores")) {
        db.createObjectStore("trabajadores", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("Error caching static assets:", error);
      })
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Asegurar que el Service Worker tome el control inmediatamente
      self.clients.claim(),
    ])
  );
});

// Estrategia de cache: Network First con fallback a IndexedDB y cache
self.addEventListener("fetch", (event) => {
  // No interceptar peticiones a Firebase o analytics
  if (
    event.request.url.includes("firebaseio.com") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("google-analytics.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Si falla la red, intentamos obtener del cache
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // Si es una petición de datos, intentamos obtener de IndexedDB
        if (event.request.url.includes("/api/")) {
          try {
            const db = await openDB();
            // Aquí iría la lógica para obtener datos de IndexedDB
            // según el tipo de petición
            return new Response(
              JSON.stringify({
                offline: true,
                data: [], // Datos de IndexedDB
              })
            );
          } catch (error) {
            console.error("Error accessing IndexedDB:", error);
          }
        }

        // Si todo falla, devolvemos la página offline
        return caches.match("/offline.html");
      })
  );
});

// Background Sync para datos pendientes
self.addEventListener("sync", async (event) => {
  if (event.tag === "sync-pending-data") {
    try {
      const db = await openDB();
      const tx = db.transaction("syncQueue", "readonly");
      const store = tx.objectStore("syncQueue");
      const pendingData = await store.getAll();

      // Procesar datos pendientes
      for (const data of pendingData) {
        try {
          await syncData(data);
          // Eliminar de la cola después de sincronizar
          const deleteTx = db.transaction("syncQueue", "readwrite");
          const deleteStore = deleteTx.objectStore("syncQueue");
          await deleteStore.delete(data.id);
        } catch (error) {
          console.error("Error syncing data:", error);
        }
      }
    } catch (error) {
      console.error("Error processing sync queue:", error);
    }
  }
});

// Manejo de notificaciones push
self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/icon-192x192.png",
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
