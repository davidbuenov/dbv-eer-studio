---
dependencies:
  - "Fase 2 (Exportar SVG del Modelo Relacional) depende de que la Fase 1 (i18n) esté completada: el exportador debe leer texto ya traducido (nombres de columna visibles, `stepTitle` si se incluye en el pie de tarjeta) desde la misma fuente `t()`/diccionario en lugar de duplicar strings en español."
  - "Ninguna dependencia externa nueva (sin `react-i18next`, sin `html-to-image`, sin librerías de renderizado SVG) — ver ADR en `memory.md`."
risks:
  - "Refactor de `StepTrace` (`src/types/relational.ts`) de texto pre-formateado a `{ stepNumber, stepKey, params }` toca 4 archivos que lo consumen (`eerToRelational.ts`, `relationalParser.ts`, `RelationalViewer.tsx`, `StepInspectorModal.tsx`) — riesgo de romper el pie de tarjeta o el modal Inspector si algún consumidor no se actualiza. Mitigación: hacer el cambio de tipo en un solo commit atómico y correr `relationalToSQL.test.ts` + verificación visual manual antes de continuar."
  - "El texto pedagógico interpolado (~40 plantillas en `eerToRelational.ts`, pasos 1-9 incluidas variantes 8A-8D y 9.1-9.2) es el bloque de mayor volumen y mayor riesgo de errores de traducción/interpolación rota (placeholders `${tableName}` mal colocados en la frase en inglés). Mitigación: traducir paso a paso, verificando cada uno contra un ejemplo real en el Inspector antes de pasar al siguiente."
  - "Reconstrucción manual del SVG del Modelo Relacional (Fase 2) duplica estilos visuales (colores Tailwind → hex, dimensiones) que ya existen en `RelationalViewer.tsx` — riesgo de que ambas representaciones diverjan con el tiempo si se cambia el estilo de las tarjetas en un sitio y no en el otro. Mitigación: extraer las constantes de dimensión (`CARD_WIDTH`, `HEADER_HEIGHT`, `ROW_HEIGHT`, `FOOTER_HEIGHT`) y la paleta de colores a un módulo compartido que consuman ambos renderers, en vez de repetir los valores."
  - "`SAMPLE_CODE` (`src/constants/index.ts`) permanece en español por decisión consciente — riesgo de inconsistencia si un usuario cambia a inglés y ve el ejemplo de bienvenida en español. Aceptado explícitamente, documentado aquí y en `memory.md`, no bloquea el resto del plan."
rollback_strategy: "Cada fase es un conjunto de commits independiente y reversible con `git revert` sin afectar a la otra: la Fase 1 (i18n) no modifica el formato de persistencia `.eer` (verificado: `stepTrace` nunca se serializa, ver ADR en `memory.md`), por lo que revertirla no corrompe archivos guardados por usuarios entre medias. La Fase 2 (exportación SVG) es aditiva pura (nuevo archivo + nuevo botón condicionado a una pestaña) y no toca ningún flujo existente; revertirla equivale a eliminar el botón y el archivo nuevo sin efectos secundarios."
---

# Plan de Implementación: Internacionalización (ES/EN) + Exportación SVG del Modelo Relacional

> **Fase `/plan`** · Aprobado el alcance con el usuario: i18n completa (UI estática + texto pedagógico de los 9 pasos) y orden secuencial i18n → SVG.
> Ver Adversarial Architect Review y ADRs relacionados en `dbv-specs-ops/memory.md` (entradas 2026-08-23 "StepTrace pasa a datos estructurados" e "i18n sin librería externa").

## Contexto de la investigación previa

- No existe ningún sistema de i18n en el proyecto (`package.json` no tiene `react-i18next`/`i18next`). Todo el texto está hardcodeado en español.
- ~150-180 cadenas de UI estática repartidas en 12 componentes (mayor densidad en `ModalHelp.tsx` y `ModalProperties.tsx`).
- El texto pedagógico de los 9 pasos (`eerToRelational.ts`, ~40 plantillas) es el bloque más costoso: interpola nombres reales de tabla/entidad dentro de frases en español ya formateadas.
- `stepTrace` nunca se persiste en el DSL/`.eer` (verificado en `relationalParser.ts:49-52`) — se regenera siempre en memoria, así que el refactor de tipos no rompe archivos guardados.
- El botón "Exportar SVG" actual (`EERDiagramer.tsx:429-441` y `588-591`) solo existe en la pestaña EER porque ese `<svg>` es nativo (`NodeRenderer.tsx`/`LinkRenderer.tsx`). En la pestaña Relacional, las líneas de FK ya son SVG real (`RelationalViewer.tsx:312-443`) pero las tarjetas son `<div>` HTML — no hay ningún `foreignObject` ni utilidad de conversión HTML→SVG en el proyecto.
- Todos los datos de layout necesarios para reconstruir las tarjetas como SVG puro ya existen (`table.x`/`y`, `getTableHeight()`, `getAnchorPortPosition()`, `getOptimalSides()`, constantes de dimensión) — no falta ningún dato, solo el renderer alternativo.

---

## Fase 1 — Internacionalización (ES/EN)

