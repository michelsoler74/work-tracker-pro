const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDirectory = path.join(__dirname, "src", "assets", "icons");

// Asegurarse de que el directorio exista
if (!fs.existsSync(iconDirectory)) {
  fs.mkdirSync(iconDirectory, { recursive: true });
}

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(iconDirectory, "icon.svg"));

  // Generar PNG para cada tamaño
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconDirectory, `icon-${size}x${size}.png`));

    console.log(`✅ Generado: icon-${size}x${size}.png`);
  }

  // Generar icono ICO para Windows
  await sharp(svgBuffer)
    .resize(256, 256)
    .toFile(path.join(iconDirectory, "icon-512x512.ico"));

  console.log("✅ Generado: icon-512x512.ico");

  // Generar icono ICNS para macOS (requiere iconutil en Mac)
  console.log(
    "⚠️ Para crear el archivo .icns, necesitarás usar iconutil en macOS."
  );
}

generateIcons()
  .then(() =>
    console.log("✅ Todos los iconos fueron generados correctamente.")
  )
  .catch((err) => console.error("❌ Error al generar iconos:", err));
