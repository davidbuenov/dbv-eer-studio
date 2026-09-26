---
dependencies:
  - "react: ^19.2.0"
  - "lucide-react: ^0.555.0"
  - "vitest (dev) — sin dependencias nuevas"
risks:
  - "Renombrado por texto que corrompa referencias ajenas (atributos homónimos en varias entidades, marcadores 'd'/'o'/'u' de spec/union)."
  - "Reescritura de líneas con lineIndex obsoletos si el DSL EER está en estado inválido (Stale-while-error congela nodos antiguos)."
  - "Pérdida silenciosa de la política ON DELETE / nulabilidad en la ida y vuelta EER → DSL relacional → SQL; ORA-00905 si se emite 'ON DELETE NO ACTION' literal en Oracle."
  - "Resaltado de línea desalineado con soft-wrap, o que se apague al enfocar el textarea (onEditStart deselecciona)."
  - "El click posterior a un arrastre de grupo colapsa la selección múltiple."
rollback_strategy: "Todo el ciclo va en un único commit sobre v1.5.0 (d82ca4b). Rollback = git revert del commit v1.6.0. No hay migración de datos: los ficheros .eer existentes siguen siendo válidos (la sintaxis [ATTR] es opcional)."
---

# Plan de Implementación v1.6.0: Usabilidad del Editor EER y Rigor del Mapeo

Implementa `SPECIFICATIONS.md §3.7` (propuestas del colaborador Enrique Soler Castillo) y el diseño de `ARCHITECTURE.md §6`.

## Adversarial Architect Review

```xml
<architect_review>
  <builder>Implementar §3.7 en 5 bloques: motor relacional (PK con key_att de relación, atributos del Paso 3, política ON DELETE/nulabilidad, DSL relacional y SQL multi-dialecto); [ATTR] en spec; utilidades puras de edición de DSL; UI (modo edición, "Añadir y crear otro", atributos de relación, resaltado en CodePanel, selección múltiple y arrastre de grupo); documentación.</builder>
  <adversary>(1) Renombrar una ENTIDAD o un atributo por texto puede corromper líneas link ajenas o el comando; los atributos no son únicos. (2) Con el DSL EER inválido, Stale-while-error congela nodos con lineIndex obsoletos: editar/borrar reescribiría líneas equivocadas. (3) La ida y vuelta al DSL relacional perdía NOT NULL de FKs y el compilador ponía CASCADE por defecto; Oracle rechaza 'ON DELETE NO ACTION'. (4) Soft-wrap desalinea el resaltado; enfocar el textarea deselecciona. (5) El click tras arrastrar un grupo colapsa la selección.</adversary>
  <builder>(1) renameReferences por tokens, nunca el token 0, fuera de comillas/coordenadas; atributos: solo si la etiqueta es única. (2) Edición y borrado bloqueados mientras isValid === false. (3) Generador emite NOT NULL + ON DELETE explícito; compilador acepta 4 acciones con NO ACTION por defecto; SQL Oracle omite la cláusula para NO ACTION/RESTRICT; tests de ida y vuelta. (4) wrap="off" + capa de fondo, sin focus. (5) didDragRef con umbral.</builder>
  <adversary>Riesgo residual: al editar una relación/especialización/unión, sus líneas link se reagrupan bajo la declaración (se pierde el orden original).</adversary>
  <builder>Aceptado conscientemente (el orden de link no tiene semántica) y registrado en memory.md. La nudge anti-solapamiento del DSL solo actúa ante coordenadas idénticas.</builder>
</architect_review>
```

## Cambios Propuestos

### Bloque 1 — Motor relacional (rigor del mapeo)
- `src/utils/relational/eerToRelational.ts`: helper `mapRelationshipAttributes(rel, table, step)` reutilizado por Pasos 3/4/5/7 (key_att ⇒ PK + NOT NULL solo en 5/7); Paso 3 coloca la FK en el lado total real y mapea atributos; política `onDelete` + nulabilidad por paso; Paso 8A añade la columna del atributo definidor.
- `src/i18n/steps.ts`: claves `STEP3_ATTR`, `STEP5_ATTR_PK`, `STEP7_ATTR_PK`, `STEP8_DEFINING_ATTR`; textos de restricción FK que explican la acción referencial (`{{action}}`).
- `src/utils/relational/relationalCodeGenerator.ts`: `NOT NULL` en FKs obligatorias y `ON DELETE <acción>` siempre.
- `src/utils/relational/relationalCompiler.ts`: acepta `CASCADE | SET NULL | RESTRICT | NO ACTION`; por defecto `NO ACTION`.
- `src/utils/relational/relationalToSQL.ts`: `ON DELETE` por dialecto (Oracle: solo CASCADE / SET NULL).

