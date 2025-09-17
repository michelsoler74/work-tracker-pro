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
        sw: "src/sw.js",
      },
    },
  },
  root: "src",
  publicDir: "public",
};
