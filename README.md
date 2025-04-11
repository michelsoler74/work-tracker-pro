# WorkTracker Pro 2.0

Sistema de Gestión Inteligente de Proyectos y Personal

## 🌟 Características

- ✅ Registro detallado de trabajos con imágenes y asignación de personal
- 👥 Gestión completa de trabajadores y sus perfiles
- 📊 Dashboard con resumen de actividades
- 🎤 Reconocimiento de voz para entrada de datos
- 💾 Almacenamiento local con IndexedDB
- 📱 Diseño responsive para todos los dispositivos
- 🔄 Funcionamiento offline con tecnología PWA
- 🖥️ Versión de escritorio con Electron

## 🚀 Instalación en PC

### Opción 1: Instalación desde código fuente

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/work-tracker-pro-2.git
cd work-tracker-pro-2
```

2. Instala las dependencias:

```bash
npm install
```

3. Inicia la aplicación en modo desarrollo:

```bash
npm run electron-dev
```

4. Para generar los instaladores:

```bash
npm run dist
```

Esto generará instaladores en la carpeta `release` según tu sistema operativo:

- Windows: `.exe` (instalador NSIS)
- macOS: `.dmg`
- Linux: `.AppImage`, `.deb`, `.rpm`

### Opción 2: Instalación desde binarios precompilados

1. Descarga el instalador para tu sistema operativo desde la sección de [Releases](https://github.com/tu-usuario/work-tracker-pro-2/releases)
2. Ejecuta el instalador y sigue las instrucciones en pantalla
3. Inicia la aplicación desde el acceso directo creado

## 📱 Instalación en Dispositivos Móviles (PWA)

Work Tracker Pro 2.0 funciona como una Progressive Web App (PWA), lo que permite instalarlo en dispositivos móviles:

1. Abre la aplicación web en tu navegador móvil: `https://tu-dominio.com`
2. Para **Android** (Chrome):

   - Toca el menú (⋮) en la esquina superior derecha
   - Selecciona "Añadir a pantalla de inicio" o "Instalar aplicación"
   - Confirma la instalación

3. Para **iOS** (Safari):
   - Toca el icono de compartir en la parte inferior
   - Selecciona "Añadir a la pantalla de inicio"
   - Confirma la instalación

Una vez instalada, la aplicación:

- Aparecerá como un icono en tu pantalla de inicio
- Se abrirá a pantalla completa sin interfaz del navegador
- Funcionará sin conexión o con conexiones intermitentes

## ⚙️ Configuración

### Almacenamiento Local

La aplicación utiliza IndexedDB para almacenar datos localmente:

- No requiere configuración adicional
- Los datos se conservan entre sesiones
- Funciona sin conexión a internet

### Reconocimiento de Voz

- El reconocimiento de voz requiere un navegador compatible (Chrome, Edge, Safari)
- Asegúrate de conceder permisos de micrófono cuando se soliciten
- Funciona mejor en entornos silenciosos

## 🛠️ Uso

### Gestión de Trabajos

1. Navega a la pestaña "Trabajos"
2. Usa el formulario para crear nuevos trabajos
3. Adjunta imágenes arrastrando o seleccionando archivos
4. Usa el botón de micrófono 🎤 para dictar descripciones
5. Asigna trabajadores al proyecto

### Gestión de Trabajadores

1. Accede a la pestaña "Trabajadores"
2. Registra nuevos trabajadores con sus datos
3. Actualiza perfiles según sea necesario
4. Revisa el historial de trabajos asignados

### Funcionamiento Offline

La aplicación seguirá funcionando sin conexión:

1. Los datos se almacenan localmente
2. Puedes ver, añadir y editar información
3. Cuando recuperes la conexión, todo seguirá funcionando normalmente

### Exportación de Datos

Para hacer copias de seguridad de tus datos:

1. Ve a la pestaña de "Configuración"
2. Selecciona "Exportar datos"
3. Guarda el archivo JSON generado

## 🔄 Actualización

### Versión de Escritorio (Electron)

- La aplicación detectará automáticamente nuevas versiones
- Sigue las instrucciones en pantalla para actualizar

### Versión Web (PWA)

- Las actualizaciones se aplican automáticamente
- Asegúrate de tener una conexión a internet ocasionalmente para recibir actualizaciones

## 📞 Solución de Problemas

### La aplicación no se inicia

- Verifica que no haya otra instancia en ejecución
- Reinicia tu dispositivo e intenta nuevamente

### Problemas con el reconocimiento de voz

- Asegúrate de tener los permisos de micrófono habilitados
- Comprueba que tu navegador sea compatible (Chrome recomendado)
- Habla claramente y en un ambiente sin ruido

### Datos no se guardan

- Asegúrate de tener espacio disponible en el dispositivo
- Verifica que no estés en modo incógnito/privado en el navegador

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE.txt` para más detalles.

## 💬 Contacto

Para soporte o consultas, contacta a:

- 📧 Email: soporte@worktrackerpro.com

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

- 📧 Email: soporte@worktrackerpro.com
- 💬 Discord: [WorkTracker Pro Community](https://discord.gg/worktrackerpro)
- 📚 Wiki: [Documentación](https://docs.worktrackerpro.com)

## 🙏 Agradecimientos

- [Firebase](https://firebase.google.com)
- [Bootstrap](https://getbootstrap.com)
- [Font Awesome](https://fontawesome.com)
- Todos los contribuidores
