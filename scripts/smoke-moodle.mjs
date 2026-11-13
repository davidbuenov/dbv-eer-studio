// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
//
// Smoke test de extremo a extremo de la edición Moodle (Playwright, ya en devDependencies):
// red bloqueada, plantilla, autoguardado, copiar/cargar entrega, ayuda reducida, respaldo del
// portapapeles y reproductor SCORM 1.2 simulado. Espera la plantilla de ejemplos/202511ER_Hotel.eer.
//
// Uso:
//   npm run build:moodle -- --template ejemplos/202511ER_Hotel.eer --title "Examen BD — Hotel (prueba)"
//   node scripts/smoke-moodle.mjs dist-moodle/examen-bd-hotel-prueba.html
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const htmlPath = path.resolve(process.argv[2]);
const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
};

const browser = await chromium.launch();

// ---------- A. file:// con toda la red bloqueada ----------
{
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const external = [];
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('file:') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    external.push(url);
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForSelector('textarea');
  const code = () => page.locator('textarea').first().inputValue();

  check('arranca con la plantilla', (await code()).includes('ent HOTEL'));
  check('título del examen en la barra', await page.getByRole('heading', { name: /Examen BD/ }).isVisible());
  await page.locator('svg text').first().waitFor();
check('el canvas dibuja nodos', (await page.locator('svg text').count()) > 10);
  check('sin pestañas Relacional/SQL', (await page.getByText('Modelo Relacional', { exact: true }).count()) === 0);

  // Autoguardado + recarga
  await page.locator('textarea').first().fill(`${await code()}\nent PRUEBA_AUTOSAVE (900, 100)`);
  await page.waitForTimeout(700);
  await page.reload();
  await page.waitForSelector('textarea');
  check('recupera el autoguardado tras recargar', (await code()).includes('PRUEBA_AUTOSAVE'));
  check('aviso de trabajo recuperado', await page.getByRole('status').filter({ hasText: /recuperado/ }).isVisible());

  // Copiar para entregar
  await page.getByRole('button', { name: 'Copiar para entregar' }).click();
  await page.waitForTimeout(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check('copia el bloque al portapapeles', clip.startsWith('=== EER-STUDIO BEGIN v1 ===') && clip.includes('PRUEBA_AUTOSAVE') && /checksum=[0-9a-f]{8}/.test(clip));
  check('aviso de copiado', await page.getByRole('status').filter({ hasText: /Copiado/ }).isVisible());

  // Cargar una entrega envuelta en HTML de TinyMCE
  const asHtml = text => text.split('\n').map(l => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&nbsp;'}</p>`).join('\n');
  await page.locator('textarea').first().fill('');
  await page.getByRole('button', { name: 'Cargar entrega' }).click();
  await page.getByRole('dialog').locator('textarea').fill(`<p>Entrega de Ana</p>\n${asHtml(clip)}`);
  await page.getByRole('dialog').getByRole('button', { name: 'Cargar', exact: true }).click();
  const loaded = await code();
  check('reconstruye el DSL desde el HTML pegado', loaded.includes('PRUEBA_AUTOSAVE') && loaded.includes('key_att Nombre -> HOTEL'));
  check('suma de control correcta', await page.getByRole('status').filter({ hasText: /suma de control es correcta/ }).isVisible());

  // Entrega manipulada
  await page.getByRole('button', { name: 'Cargar entrega' }).click();
  await page.getByRole('dialog').locator('textarea').fill(clip.replace('PRUEBA_AUTOSAVE', 'OTRA_COSA'));
  await page.getByRole('dialog').getByRole('button', { name: 'Cargar', exact: true }).click();
  check('detecta la entrega manipulada', await page.getByRole('status').filter({ hasText: /NO coincide/ }).isVisible());

  // Bloque incompleto: error dentro del modal, sin cambiar el código
  const before = await code();
  await page.getByRole('button', { name: 'Cargar entrega' }).click();
  await page.getByRole('dialog').locator('textarea').fill('=== EER-STUDIO BEGIN v1 ===\nent X');
  await page.getByRole('dialog').getByRole('button', { name: 'Cargar', exact: true }).click();
  check('bloque incompleto: muestra error', await page.getByRole('dialog').getByText(/incompleto/).isVisible());
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  check('bloque incompleto: no toca el código', (await code()) === before);

  // Copiar con errores pide confirmación
  await page.locator('textarea').first().fill('ent HOTEL (100, 100)\nlink HOTEL');
  await page.getByText('Línea 2:').waitFor(); // el compilador va con retardo (useEERParser)
  await page.getByRole('button', { name: 'Copiar para entregar' }).click();
  check('con errores pide confirmación antes de copiar', await page.getByRole('dialog', { name: 'El diagrama tiene errores' }).isVisible());
  await page.getByRole('button', { name: 'Copiar igualmente' }).click();
  await page.waitForTimeout(200);
  check('copia igualmente tras confirmar', (await page.evaluate(() => navigator.clipboard.readText())).includes('link HOTEL'));

  // Empezar de nuevo
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Empezar de nuevo' }).click();
  check('empezar de nuevo restaura la plantilla', (await code()).includes('ent HOTEL (150, 100)') && !(await code()).includes('PRUEBA'));

  // Ayuda reducida
  await page.keyboard.press('F1');
  const tabs = await page.getByRole('tab').allInnerTexts();
  check('F1 abre la ayuda solo con Uso del editor y Sintaxis', tabs.length === 2 && tabs.join('|').includes('Sintaxis'), tabs.join(' | '));
  await page.getByRole('tab', { name: 'Uso del editor' }).click();
  check('uso del editor sin sección relacional', (await page.getByText('Modelo relacional, SQL y archivos').count()) === 0);
  await page.getByRole('tab', { name: 'Sintaxis' }).click();
  check('sintaxis sin selector de DSL relacional', (await page.getByRole('tabpanel').getByRole('button', { name: /Relacional/ }).count()) === 0);
  await page.keyboard.press('Escape');

  // Inglés
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  check('cambia a inglés', await page.getByRole('button', { name: 'Copy for submission' }).isVisible());

  check('ninguna petición de red', external.length === 0, external.join(', '));
  check('sin errores de JavaScript', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---------- B. Respaldo del portapapeles (Clipboard API y execCommand bloqueados) ----------
{
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('NotAllowedError')) } });
    document.execCommand = () => false;
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForSelector('textarea');
  await page.getByRole('button', { name: 'Copiar para entregar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Copia tu entrega' });
  check('sin portapapeles muestra el bloque para Ctrl+C', await dialog.isVisible());
  const selected = await page.evaluate(() => {
    const el = document.activeElement;
    return el instanceof HTMLTextAreaElement ? el.value.slice(el.selectionStart, el.selectionEnd) : '';
  });
  check('el bloque queda seleccionado', selected.startsWith('=== EER-STUDIO BEGIN v1 ==='));
  await context.close();
}