### Bloque 2 — Atributo definidor
- `src/types/index.ts`: `NodeData.definingAttribute`, `LinkData.lineIndex`.
- `src/types/compiler.ts`: códigos `INVALID_DEFINING_ATTRIBUTE`, `KEY_ATTRIBUTE_ON_NON_MN_RELATIONSHIP`.
- `src/utils/compiler.ts`: parseo de `[ATTR]`, etiqueta en la arista, `lineIndex` en enlaces, nudge de atributos con coordenadas duplicadas, linter de key_att en relación no M:N.

### Bloque 3 — Utilidades puras
- `src/utils/layout.ts` (nuevo): `findFreePosition`.
- `src/utils/dslEditing.ts` (nuevo): `getOwnedLineIndices`, `renameReferences`, `replaceElementBlock`.
- `src/utils/codeGenerator.ts`: coordenadas opcionales en spec/union y `definingAttribute`.

### Bloque 4 — UI
- `src/hooks/useModalState.ts`: `editingNodeId`.
- `src/components/ModalProperties.tsx`: modo edición, checkboxes débil/identificativa, atributo definidor, propietario = entidades + relaciones, botón "Añadir y crear otro".
- `src/hooks/useCanvasInteraction.ts`: selección múltiple, arrastre de grupo, atributos siguen al propietario (Alt = solo el nodo).
- `src/components/Canvas.tsx`, `NodeRenderer.tsx`: `selectedNodeIds`, doble clic, clic en fondo.
- `src/components/CodePanel.tsx`: resaltado de líneas.
- `src/components/ModalDeleteConfirm.tsx`: borrado múltiple.
- `src/EERDiagramer.tsx`: orquestación (edición, crear otro, resaltado, teclado F2/Enter/Supr).
- `src/components/Toolbar.tsx` + i18n: pista de gestos actualizada.

### Bloque 5 — Documentación
- `ModalHelp.tsx` (corrige sintaxis de atributos, añade `[ATTR]` y ON DELETE), `ModalAIPrompt.tsx`, `README.md`/`README.en.md` (gestos, sintaxis, tabla de 9 pasos, agradecimiento a Enrique Soler Castillo), `CHANGELOG.md [Sin publicar]`, `memory.md`.

## Plan de Verificación
- Tests nuevos: `dslEditing.test.ts`, `layout.test.ts`, ampliación de `compiler.test.ts`, `eerToRelational.test.ts` (CIRCULA con VUELTA, política ON DELETE por paso, Paso 3 con atributos, atributo definidor), `relationalCompiler.test.ts` y `relationalToSQL.test.ts` (4 acciones, Oracle sin NO ACTION, ida y vuelta).
- `npm run lint`, `npm test`, `npm run build`.
- Validación manual por el usuario en navegador antes de `/ship`.

---

# Anexo v1.6.0 — Centro de Ayuda Unificado (`SPECIFICATIONS.md §3.8`, `ARCHITECTURE.md §7`)

## Adversarial Architect Review

```xml
<architect_review>
  <builder>Fusionar ModalHelp, StepInspectorModal, ModalAIPrompt y ModalCredits en HelpCenter con 5 pestañas, botón Ayuda + F1, acceso contextual desde cada tabla, última pestaña recordada, ES/EN completo.</builder>
  <adversary>(1) is_packaged_app del updater consultado a destiempo. (2) F1 abre la ayuda nativa del navegador/WebView2. (3) La guía de Sintaxis ya tenía ejemplos que el compilador no reconoce. (4) Tabla inspeccionada obsoleta al reabrir la ayuda. (5) localStorage bloqueado. (6) Traducir el prompt IA podría traducir palabras clave del DSL.</adversary>
  <builder>(1) AboutTab solo montada si está activa. (2) preventDefault en F1. (3) Ejemplos como datos + test de compilación de cada ejemplo. (4) openHelp() sin tabla la limpia. (5) try/catch con valor por defecto. (6) Prompt EN con los mismos comandos DSL, verificado por test; ADR i18n actualizado.</builder>
</architect_review>
```

## Cambios
- Nuevo `src/components/help/` (HelpCenter + 5 pestañas + `syntaxExamples.ts`), `src/hooks/useHelpCenter.ts`, `src/i18n/aiPrompt.ts`, `src/globals.d.ts`.
- `vite.config.ts`: `define.__APP_VERSION__` desde `package.json`.
- `EERDiagramer.tsx`: botón Ayuda + F1; acceso contextual desde `RelationalViewer`; se retiran los 4 botones y modales antiguos.
- `useModalState.ts`: fuera `showHelp`/`showCredits`/`showAIPrompt`.
- `Toolbar.tsx`: se elimina la pista de gestos.
- i18n ES/EN: claves `help.*`; limpieza de claves huérfanas.
- Eliminados: `ModalHelp.tsx`, `ModalAIPrompt.tsx`, `ModalCredits.tsx`, `relational/StepInspectorModal.tsx`.

## Verificación
- Tests: cada ejemplo de sintaxis compila; prompts ES/EN contienen los mismos comandos DSL; persistencia de pestaña tolerante a fallos.
- Lint, tests, build, smoke Playwright (F1, pestañas, acceso contextual, cambio de idioma) y `.exe` recompilado.
