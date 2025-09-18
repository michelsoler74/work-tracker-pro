# Documentación Técnica - Work Tracker Pro 2.0

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Servicios](#servicios)
3. [Utilidades](#utilidades)
4. [Base de Datos](#base-de-datos)
5. [Service Worker](#service-worker)
6. [Patrones de Diseño](#patrones-de-diseño)

## 🏗️ Arquitectura General

### Estructura de Capas
```
┌─────────────────────────────────┐
│          Presentación           │  ← app.js (UI + Eventos)
├─────────────────────────────────┤
│           Servicios             │  ← job.service.js, worker.service.js
├─────────────────────────────────┤
│          Utilidades             │  ← helpers, validators, search
├─────────────────────────────────┤
│        Almacenamiento          │  ← IndexedDB, storage.js
└─────────────────────────────────┘
```

### Componentes Principales

#### 1. **WorkTrackerApp** (app.js)
- **Responsabilidad**: Controlador principal de la aplicación
- **Funciones clave**:
  - Inicialización de servicios
  - Gestión de eventos del DOM
  - Coordinación entre servicios y UI
  - Manejo de formularios y validaciones

#### 2. **JobService** (services/job.service.js)
- **Responsabilidad**: Gestión completa de trabajos
- **Funciones clave**:
  - CRUD de trabajos
  - Estadísticas de trabajos
  - Validación de datos
  - Gestión de fotos

#### 3. **WorkerService** (services/worker.service.js)
- **Responsabilidad**: Gestión completa de trabajadores
- **Funciones clave**:
  - CRUD de trabajadores
  - Estadísticas de trabajadores
  - Gestión de perfiles
  - Validación de duplicados

## 🔧 Servicios

### JobService
```javascript
class JobService {
  async init()                    // Inicialización del servicio
  async loadJobs()               // Carga trabajos desde IndexedDB
  async addJob(jobData)          // Crear nuevo trabajo
  async updateJob(id, data)      // Actualizar trabajo existente
  async deleteJob(id)            // Eliminar trabajo
  getAllJobs()                   // Obtener todos los trabajos
  getWorkerJobs(workerId)        // Trabajos de un trabajador específico
  async getJobStats()            // Estadísticas generales
}
```

### WorkerService
```javascript
class WorkerService {
  async init()                     // Inicialización del servicio
  async loadWorkers()             // Carga trabajadores desde IndexedDB
  async addWorker(workerData)     // Crear nuevo trabajador
  async updateWorker(id, data)    // Actualizar trabajador existente
  async deleteWorker(id)          // Eliminar trabajador
  getAllWorkers()                 // Obtener todos los trabajadores
  getWorkerById(id)              // Obtener trabajador por ID
  async getWorkerStats()         // Estadísticas generales
}
```

## 🛠️ Utilidades

### helpers.js
- `generateId()`: Genera IDs únicos para entidades
- `formatDate()`: Formateo consistente de fechas
- `validateForm()`: Validación genérica de formularios

### validator.js
- `FormValidator`: Clase para validación en tiempo real
- `jobValidator`: Validador específico para trabajos
- `workerValidator`: Validador específico para trabajadores

### search.js
- `searchService`: Motor de búsqueda avanzada
- Filtros por múltiples criterios
- Búsqueda en tiempo real

### notifications.js
- `showNotification()`: Sistema de notificaciones toast
- Tipos: success, error, warning, info

### loading.js
- `loadingManager`: Gestión de estados de carga
- `SkeletonLoader`: Cargadores esqueléticos
- `ConfirmationModal`: Diálogos de confirmación
- `FeedbackUtils`: Efectos visuales de feedback

## 💾 Base de Datos

### Estructura IndexedDB
```javascript
Database: "worktracker-db"
Version: 1

Stores:
├── "jobs"           // Almacén de trabajos
│   ├── id (key)     // ID único del trabajo
│   ├── title        // Título del trabajo
│   ├── description  // Descripción detallada
│   ├── date         // Fecha del trabajo
│   ├── status       // Estado: Pendiente, En Progreso, Completado
│   ├── workers      // Array de IDs de trabajadores asignados
│   ├── photos       // Array de fotos en base64
│   └── createdAt    // Timestamp de creación
│
├── "workers"        // Almacén de trabajadores
│   ├── id (key)     // ID único del trabajador
│   ├── name         // Nombre completo
│   ├── specialty    // Especialidad/cargo
│   ├── phone        // Teléfono de contacto
│   ├── email        // Email de contacto
│   ├── profileImage // Foto de perfil en base64
│   ├── hours        // Horas trabajadas totales
│   ├── jobs         // Array de IDs de trabajos asignados
│   └── createdAt    // Timestamp de creación
│
└── "sync-queue"     // Cola de sincronización (futuro)
    ├── id (key)     // ID de la operación
    ├── type         // Tipo: create, update, delete
    ├── entity       // Entidad: job, worker
    ├── data         // Datos de la operación
    └── timestamp    // Timestamp de la operación
```

### Gestión de Datos
- **Persistencia**: IndexedDB para almacenamiento local
- **Transacciones**: Operaciones atómicas para consistencia
- **Validación**: Validación en frontend antes de almacenar
- **Backup**: Sistema de exportación/importación JSON

## 🔄 Service Worker

### Funcionalidades
- **Caché de recursos**: HTML, CSS, JS, imágenes
- **Funcionamiento offline**: Acceso a la app sin conexión
- **Actualizaciones**: Gestión de versiones de caché
- **Notificaciones**: Push notifications (futuro)

### Estrategias de Caché
```javascript
// Estrategia "Cache First" para recursos estáticos
self.addEventListener('fetch', event => {
  if (event.request.destination === 'style' ||
      event.request.destination === 'script') {
    event.respondWith(cacheFirst(event.request));
  }
});

// Estrategia "Network First" para datos dinámicos
if (event.request.url.includes('/api/')) {
  event.respondWith(networkFirst(event.request));
}
```

## 🎨 Patrones de Diseño

### 1. **Singleton Pattern**
- `WorkTrackerApp`: Una sola instancia de la aplicación
- Servicios: Una instancia por tipo de servicio

### 2. **Observer Pattern**
- Eventos del DOM para comunicación entre componentes
- Notificaciones para feedback al usuario

### 3. **Factory Pattern**
- `generateId()`: Creación consistente de identificadores
- Validadores específicos por tipo de entidad

### 4. **Module Pattern**
- Cada archivo JS es un módulo ES6
- Encapsulación de funcionalidades
- Imports/exports explícitos

### 5. **MVC Pattern** (Adaptado)
- **Model**: Servicios + IndexedDB
- **View**: DOM + Templates HTML
- **Controller**: WorkTrackerApp + Event Handlers

## 🔄 Flujo de Datos

### Creación de Trabajo
```
User Input → Validation → JobService.addJob() → IndexedDB → UI Update
```

### Búsqueda
```
Search Input → searchService.filter() → Filter Results → Render Filtered View
```

### Inicialización
```
DOM Ready → WorkTrackerApp.init() → Services.init() → Load Data → Render UI
```

## 🚀 Optimizaciones

### Performance
- **Lazy Loading**: Carga de datos bajo demanda
- **Debouncing**: Búsqueda con retraso para evitar spam
- **Skeleton Loading**: Mejora la percepción de velocidad
- **Image Compression**: Redimensionamiento automático de fotos

### UX/UI
- **Feedback Visual**: Animaciones y transiciones suaves
- **Loading States**: Indicadores de progreso
- **Error Handling**: Manejo graceful de errores
- **Responsive Design**: Adaptación a todos los dispositivos

## 📱 PWA Features

### Manifest
- Configuración para instalación
- Iconos para diferentes resoluciones
- Configuración de pantalla completa

### Service Worker
- Caché estratégico de recursos
- Funcionamiento offline
- Actualizaciones automáticas

### IndexedDB
- Persistencia local de datos
- Funcionamiento sin conexión
- Sincronización futura con backend