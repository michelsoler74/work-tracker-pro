const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Verificar si archiver está instalado
try {
  require.resolve("archiver");
} catch (e) {
  console.error('El paquete "archiver" no está instalado. Instalándolo...');
  require("child_process").execSync("npm install archiver --save-dev", {
    stdio: "inherit",
  });
}

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

// Obtener la versión del package.json
const packageJson = require("./package.json");
const version = packageJson.version || "1.0.0";

// Nombre del archivo ZIP
const zipFileName = `work-tracker-pro-${version}.zip`;

// Función principal
async function createZip() {
  console.log(
    `\n${colors.bright}${colors.blue}=== CREANDO ARCHIVO ZIP DE DISTRIBUCIÓN ===${colors.reset}\n`
  );

  // Crear carpeta dist si no existe
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }

  // Crear el archivo de salida
  const output = fs.createWriteStream(path.join("dist", zipFileName));
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Máxima compresión
  });

  // Manejar eventos
  output.on("close", () => {
    const sizeMB = (archive.pointer() / 1048576).toFixed(2);
    console.log(
      `\n${colors.green}${colors.bright}✓ Archivo ZIP creado correctamente${colors.reset}`
    );
    console.log(`${colors.green}📦 Tamaño: ${sizeMB} MB${colors.reset}`);
    console.log(
      `${colors.green}📂 Ubicación: ${path.join("dist", zipFileName)}${
        colors.reset
      }\n`
    );
  });

  archive.on("warning", (err) => {
    if (err.code === "ENOENT") {
      console.warn(`${colors.yellow}⚠️ Advertencia: ${err}${colors.reset}`);
    } else {
      throw err;
    }
  });

  archive.on("error", (err) => {
    throw err;
  });

  // Conectar archivador con el stream de escritura
  archive.pipe(output);

  console.log(
    `${colors.blue}${colors.bright}➤ Agregando archivos al ZIP...${colors.reset}`
  );

  // Agregar archivos al ZIP
  // Agregar archivos principales
  const mainFiles = [
    "package.json",
    "README.md",
    "LICENSE.txt",
    "electron-builder.yml",
    "vite.config.js",
  ];
  for (const file of mainFiles) {
    if (fs.existsSync(file)) {
      archive.file(file, { name: file });
      console.log(`  ${colors.green}✓ ${file}${colors.reset}`);
    }
  }

  // Agregar carpeta src
  archive.directory("src/", "src");
  console.log(`  ${colors.green}✓ src/${colors.reset}`);

  // Agregar scripts de construcción
  const buildScripts = ["build.js", "generate-icons.js"];
  for (const file of buildScripts) {
    if (fs.existsSync(file)) {
      archive.file(file, { name: file });
      console.log(`  ${colors.green}✓ ${file}${colors.reset}`);
    }
  }

  // No incluir node_modules (demasiado grande)
  console.log(
    `  ${colors.yellow}⚠️ node_modules/ excluido (se instalará con npm install)${colors.reset}`
  );

  // Finalizar el archivo
  archive.finalize();
}

// Ejecutar
createZip().catch((err) => {
  console.error(
    `${colors.red}Error al crear el archivo ZIP:${colors.reset}`,
    err
  );
});
