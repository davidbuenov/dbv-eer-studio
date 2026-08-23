import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base relativa './' para que funcione 100% tanto en GitHub Pages como en Tauri WebView2 sin pantalla en negro
const base = process.env.VITE_BASE || './';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
