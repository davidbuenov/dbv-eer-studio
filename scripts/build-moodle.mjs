// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
//
// Genera la edición Moodle para exámenes EER (SPECIFICATIONS.md §3.10):
//   dist-moodle/<nombre>.html             HTML único autocontenido (sin red)
//   dist-moodle/<nombre>_scorm12.zip      el mismo HTML dentro de un paquete SCORM 1.2
//
// Uso:
//   npm run build:moodle
//   npm run build:moodle -- --template examen.eer --title "Examen BD junio" [--id bd-junio] [--name examen-bd-junio]
//
// Sin dependencias npm nuevas: el zip se escribe con node:zlib (crc32 requiere Node >= 22.2).

import { build } from 'vite';
import { parseArgs } from 'node:util';
import { crc32, deflateRawSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'dist-moodle');
const BUILD_DIR = path.join(OUT_DIR, 'build');
const CONFIG_TAG = /(<script id="eer-exam-config" type="application\/json">)[\s\S]*?(<\/script>)/;

function fail(message) {
  console.error(`\n[build-moodle] ERROR: ${message}`);
  process.exit(1);
}

const { values: rawArgs } = parseArgs({
  options: {
    template: { type: 'string' },
    title: { type: 'string', default: '' },
    id: { type: 'string' },
    name: { type: 'string' },
  },
});
// `npm run` en Windows pasa los argumentos por cmd.exe y los escapa con `^` ("Examen^ BD^ —^ Hotel").
// Ningún título, id o ruta razonable usa `^`, así que se eliminan.
const args = Object.fromEntries(Object.entries(rawArgs).map(([key, value]) => [key, value.replace(/\^/g, '')]));

const slug = text =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/** Mismo FNV-1a que src/moodle/submission.ts; aquí solo deriva un id de examen estable. */
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const escapeXml = text =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- 1. Configuración del examen ----------
let template = '';
if (args.template) {
  const templatePath = path.resolve(process.cwd(), args.template);
  if (!fs.existsSync(templatePath)) fail(`no existe la plantilla ${templatePath}`);
  template = fs.readFileSync(templatePath, 'utf-8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
}
const title = args.title.trim();
// El id es la clave del autoguardado: estable mientras no cambien plantilla ni título, para que
// regenerar el paquete no haga perder el trabajo en curso.
const examId = slug(args.id ?? '') || `exam-${fnv1a(`${title}\n${template}`)}`;
const name = slug(args.name ?? '') || slug(title) || 'eer-studio-examen';

// ---------- 2. Build de Vite ----------
await build({ configFile: path.join(ROOT, 'vite.config.moodle.ts'), root: ROOT, logLevel: 'warn' });

// ---------- 3. HTML único ----------
let html = fs.readFileSync(path.join(BUILD_DIR, 'moodle.html'), 'utf-8');

const readAsset = ref => {
  const file = path.join(BUILD_DIR, ref.replace(/^\.?\//, ''));
  if (!fs.existsSync(file)) fail(`el HTML referencia ${ref}, que no está en el build`);
  return fs.readFileSync(file, 'utf-8');
};

// Con replacer de función, los `$` del código no se interpretan como patrones de sustitución.
// `</script` o `<!--` dentro del JS cerrarían o alterarían el <script> inline; escaparlos no cambia el código.
html = html.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g, (_, ref) => {
  const js = readAsset(ref).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g, (_, ref) => {
  const css = readAsset(ref).replace(/<\/style/gi, '<\\/style');
  return `<style>${css}</style>`;
});

if (!CONFIG_TAG.test(html)) fail('no se encontró <script id="eer-exam-config"> en moodle.html');
const configJson = JSON.stringify({ examId, title, template }).replace(/</g, '\\u003c');
html = html.replace(CONFIG_TAG, (_, open, close) => `${open}${configJson}${close}`);
if (title) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeXml(title)}</title>`);
}

// Verificación offline: fuera del contenido de <script>/<style> no puede quedar ningún src/href.
const markup = html.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1>/gi, '<$1$2></$1>');
const externalRefs = markup.match(/\b(src|href)\s*=\s*["'][^"']*["']/gi);
if (externalRefs) fail(`el HTML todavía referencia recursos externos: ${externalRefs.join(', ')}`);

// ---------- 4. Paquete SCORM 1.2 ----------
const htmlFile = `${name}.html`;
const scormTitle = escapeXml(title || 'Examen EER · EER Studio');
const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="dbv_eer_studio_${examId.replace(/-/g, '_')}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${scormTitle}</title>
      <item identifier="item1" identifierref="res1" isvisible="true">
        <title>${scormTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="${htmlFile}">
      <file href="${htmlFile}"/>
    </resource>
  </resources>
</manifest>
`;

/** Zip mínimo (deflate, nombres UTF-8) suficiente para el importador SCORM de Moodle. */
function createZip(entries, date = new Date()) {
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const { name: entryName, data } of entries) {
    const nameBytes = Buffer.from(entryName, 'utf-8');
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);

    offset += local.length + nameBytes.length + compressed.length;
  }

  const centralSize = centrals.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

// ---------- 5. Salida ----------
const htmlBuffer = Buffer.from(html, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, htmlFile), htmlBuffer);
const zipFile = `${name}_scorm12.zip`;
fs.writeFileSync(
  path.join(OUT_DIR, zipFile),
  createZip([
    { name: 'imsmanifest.xml', data: Buffer.from(manifest, 'utf-8') },
    { name: htmlFile, data: htmlBuffer },
  ]),
);
fs.rmSync(BUILD_DIR, { recursive: true, force: true });

const kb = bytes => `${(bytes / 1024).toFixed(0)} KB`;
console.log(`\n[build-moodle] Examen "${title || '(sin título)'}" · id ${examId} · plantilla ${template ? `${template.split('\n').length} líneas` : 'vacía'}`);
console.log(`  dist-moodle/${htmlFile}  (${kb(htmlBuffer.length)})`);
console.log(`  dist-moodle/${zipFile}  (${kb(fs.statSync(path.join(OUT_DIR, zipFile)).size)})`);
