// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
//
// Genera los paquetes oficiales de la edición Moodle, que se versionan en dist-moodle/ (paso de /ship).
// Los nombres son fijos para que los enlaces de la guía del profesor (.../tree/main/dist-moodle y
// .../raw/main/dist-moodle/<fichero>) sigan valiendo en todas las versiones:
//
//   dist-moodle/eer-studio-moodle-vacio_scorm12.zip          examen con el editor vacío
//   dist-moodle/eer-studio-moodle-vacio.html                 el mismo, suelto (visor para corregir)
//   dist-moodle/eer-studio-moodle-ejemplo-hotel_scorm12.zip  examen de ejemplo (Hoteles Royal UMA)
//   docs/moodle/GUIA_PROFESOR.pdf                            guía del profesor (Typst)
//
// Uso: npm run build:moodle:release   (requiere Typst en el PATH)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'dist-moodle');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

const PACKAGES = [
  ['--name', 'eer-studio-moodle-vacio'],
  ['--name', 'eer-studio-moodle-ejemplo-hotel', '--template', 'ejemplos/202511ER_Hotel.eer', '--title', 'Ejemplo · Hoteles Royal UMA'],
];
for (const args of PACKAGES) run(process.execPath, ['scripts/build-moodle.mjs', ...args]);

try {
  // Con shell: en Windows, typst instalado con WinGet es un enlace que execFile no resuelve sin ella.
  execFileSync('typst compile docs/moodle/main.typ docs/moodle/GUIA_PROFESOR.pdf', { cwd: ROOT, stdio: 'inherit', shell: true });
} catch {
  console.error('\n[build-moodle-release] ERROR: no se pudo compilar la guía con Typst (¿está instalado y en el PATH?).');
  process.exit(1);
}

const assets = [
  'eer-studio-moodle-vacio_scorm12.zip',
  'eer-studio-moodle-vacio.html',
  'eer-studio-moodle-ejemplo-hotel_scorm12.zip',
];
console.log('\n[build-moodle-release] Paquetes oficiales (se versionan) y guía en docs/moodle/GUIA_PROFESOR.pdf:');
for (const name of assets) {
  const file = path.join(OUT_DIR, name);
  if (!fs.existsSync(file)) {
    console.error(`  FALTA ${name}`);
    process.exit(1);
  }
  console.log(`  dist-moodle/${name}  (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
}
