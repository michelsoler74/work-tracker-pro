export default {
  base: "/work-tracker-pro/",
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    emptyOutDir: true,
  },
  root: "src",
  publicDir: "public",
};
