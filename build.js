const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

// Función para ejecutar comandos y mostrar la salida
function runCommand(command, message) {
  console.log(`${colors.blue}${colors.bright}➤ ${message}...${colors.reset}`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`${colors.green}✓ ${message} completado${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Error en ${message}${colors.reset}`);
    console.error(`${colors.red}${error}${colors.reset}\n`);
    return false;
  }
}

// Comprobar dependencias
function checkDependencies() {
  console.log(
    `${colors.blue}${colors.bright}➤ Comprobando dependencias...${colors.reset}`
  );
  try {
    execSync("npm list electron electron-builder vite", { stdio: "ignore" });
    console.log(`${colors.green}✓ Dependencias instaladas${colors.reset}\n`);
    return true;
  } catch (error) {
    console.log(
      `${colors.yellow}! Faltan dependencias, instalando...${colors.reset}`
    );
    return runCommand("npm install", "Instalación de dependencias");
  }
}

// Función principal
async function build() {
  console.log(
    `\n${colors.bright}${colors.blue}=== WORK TRACKER PRO - PROCESO DE COMPILACIÓN ===${colors.reset}\n`
  );

  // Comprobar dependencias
  if (!checkDependencies()) return;

  // Generar iconos
  if (fs.existsSync(path.join(__dirname, "generate-icons.js"))) {
    if (!runCommand("node generate-icons.js", "Generación de iconos")) return;
  }

  // Limpiar directorio de distribución
  if (fs.existsSync(path.join(__dirname, "dist"))) {
    console.log(
      `${colors.blue}${colors.bright}➤ Limpiando directorio dist...${colors.reset}`
    );
    fs.rmSync(path.join(__dirname, "dist"), { recursive: true, force: true });
    console.log(`${colors.green}✓ Directorio dist limpiado${colors.reset}\n`);
  }

  // Construir frontend con Vite
  if (!runCommand("npm run build", "Compilación del frontend")) return;

  // Construir instaladores con Electron Builder
  if (!runCommand("npm run electron-build", "Compilación de instaladores"))
    return;

  console.log(
    `\n${colors.green}${colors.bright}✓ ¡COMPILACIÓN EXITOSA!${colors.reset}`
  );
  console.log(
    `\n${colors.green}Los instaladores se encuentran en la carpeta 'release'${colors.reset}\n`
  );
}

// Ejecutar
build().catch((err) => {
  console.error(
    `${colors.red}Error en el proceso de compilación:${colors.reset}`,
    err
  );
});