### 1.1 Infraestructura
- Crear `src/i18n/` con `LanguageContext.tsx` (Context + `LanguageProvider`), hook `useLanguage()` (devuelve `{ lang, setLang, t }`), y diccionarios planos `es.ts`/`en.ts` (clave → string, interpolación simple tipo `{{nombre}}`).
- Persistir el idioma elegido en `localStorage`.
- Inyectar `<LanguageProvider>` en `App.tsx` (componente trivial, sin lógica propia — punto de inyección natural).
- Añadir selector de idioma (ES/EN) en la cabecera de `EERDiagramer.tsx`, junto a los botones existentes (Créditos/Ayuda).

### 1.2 Refactor de `StepTrace` (dato estructurado, no texto)
- `src/types/relational.ts`: cambiar `StepTrace` de `{ stepNumber, stepTitle, description }` (strings ya formateados) a `{ stepNumber, stepKey, params: Record<string, string> }`.
- `src/utils/relational/eerToRelational.ts`: sustituir cada literal `stepTitle`/`description` (pasos 1-9, incluidas variantes 8A-8D y 9.1-9.2) por su `stepKey` correspondiente + `params` con los nombres reales interpolados (p. ej. `{ tableName, entityName }`).
- `src/utils/relational/relationalParser.ts`: el placeholder `'Tabla Relacional DSL'` (línea ~51) pasa a usar su propia `stepKey` fija.
- Crear diccionario pedagógico dedicado (p. ej. `src/i18n/steps.ts`) con las ~40 claves es/en y su interpolación.

### 1.3 Consumidores del texto pedagógico
- `src/components/relational/RelationalViewer.tsx` (pie de tarjeta, `stepTrace.stepTitle`): sustituir por `t(stepTrace.stepKey, stepTrace.params)`.
- `src/components/relational/StepInspectorModal.tsx`: migrar `FORMAL_STEPS` (9 entradas fijas) al diccionario, y la "Inspección Activa" a `t()` con los `params` de la tabla/columna seleccionada.

### 1.4 Componentes UI estáticos
Traducir, en este orden de prioridad (mayor densidad de texto primero): `ModalHelp.tsx` → `ModalProperties.tsx` → `EERDiagramer.tsx` (cabecera/menús) → `Toolbar.tsx` → `ModalCredits.tsx` → `ModalAIPrompt.tsx` → `SQLPreviewModal.tsx` → `CodePanel.tsx` → `ModalClearConfirm.tsx`/`ModalDeleteConfirm.tsx` → `Canvas.tsx` (tooltips de zoom).

### 1.5 Decisión documentada
`SAMPLE_CODE` (`src/constants/index.ts`) permanece en español — es contenido de ejemplo de dominio universitario (nombres de entidades como `EMPLEADO`, `DEPARTAMENTO`), no texto de interfaz. No se traduce en esta fase.

### 1.6 Verificación
- `relationalToSQL.test.ts` debe seguir en verde (no depende de `stepTrace`, pero confirma que el refactor de tipos no rompe la generación SQL).
- Verificación visual manual: cambiar idioma en la UI y confirmar que Toolbar, modales, e Inspector de 9 Pasos muestran texto en inglés correctamente interpolado.
- Entrada en `CHANGELOG.md` (`[Sin publicar]`).

---

## Fase 2 — Exportar SVG del Modelo Relacional (depende de Fase 1)

### 2.1 Módulo compartido de estilo/dimensiones
- Extraer `CARD_WIDTH`, `HEADER_HEIGHT`, `ROW_HEIGHT`, `FOOTER_HEIGHT` y la paleta de colores (indigo header, resaltado PK/FK) de `RelationalViewer.tsx` a un módulo compartido (p. ej. `src/utils/relational/relationalStyle.ts`), consumido por ambos renderers para evitar divergencia futura.

### 2.2 Generador SVG
- Crear `src/utils/relational/exportRelationalSVG.ts`: función pura `exportRelationalToSVG(schema, t)` que:
  1. Reconstruye cada tarjeta con `<rect>` (cabecera/filas/pie) + `<text>` (nombre de tabla, columnas con iconos PK/FK simplificados a texto o glifo SVG básico), usando `table.x`/`y` y `getTableHeight()`.
  2. Reutiliza/porta la lógica de flechas FK ya existente (`RelationalViewer.tsx:312-443`, incluidos `<defs>`/marcadores) tal cual, ya es SVG válido.
  3. Calcula `viewBox`/`width`/`height` a partir de `maxX`/`maxY`.
  4. Usa `t()` (Fase 1) para el texto traducible (pie de tarjeta con `stepTitle` si se decide incluirlo).

### 2.3 Integración UI
- `EERDiagramer.tsx`: añadir botón "Exportar SVG" condicionado a `activeTab === 'relational'` (actualmente el botón solo existe para `'eer'`), con handler propio que llama a `exportRelationalToSVG()` y serializa con el mismo patrón `Blob` + `<a download>` que `handleExport` (líneas 429-441).

### 2.4 Verificación
- Prueba visual manual: exportar el `.svg`, abrirlo en el navegador y en un editor vectorial (Inkscape/Illustrator si está disponible), comparar con la vista en pantalla.
- Marcar como resuelta la deuda técnica "Exportar SVG del Modelo Relacional" en `task.md`.
- Entrada en `CHANGELOG.md` (`[Sin publicar]`).

---

## Fuera de alcance de este plan
- Traducción de `SAMPLE_CODE` (decisión consciente, ver 1.5).
- Exportación a PNG/otros formatos de imagen del Modelo Relacional (solo SVG, como pide la deuda técnica original).
- Añadir más idiomas además de ES/EN.
