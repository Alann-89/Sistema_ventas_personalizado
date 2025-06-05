// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({

  // Asegúrate de que publicDir apunte a tu carpeta pública
  publicDir: '../public',
  build: {
    // Directorio de salida relativo a src-tauri
    outDir: '../dist',
    emptyOutDir: true,
  }
})