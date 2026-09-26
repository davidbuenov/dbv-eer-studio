import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// Versión única en package.json: se inyecta en la app ("Acerca de") para no duplicarla a mano en cada release
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

// Base relativa './' para que funcione 100% tanto en GitHub Pages como en Tauri WebView2 sin pantalla en negro
const base = process.env.VITE_BASE || './';

export default defineConfig({
  base,
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
