// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
//
// Genera las capturas 1920x1080 de la ficha de Microsoft Store / Uptodown en ES y EN.
// Paso obligatorio de cada /ship (ver dbv-specs-ops/docs/MICROSOFT_STORE.md §7).
//
// Uso:
//   npm run build
//   npx vite preview --port 4173 --strictPort    (en otra terminal)
//   node scripts/capture-store-screenshots.mjs

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = 'http://localhost:4173';
const OUT_DIR = path.resolve('docs/store/screenshots');

const TEXT = {
  es: { relational: 'Modelo Relacional', sql: 'Oracle SQL DDL', help: 'Ayuda', usageTab: 'Uso del editor', bookTitle: 'Ver explicación del paso formal', close: 'Cancelar' },
  en: { relational: 'Relational Model', sql: 'Oracle SQL DDL', help: 'Help', usageTab: 'Using the editor', bookTitle: 'View formal step explanation', close: 'Cancel' },
};

async function nodeCenter(page, label) {
  const box = await page.locator('svg.h-full text', { hasText: new RegExp(`^${label}$`) }).first().boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function capture(page, lang) {
  const t = TEXT[lang];
  const shot = name => page.screenshot({ path: path.join(OUT_DIR, `${name}_${lang}.png`) });

  await page.goto(BASE_URL);
  await page.evaluate(l => {
    localStorage.setItem('eer-studio-language', l);
    localStorage.setItem('eer-studio-help-tab', 'usage');
  }, lang);
  await page.reload();
  await page.waitForTimeout(1000);

  // 01 — Diagrama EER: jerarquía seleccionada con el rectángulo y sus líneas resaltadas en el DSL
  const sec = await nodeCenter(page, 'SECRETARIA');
  const tec = await nodeCenter(page, 'TECNICO');
  await page.mouse.move(sec.x - 80, sec.y - 45);
  await page.mouse.down();
  await page.mouse.move(tec.x + 80, tec.y + 45, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  await shot('screenshot_01_eer_diagram');

  // 05 — Edición visual de una relación (doble clic)
  const rel = await nodeCenter(page, 'TRABAJA_PARA');
  await page.mouse.dblclick(rel.x, rel.y);
  await page.waitForTimeout(500);
  await shot('screenshot_05_edit_element');
  await page.getByRole('button', { name: t.close }).click();
  await page.waitForTimeout(300);

  // 06 — Centro de Ayuda: uso del editor
  await page.keyboard.press('F1');
  await page.getByRole('tab', { name: t.usageTab }).click();
  await page.waitForTimeout(400);
  await shot('screenshot_06_help_center');
  await page.keyboard.press('Escape');

  // 02 — Modelo Relacional
  await page.click(`button:has-text("${t.relational}")`);
  await page.waitForTimeout(1000);
  await shot('screenshot_02_relational_model');

  // 04 — Guía de 9 Pasos abierta desde el icono 📖 de una tabla
  await page.locator(`[title="${t.bookTitle}"]`).first().click();
  await page.waitForTimeout(600);
  await shot('screenshot_04_step_inspector');
  await page.keyboard.press('Escape');

  // 03 — Exportación Oracle SQL DDL
  await page.click(`button:has-text("${t.sql}")`);
  await page.waitForTimeout(1000);
  await shot('screenshot_03_sql_ddl_export');
}

const browser = await chromium.launch();
try {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const lang of ['es', 'en']) {
    await capture(page, lang);
    console.log(`Capturas ${lang.toUpperCase()} generadas en ${OUT_DIR}`);
  }
} finally {
  await browser.close();
}
