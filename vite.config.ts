import { defineConfig } from "vite";

export default defineConfig({
  // Rutas relativas: funciona aunque cambie el nombre del repositorio de GitHub Pages.
  base: "./",
  build: {
    target: "es2022",
    sourcemap: false
  }
});