// ---------- C. Dentro de un reproductor SCORM 1.2 simulado ----------
{
  const exam = fs.readFileSync(htmlPath);
  const player = `<!doctype html><script>
    window.calls = [];
    const values = { 'cmi.core.lesson_status': 'not attempted' };
    window.API = {
      LMSInitialize: () => (calls.push('init'), 'true'),
      LMSFinish: () => (calls.push('finish'), 'true'),
      LMSGetValue: k => values[k] ?? '',
      LMSSetValue: (k, v) => (calls.push(k + '=' + v), values[k] = v, 'true'),
      LMSCommit: () => (calls.push('commit'), 'true'),
    };
  </script><iframe id="sco" src="/exam.html" style="width:1400px;height:800px"></iframe>`;
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(req.url === '/exam.html' ? exam : player);
  });
  await new Promise(r => server.listen(0, r));
  const { port } = server.address();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}/`);
  const frame = page.frameLocator('#sco');
  await frame.locator('textarea').first().waitFor();
  const calls = () => page.evaluate(() => window.calls);
  check('SCORM: inicializa y marca incomplete', (await calls()).includes('cmi.core.lesson_status=incomplete'));
  await frame.getByRole('button', { name: 'Copiar para entregar' }).click();
  await page.waitForTimeout(300);
  check('SCORM: copiar marca completed', (await calls()).includes('cmi.core.lesson_status=completed'), (await calls()).join(','));
  await context.close();
  server.close();
}

await browser.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones OK`);
process.exit(failed ? 1 : 0);
