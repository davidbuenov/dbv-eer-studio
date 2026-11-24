// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
//
// Smoke test de extremo a extremo del editor completo (v1.8.0, SPECIFICATIONS §3.11) con
// Playwright sobre el servidor de desarrollo de Vite, que el propio script arranca y detiene.
// Cubre lo que los tests unitarios no pueden (no hay jsdom): la orquestación de React.
//
// Uso: node scripts/smoke-editor.mjs
import { chromium } from 'playwright';
import { createServer } from 'vite';

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
};

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:5199/');
  await page.waitForSelector('textarea');

  const canvas = () => page.locator('svg.h-full.w-full');
  const editor = () => page.locator('textarea').first();
  const code = () => editor().inputValue();
  // El parser compila con 300 ms de retardo: se espera a que el DSL llegue al dibujo.
  const settle = () => page.waitForTimeout(700);
  const tab = name => page.getByRole('button', { name, exact: true }).click();
  const relationalTables = async () => {
    await tab('Modelo Relacional');
    await settle();
    const names = await page.locator('[data-table-name]').evaluateAll(els => els.map(e => e.getAttribute('data-table-name')));
    await tab('Diagrama EER');
    await settle();
    return names;
  };
  const nodeText = label => canvas().locator('text').filter({ hasText: new RegExp(`^${label}$`) }).first();

  // ---------- L1: el relacional sigue al EER (antes iba un cambio por detrás) ----------
  await settle();
  check('el relacional inicial incluye DEPARTAMENTO', (await relationalTables()).includes('DEPARTAMENTO'));

  await nodeText('DEPARTAMENTO').click({ force: true });
  await page.keyboard.press('Delete');
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await settle();
  check('borrar una entidad la quita del DSL', !(await code()).includes('ent DEPARTAMENTO'));
  check('L1: borrar una entidad quita su tabla del relacional', !(await relationalTables()).includes('DEPARTAMENTO'));

  // ---------- H: deshacer/rehacer ----------
  await canvas().click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('Control+z');
  await settle();
  check('Ctrl+Z en el lienzo recupera la entidad borrada', (await code()).includes('ent DEPARTAMENTO'));
  check('… y su tabla vuelve al relacional', (await relationalTables()).includes('DEPARTAMENTO'));
  await page.keyboard.press('Control+y');
  await settle();
  check('Ctrl+Y rehace el borrado', !(await code()).includes('ent DEPARTAMENTO'));
  await page.getByRole('button', { name: 'Deshacer (Ctrl+Z)' }).click();
  await settle();
  check('el botón Deshacer de la barra también funciona', (await code()).includes('ent DEPARTAMENTO'));

  const before = await code();
  await editor().click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type('\nent TECLEADA', { delay: 30 });
  check('lo tecleado llega al DSL', (await code()).includes('ent TECLEADA'));
  await page.keyboard.press('Control+z');
  check('Ctrl+Z en el panel de código deshace la ráfaga tecleada de una vez', (await code()) === before);

  // ---------- L1: Limpiar vacía también el relacional ----------
  await page.getByRole('button', { name: 'Limpiar' }).first().click();
  await page.getByRole('button', { name: 'Borrar Todo' }).click();
  await settle();
  check('Limpiar vacía el DSL', (await code()).trim() === '');
  check('L1: Limpiar vacía el relacional', (await relationalTables()).length === 0);
  await canvas().click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('Control+z');
  await settle();
  check('Limpiar se puede deshacer', (await code()).includes('ent EMPLEADO'));

  // ---------- I: relación ternaria desde el formulario ----------
  await page.getByRole('button', { name: /^Relación$/ }).click();
  await canvas().click({ position: { x: 900, y: 650 } });
  const modal = page.locator('div.fixed.inset-0').filter({ hasText: 'Entidad 1' });
  await modal.locator('input[type="text"]').first().fill('PARTICIPA');
  await modal.getByRole('button', { name: /Añadir entidad/ }).click();
  const entitySelects = modal.locator('select').filter({ has: page.locator('option', { hasText: 'EMPLEADO' }) });
  await entitySelects.nth(0).selectOption('EMPLEADO');
  await entitySelects.nth(1).selectOption('PROYECTO');
  await entitySelects.nth(2).selectOption('DEPENDIENTE');
  await modal.locator('input[placeholder*="Supervisor"]').first().fill('Responsable');
  await modal.getByRole('button', { name: 'Añadir', exact: true }).click();
  await settle();
  const dsl = await code();
  check('la ternaria se crea con tres enlaces', (dsl.match(/^link \w+ PARTICIPA /gm) ?? []).length === 3, dsl.split('\n').filter(l => l.includes('PARTICIPA')).join(' | '));
  check('el rol del formulario llega al DSL', dsl.includes('role:Responsable'));
  check('el rol se dibuja en el lienzo', await canvas().locator('text').filter({ hasText: /^Responsable$/ }).isVisible());

  // ---------- C: atributos compuestos (línea dibujada y mapeo) ----------
  await editor().fill(`ent CLIENTE (300, 300)
key_att Dni -> CLIENTE (200, 200)
att Direccion -> CLIENTE (400, 200)
att Calle -> Direccion (350, 100)
att Numero -> Direccion (450, 100)`);
  await settle();
  const lines = await canvas().locator('line').count();
  check('C: se dibujan las líneas del compuesto a sus componentes', lines >= 4, `${lines} líneas`);
  await tab('Modelo Relacional');
  await settle();
  const relationalDsl = await editor().inputValue();
  check('C: CLIENTE tiene CALLE y NUMERO, no DIRECCION', /CALLE/.test(relationalDsl) && /NUMERO/.test(relationalDsl) && !/\bDIRECCION\b/.test(relationalDsl));

  // ---------- C desde el formulario: propietario preseleccionado y componente de un compuesto ----------
  await tab('Diagrama EER');
  await settle();
  await nodeText('Direccion').click({ force: true });
  await page.getByRole('button', { name: /^Atributo$/ }).click();
  await canvas().click({ position: { x: 900, y: 200 } });
  const attrModal = page.locator('div.fixed.inset-0').filter({ hasText: 'Pertenece a' });
  const ownerSelect = attrModal.locator('select').nth(1);
  check('el atributo seleccionado aparece ya en «Pertenece a»', (await ownerSelect.inputValue()) === 'Direccion');
  await attrModal.locator('input[type="text"]').first().fill('Piso');
  await attrModal.getByRole('button', { name: 'Añadir', exact: true }).click();
  await settle();
  check('el componente creado por formulario cuelga del compuesto', (await code()).includes('att Piso -> Direccion'));
  await nodeText('CLIENTE').click({ force: true });
  await page.getByRole('button', { name: /^Atributo$/ }).click();
  await canvas().click({ position: { x: 900, y: 450 } });
  check('con una entidad seleccionada, aparece la entidad', (await attrModal.locator('select').nth(1).inputValue()) === 'CLIENTE');
  await attrModal.getByRole('button', { name: 'Cancelar' }).click();
  await tab('Modelo Relacional');
  await settle();

  // ---------- L3: tipo editado en el relacional sobrevive a un cambio del EER ----------
  await editor().fill(relationalDsl.replace(/CALLE VARCHAR2\(100\)/, 'CALLE VARCHAR2(60)'));
  await settle();
  await tab('Diagrama EER');
  await settle();
  await editor().fill(`${await code()}\natt Telefono -> CLIENTE (500, 300)`);
  await settle();
  await tab('Modelo Relacional');
  await settle();
  const after = await editor().inputValue();
  check('L3: el tipo editado se conserva al regenerar', after.includes('CALLE VARCHAR2(60)') && after.includes('TELEFONO'));

  // ---------- F: pantalla completa también en la edición web ----------
  await page.getByRole('button', { name: 'Pantalla completa' }).click();
  await page.waitForTimeout(200);
  check('F: la edición web entra en pantalla completa', await page.evaluate(() => document.fullscreenElement !== null));
  await page.getByRole('button', { name: 'Salir de pantalla completa' }).click();
  await page.waitForTimeout(200);
  check('F: y sale', await page.evaluate(() => document.fullscreenElement === null));

  // ---------- Recursiva: dos líneas paralelas, sin claves de React repetidas ----------
  const consoleWarnings = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleWarnings.push(m.text()); });
  await tab('Diagrama EER');
  await editor().fill(`ent EMPLEADO (300, 300)
rel SUPERVISA (300, 500)
link EMPLEADO SUPERVISA "1" role:Supervisor
link EMPLEADO SUPERVISA "N" role:Supervisado`);
  await settle();
  const xs = await canvas().locator('line').evaluateAll(ls => ls.map(l => Number(l.getAttribute('x1'))));
  check('recursiva: las dos líneas se dibujan separadas', new Set(xs.map(x => Math.round(x))).size >= 2, xs.join(','));
  check('recursiva: sin avisos de claves de React duplicadas', !consoleWarnings.some(w => /same key/i.test(w)), consoleWarnings.join(' | '));

  check('sin errores de JavaScript en la página', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
  await server.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
process.exit(failed.length > 0 ? 1 : 0);
