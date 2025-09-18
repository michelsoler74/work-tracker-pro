import { copyFileSync } from 'fs';

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
    rollupOptions: {
      input: {
        main: "src/index.html",
      },
    },
  },
  root: "src",
  publicDir: "public",
  plugins: [
    {
      name: 'copy-sw',
      writeBundle() {
        copyFileSync('./src/js/sw.js', './dist/sw.js');
      }
    }
  ],
};
