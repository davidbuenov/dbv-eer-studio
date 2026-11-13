// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

// Build de la edición Moodle (SPECIFICATIONS.md §3.10). Lo invoca scripts/build-moodle.mjs, que
// después incrusta JS y CSS en un único HTML. No toca vite.config.ts ni la salida dist/.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    outDir: 'dist-moodle/build',
    emptyOutDir: true,
    // Todo en un solo JS y un solo CSS (sin chunks dinámicos ni ficheros sueltos) para poder inlinarlos.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: 'moodle.html',
      output: { inlineDynamicImports: true },
    },
  },
})
