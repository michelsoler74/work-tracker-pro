# Guía de Desarrollo - Work Tracker Pro 2.0

## 🚀 Comandos de Desarrollo

### Scripts Disponibles
```bash
# Desarrollo
npm run dev         # Servidor de desarrollo (puerto 5174)

# Producción
npm run build       # Compilar para producción
npm run preview     # Vista previa del build de producción

# Limpieza
rm -rf dist/        # Limpiar archivos de build
rm -rf node_modules/ && npm install  # Reinstalar dependencias
```

### Estructura de Desarrollo
```
src/
├── index.html              # Punto de entrada principal
├── css/
│   └── style.css          # Estilos personalizados
├── js/
│   ├── app.js            # Aplicación principal
│   ├── services/         # Lógica de negocio
│   ├── utils/           # Utilidades y helpers
│   ├── components/      # Componentes reutilizables
│   ├── storage.js       # Gestión de almacenamiento
│   └── sw.js           # Service Worker
└── public/
    └── assets/         # Recursos estáticos (iconos, manifest)
```

## 🔧 Configuración del Entorno

### Vite Configuration (vite.config.js)
```javascript
export default {
  base: "/",
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: "../dist",
    assetsDir: "assets",
    sourcemap: true,
    emptyOutDir: true,
  },
  root: "src",
  publicDir: "public",
  plugins: [
    // Plugin personalizado para copiar Service Worker
    {
      name: 'copy-sw',
      writeBundle() {
        copyFileSync('./src/js/sw.js', './dist/sw.js');
      }
    }
  ]
}
```

## 📝 Estándares de Código

### JavaScript (ES6+)
- **Módulos ES6**: `import/export`
- **Async/Await**: Para operaciones asíncronas
- **JSDoc**: Documentación de funciones y clases
- **Camel Case**: Nombres de variables y funciones
- **Pascal Case**: Nombres de clases

#### Ejemplo de Función Documentada
```javascript
/**
 * Crea un nuevo trabajo en la base de datos
 * @param {Object} jobData - Datos del trabajo
 * @param {string} jobData.title - Título del trabajo
 * @param {string} jobData.description - Descripción del trabajo
 * @param {string} jobData.date - Fecha del trabajo (YYYY-MM-DD)
 * @param {string} jobData.status - Estado del trabajo
 * @param {Array<string>} jobData.workers - IDs de trabajadores asignados
 * @returns {Promise<Object>} Trabajo creado con ID asignado
 * @throws {Error} Si los datos no son válidos
 */
async addJob(jobData) {
  // Validación
  const validation = jobValidator.validate(jobData);
  if (!validation.isValid) {
    throw new Error(`Datos inválidos: ${validation.errorMessages.join(', ')}`);
  }

  // Crear trabajo
  const job = {
    id: generateId(),
    ...jobData,
    createdAt: new Date().toISOString()
  };

  // Guardar en BD
  await this.saveToDatabase(job);

  return job;
}
```

### HTML
- **Semantic HTML**: Uso de elementos semánticos
- **Accessibility**: Atributos ARIA cuando sea necesario
- **Bootstrap Classes**: Uso consistente de clases de Bootstrap

### CSS
- **BEM Methodology**: Para clases personalizadas
- **CSS Custom Properties**: Para variables
- **Mobile First**: Diseño responsive

## 🔄 Flujo de Trabajo

### 1. Desarrollo de Nuevas Funcionalidades
```bash
# 1. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar con servidor de desarrollo
npm run dev

# 3. Probar cambios
npm run build
npm run preview

# 4. Commit y push
git add .
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### 2. Debugging
```javascript
// Debugging en servicios
console.log('JobService - Adding job:', jobData);

// Debugging en base de datos
console.log('IndexedDB - Transaction result:', result);

// Debugging en UI
console.log('UI - Rendering jobs:', jobs.length);
```

### 3. Testing Manual
- [ ] Crear trabajo nuevo
- [ ] Editar trabajo existente
- [ ] Eliminar trabajo
- [ ] Crear trabajador nuevo
- [ ] Asignar trabajador a trabajo
- [ ] Buscar y filtrar
- [ ] Funcionalidad offline
- [ ] Instalación PWA

## 🛠️ Herramientas de Desarrollo

### Browser DevTools
```javascript
// Acceso a la aplicación desde consola
window.app.jobService.getAllJobs()
window.app.workerService.getAllWorkers()

// Limpiar base de datos (desarrollo)
window.app.jobService.clearAll()
window.app.workerService.clearAll()

// Ver estado actual
console.log('App State:', window.app.state)
```

### IndexedDB Inspector
- **Chrome DevTools**: Application > Storage > IndexedDB
- **Firefox DevTools**: Storage > IndexedDB

### Service Worker Inspector
- **Chrome DevTools**: Application > Service Workers
- **Lighthouse**: PWA audit

## 🐛 Solución de Problemas Comunes

### 1. Service Worker No Se Actualiza
```javascript
// Forzar actualización en consola
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

### 2. IndexedDB No Funciona
```javascript
// Verificar soporte
if (!window.indexedDB) {
  console.error('IndexedDB no soportado');
}

// Limpiar base de datos corrupta
await indexedDB.deleteDatabase('worktracker-db');
```

### 3. Build Falla
```bash
# Limpiar caché de Vite
rm -rf node_modules/.vite
npm run build
```

### 4. Puerto en Uso
```bash
# Usar puerto diferente
npm run dev -- --port 3000
npm run preview -- --port 4000
```

## 📊 Performance Tips

### 1. Optimización de Imágenes
```javascript
// Redimensionar imágenes antes de guardar
function resizeImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.src = URL.createObjectURL(file);
  });
}
```

### 2. Lazy Loading
```javascript
// Cargar datos solo cuando se necesiten
async renderJobs() {
  if (!this.jobsLoaded) {
    await this.jobService.loadJobs();
    this.jobsLoaded = true;
  }
  // Renderizar...
}
```

### 3. Debounce en Búsqueda
```javascript
// Evitar búsquedas excesivas
const debouncedSearch = debounce((query) => {
  this.searchService.search(query);
}, 300);
```

## 🔒 Seguridad

### Validación de Datos
- **Frontend**: Validación inmediata para UX
- **Sanitización**: Limpiar datos antes de guardar
- **Escape HTML**: Prevenir XSS en contenido dinámico

### Almacenamiento Seguro
- **IndexedDB**: Solo datos no sensibles
- **No localStorage**: Para datos importantes
- **Encriptación**: Para datos sensibles (futuro)

## 📱 PWA Development

### Manifest Testing
```bash
# Validar manifest
npx pwa-manifest-validator src/public/assets/manifest.json
```

### Service Worker Testing
```javascript
// Probar caché en consola
caches.keys().then(console.log);
caches.open('worktracker-v1').then(cache => cache.keys()).then(console.log);
```

### Lighthouse Audit
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- PWA: 100