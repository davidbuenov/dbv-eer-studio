---
dependencies:
  - "Sin dependencias npm nuevas (react ^19, lucide-react, vitest, playwright ya presentes)"
  - "Fullscreen API nativa del navegador (edición Moodle)"
risks:
  - "Resolver extremos de enlace y parentEntity a ids puede afectar a dslEditing, deleteNode, la herramienta local correccion/ y el bloque de entrega Moodle."
  - "Dos especializaciones con la misma etiqueta: link d X debe seguir asociándose a la primera."
  - "FK sin tipo en el DSL relacional: orden y ciclos al resolver el tipo desde la columna referenciada."
  - "Ctrl+Z en el textarea: el historial nativo y el propio se pisan; deshacer reset() en Moodle y el autoguardado."
  - "Pantalla completa no disponible si el iframe del reproductor SCORM no tiene allowfullscreen."
  - "Cambio de salidas para diagramas de la v1.7.0 fuera de las correcciones previstas."
rollback_strategy: "Un commit por bloque (B0-B8), revertibles por separado con git revert. Las fixtures de compatibilidad de B0 fijan el comportamiento de la v1.7.0: cualquier diferencia no listada en el plan bloquea el bloque. Los formatos de fichero nuevos (.eer) solo añaden líneas que la v1.7.0 ignora."
---
# Plan v1.8.0 — Notación EER completa, claves y modelo relacional, deshacer y pantalla completa Moodle

## Contexto
Implementa `dbv-specs-ops/docs/SPECIFICATIONS.md §3.11` (A–L), especificado el 2026-11-24 a partir de:
- los comentarios de un usuario (clave parcial, compuestos sin líneas, especialización parcial);
- el segundo correo de Enrique Soler (borrar entidad, FK compuestas, tipos, claves compuestas o alternativas);
- el uso real de la edición Moodle en la UMA (los paneles de Moodle quitan ancho);
- mejoras aceptadas por el autor (roles, deshacer, n-arias por interfaz, linter de entidades débiles, repaso de Elmasri).

Todos los fallos se reprodujeron con pruebas temporales. Hay tres decisiones del autor:
- **Especialización:** `spec … partial` (sin marca = total).
- **Roles:** `role:Nombre`.
- **Claves:** varios `key_att` siguen formando una PK compuesta, y se añade `key_att … unique`. Los tipos relacionales se conservan y se propagan a las FK.

**Principio rector:** compatibilidad con la v1.7.0. Todo cambio es aditivo; los diagramas existentes compilan igual y solo cambian las salidas que hoy son erróneas.

Plan **complejo**: más de 3 ficheros y más de 150 líneas. Primer paso del build: volcar este plan a `dbv-specs-ops/implementation_plan.md`, sustituyendo el de la v1.7.0, con frontmatter YAML:
- **`dependencies`:** sin dependencias npm nuevas; Fullscreen API nativa.
- **`risks`:** ver la revisión adversarial.
- **`rollback_strategy`:** un commit por bloque, revertibles por separado. Las fixtures de compatibilidad fijan el comportamiento de la 1.7.

## Adversarial Architect Review
- **Builder:** guardar en el compilador los ids resueltos (no las etiquetas) en `link.source/target` y en `parentEntity` arregla los compuestos en el dibujo y en el mapeo a la vez. El resto son añadidos:
  - en el DSL EER: `partial_key_att`, `partial`, `role:`, `unique`;
  - en el DSL relacional: `FK (…)` de tabla, `UNIQUE`, FK sin tipo;
  - un historial de deshacer como función pura;
  - pantalla completa con la API nativa.
- **Adversary:**
  1. Las *etiquetas* de los enlaces las consumen `dslEditing` (`getOwnedLineIndices`, `describeNodeForEdit`), `deleteNode.ts` (`isSharedAttribute` por label), la herramienta de corrección (`correccion/`, fuera del repo, sobre `CompileResult`) y el bloque de entrega Moodle. Cambiarlas a ids puede romper la edición visual o la corrección de exámenes sin que falle ningún test del repo.
  2. Una `spec d` con id `d` y otra `d_12`: `link d X` debe seguir yendo a la primera (deuda ya conocida). Resolver «el último declarado» podría cambiar a cuál se asocia.
  3. Que los tipos de la FK se resuelvan desde la columna referenciada introduce orden y ciclos entre tablas del DSL relacional.
  4. Con Ctrl+Z en el `<textarea>`, el historial propio y el nativo pueden pisarse. En Moodle, un `reset()` deshecho puede resucitar un autoguardado ya borrado.
  5. Pantalla completa dentro del iframe del reproductor SCORM: si falta `allowfullscreen`, el botón no hace nada.
- **Builder (resolución):**
  1. La resolución a id solo se aplica cuando la referencia **no** es ya un id existente; el `resolveNodeRef` actual sigue valiendo. Los tests de `dslEditing` y `deleteNode` se ejecutan sin cambios. Se añade un test de ida y vuelta editar → regenerar con compuestos. Se avisa al autor de que revise `correccion/` (riesgo aceptado y registrado en `memory.md`).
  2. La regla «último declarado antes de la línea» solo se aplica a **atributos** ambiguos. Para especializaciones se mantiene «primero por id».
  3. La resolución se hace en una segunda pasada, sobre el mapa de tablas ya compiladas y sin recursión: una FK apunta a una columna declarada con tipo. Si la columna destino es a su vez una FK sin tipo, se sigue la cadena con un límite y, si no se resuelve, el diagnóstico es `UNRESOLVED_FK_TYPE`.
  4. `CodePanel` hace `preventDefault` de Ctrl+Z/Y y delega en el historial común. `reset()` y *Limpiar* son pasos normales del historial, y deshacer vuelve a escribir el autoguardado en el siguiente cambio, que es el comportamiento deseado.
  5. `document.fullscreenEnabled` decide: si es `false`, se muestra un aviso con la alternativa (*Nueva ventana*) en lugar de no hacer nada. Se valida con el autor en el Moodle 5 de la UMA y en SEB antes del `/ship`.

## Bloques de implementación (un commit cada uno; tests en rojo antes del fix en las correcciones)

### B0 — Red de seguridad de compatibilidad
- `src/compat/v170Fixtures.test.ts`: con el código **actual**, antes de tocar nada, se generan instantáneas para `SAMPLE_CODE` (`src/constants/index.ts`), los ejemplos de `src/components/help/syntaxExamples.ts` y la plantilla del hotel usada por `build:moodle:release`. Cada instantánea guarda:
  - nodos (id, tipo, label) y enlaces;
  - tablas, columnas, PK y FK de `eerToRelational`;
  - SQL Oracle (`relationalToSQL`) sin la fecha.
- A partir de ahí, cualquier diferencia debe ser una corrección listada en este plan.
- Constante única `ATTRIBUTE_NODE_TYPES` + `isAttributeType` en `src/types/index.ts`. Sustituye a las listas de `deleteNode.ts:78`, `dslEditing.ts:44`, `layout.ts:50`, `eerToRelational.ts:85/91`, `compiler.ts:93` y `ModalDeleteConfirm`. Unifica también `AttributeKind`, hoy duplicado en `codeGenerator.ts:17` y `dslEditing.ts:25`.

### B1 — Correcciones de fallos (C, L1, L2, L5, E-mapeo y dos menores)
- **C, compuestos** (`src/utils/compiler.ts`): segunda pasada que normaliza los extremos de enlace y `parentEntity` al id. Si la referencia ya es un id existente, se deja igual. Si es una etiqueta, se resuelve en este orden:
  - entidades, relaciones y especializaciones: la primera;
  - atributos: el último declarado antes de la línea, con aviso `AMBIGUOUS_ATTRIBUTE_REFERENCE` si hay varios.

  Tests:
  - `CLIENTE(DNI, CALLE, NUMERO)`;
  - la línea se dibuja (el enlace resuelve a un id existente);
  - `link Direccion Calle`;
  - compuesto dentro de compuesto.
- **L1, desfase EER → relacional:**
  - `src/hooks/useEERParser.ts` devuelve `compiledCode`.
  - `EERDiagramer.tsx:112-128` usa `compiledCode` como clave y quita la guarda `nodes.length > 0`, de modo que un EER vacío vacía el modelo relacional.
  - Se verifica en el smoke de Playwright: borrar una entidad → la tabla desaparece; *Limpiar* → modelo relacional vacío.
- **L2, FK compuestas y L5, UNIQUE:**
  - `src/types/relational.ts`: `RelationalTable.uniqueConstraints?: string[][]`.
  - `src/utils/relational/relationalCompiler.ts`: añadir las líneas de tabla `FK (a, b) -> T(x, y) [ON DELETE …]` y `UNIQUE (a, b)`, la palabra `UNIQUE` en columna y el aviso `FK_NOT_REFERENCING_KEY` (la FK no cubre la PK completa ni una UNIQUE del destino). Además:
    - los nombres de restricción se alinean con los del motor (`FK_<T>_<DEST>`, con sufijo si se repiten);
    - el tipo de columna admite espacios dentro de paréntesis: hoy `NUMBER(12, 2)` vuelve como `NUMBER(12,`.
  - `relationalCodeGenerator.ts`: las FK de más de una columna se escriben a nivel de tabla; se emite `UNIQUE`.
  - `relationalToSQL.ts`: se emiten `UNIQUE` y `CONSTRAINT UQ_…` en todos los dialectos.
  - `RelationalViewer.tsx:375-385` muestra una insignia UK; `exportRelationalSVG.ts:85-103` dibuja la marca UK.
  - Test de ida y vuelta: motor → DSL → compilador → SQL produce la misma FK compuesta y el mismo `UNIQUE` que el motor directo, incluida la 1:1 del Paso 3.
- **E-mapeo, recursivas:** helper `fkColumnName(prefix, pkName, takenNames)` en `eerToRelational.ts`, usado en los Pasos 3 (`:668`), 4 (`:723`), 5 (`:774/810`) y 7 (`:899`), y lo mismo para los nombres de restricción:
  - prefijo = rol si existe (B2) o, si no, nombre de la tabla;
  - si el nombre ya existe, sufijo `_2`.

  La recursiva M:N pasa a dar `EMPLEADO_DNI` + `EMPLEADO_DNI_2` y dos restricciones distintas. Ojo: `addColumn`/`addForeignKey` descartan duplicados por nombre, así que la unicidad se decide antes de llamarlos.
- **Menor:** `handleLoadFileContent` (`EERDiagramer.tsx:162`) acepta coordenadas negativas.

### B2 — Notación nueva (B, D, E, L4) en compilador, tipos, render, generadores y mapeo
- **`src/types/index.ts`:**
  - `NodeType` + `'partial_key_attribute'`;
  - `NodeData.isPartial?` (especialización) y `NodeData.isUnique?` (clave alternativa);
  - `LinkData.role?`.
- **`compiler.ts`:**
  - `partial_key_att`;
  - `partial`/`total` al final de `spec`, tras `[ATTR]`, y cualquier otra palabra da `INVALID_SPECIALIZATION_OPTION`;
  - `role:X` en `link` (vacío o inválido da `INVALID_ROLE`);
  - `unique` tras `key_att`.

  El enlace superclase–círculo se emite como `solid` si es parcial.
- **`NodeRenderer.tsx:86-101`:**
  - clave parcial: `<line strokeDasharray>` bajo el texto, con ancho estimado por longitud;
  - clave alternativa: subrayado + etiqueta «UK».

  Se amplía el comparador de `memo` (`:113-124`) con `isUnique`.
- **`LinkRenderer.tsx`:** rol en cursiva al 25 % del segmento desde la entidad. El comparador de `memo` incluye `role`.
- **`codeGenerator.ts`:** tipo `partial_key`; `partial` solo si la especialización no es total; `role:` por extremo; `unique`.
- **`dslEditing.ts`:** `describeNodeForEdit`/`applyElementEdit` leen y escriben estos campos (ida y vuelta en `dslEditing.test.ts`).
- **`eerToRelational.ts`:**
  - Paso 2: acepta `partial_key_attribute`.
  - Pasos 1/2: `isUnique` da `NOT NULL` + UNIQUE en lugar de PK; si la clave alternativa es compuesta, `uniqueConstraints`.
  - Rol como prefijo (helper de B1).
- **`layout.ts:87/94`:** dimensiones del nuevo tipo de nodo.

### B3 — Linter pedagógico (G)
- `lintWeakEntitiesAndRoles` en `compiler.ts`, junto a `lintKeyAttributesOnRelationships` (`:309`). Emite:
  - `WEAK_ENTITY_WITHOUT_IDENTIFYING_RELATIONSHIP`;
  - `WEAK_ENTITY_WITHOUT_PARTIAL_KEY`;
  - `KEY_ATTRIBUTE_ON_WEAK_ENTITY`;
  - `PARTIAL_KEY_ON_STRONG_ENTITY`;
  - `RECURSIVE_RELATIONSHIP_WITHOUT_ROLES`.

  Todos son `warning`, añadidos a `DiagnosticCode` (`src/types/compiler.ts:19-40`) y con claves `compiler.*` en `es.ts`/`en.ts`. Un test por código.
- **Cuidado:** el ejemplo por defecto (`SAMPLE_CODE`) tiene `DEPENDIENTE` sin clave parcial, así que ahora daría aviso. Se le añade `partial_key_att` (cambio de ejemplo, no de semántica) y su fixture de B0 se actualiza de forma explícita.

### B4 — Tipos relacionales conservados y propagados (L3)
- **`relationalCompiler.ts`:**
  - Columna FK sin tipo: se resuelve en la segunda pasada desde la columna referenciada (cadena con límite; `UNRESOLVED_FK_TYPE`).
  - Tipo explícito distinto en una FK: `FK_TYPE_MISMATCH`.
- **`relationalCodeGenerator.ts`:** escribe las FK sin tipo.
- **Función pura nueva** `src/utils/relational/typeOverrides.ts`:
  - `extractTypeOverrides(schemaEditado, schemaDerivado)`: columnas no FK cuyo tipo difiere del inferido.
  - `applyTypeOverrides(schema, overrides)`: también propaga a las FK del motor.
  - Serializar y leer las líneas `relational T.C : TIPO`.
- **`EERDiagramer.tsx`:**
  - estado `relationalTypeOverrides` junto a `relationalPositions`;
  - se actualiza en `handleRelationalCodeChange` válido;
  - se aplica en la derivación;
  - se guarda y carga en `getSaveContent`/`handleLoadFileContent`.
- Aviso visible en la pestaña relacional: «Los cambios distintos de tipos se pierden al modificar el EER».
- **Test:** cambiar el tipo de `CIRCUITO.NOMBRE`, regenerar desde el EER → se conserva y `COMPITE.CIRCUITO_NOMBRE` lo hereda; un fichero con la línea nueva se carga y la v1.7 la ignora (el comando `relational` se descarta).

### B5 — Deshacer / rehacer (H)
- **Función pura** `src/utils/codeHistory.ts`:
  - estado `{past, present, future, lastOrigin, lastAt}`;
  - acciones `commit(code, origin: 'canvas'|'typing', now)`, `undo`, `redo`;
  - las escrituras `typing` se agrupan si ocurren en menos de 1 s;
  - máximo 100 pasos.

  Tests exhaustivos en `codeHistory.test.ts`.
- **`src/hooks/useCodeHistory.ts`:** envoltorio fino con `useReducer` que devuelve `{code, setCode, setCodeFromTyping, undo, redo, canUndo, canRedo}`. Sustituye a:
  - `useState(SAMPLE_CODE)` en `EERDiagramer.tsx:66`;
  - el `useState` de `useExamSession.ts:30`, conservando el autoguardado (`codeRef`/`pagehide`).
- **`CodePanel.tsx`:** usa `setCodeFromTyping`; `onKeyDown` en el textarea hace `preventDefault` de Ctrl/Cmd+Z/Y/Shift+Z y llama a las props nuevas `onUndo`/`onRedo`.
- **Atajos globales:** en los listeners existentes de `EERDiagramer.tsx:314-340` y `MoodleExamApp.tsx:94-116`, fuera de los modales y antes de la guarda «typing».
- **Botones:** en `Toolbar.tsx` (props opcionales `onUndo`, `onRedo`, `canUndo`, `canRedo`, añadidas al comparador de `memo` `:123`), compartido por las dos ediciones.
- La regeneración del relacional no cambia: depende de `compiledCode`.

### B6 — Formulario: n-arias, rol, clave parcial, especialización parcial, clave alternativa (I)
- **`useModalState.ts:49-81`:** `selectedEntity1/2`, `cardinalityE1/2`, `customCard1/2` y `totalE1/2` pasan a ser `participants: ParticipantDraft[]` con `{entity, cardinality, customCardinality, isTotal, role}`, mínimo dos. Se añaden `specIsTotal` (por defecto `true`) e `isUnique`.
- **`dslEditing.ts`:**
  - `RelationshipEnd` gana `role?`;
  - `ElementEdit.ends` pasa a `RelationshipEnd[]` y siempre está presente;
  - desaparece la rama n-aria no editable (`:190-204`, `:252`, `:282`).
- **`codeGenerator.generateRelationshipCode`** recibe la lista.
- **`usePropertiesForm.ts`:** `buildFormElement` (`:153-194`), `openEdit` (`:103-122`) y se elimina `isNaryRelationship`.
- **`ModalProperties.tsx`:**
  - lista de `RelationshipEndFields` (`:350`) con campo *Rol* y botones *+ Añadir entidad* y quitar;
  - tipo *Clave parcial* en el selector (`:197-206`);
  - casilla *Clave alternativa (UNIQUE)* para claves;
  - casilla *Participación total* en la especialización (`:234-281`).
- Se retira la clave `modalProperties.naryNote`.
- **Tests de `dslEditing`:** crear y editar una ternaria con roles (ida y vuelta).

### B7 — Moodle: pantalla completa y barra adaptable (F)
- **`src/moodle/fullscreen.ts`:** funciones puras sobre un `Document` inyectable (`isSupported`, `toggle`), con test usando un documento simulado. Se añade el hook `useFullscreen` (escucha `fullscreenchange`).
- **`ExamActionsBar.tsx`:**
  - botón *Pantalla completa* / *Salir*;
  - si no hay soporte, `setStatus` con aviso `moodle.fullscreen.unavailable`;
  - por debajo de `xl`, los botones secundarios muestran solo icono, siempre con `aria-label` y tooltip;
  - el título tiene un ancho mínimo legible (`min-w-[8rem]`) o se oculta antes que los botones;
  - «Copiar para entregar» siempre visible.
- No hay portales: los modales ya están dentro del árbol y siguen visibles a pantalla completa.
- **Guía:** `docs/moodle/GUIA_PROFESOR.md` (y regenerar el PDF con Typst):
  - *Mostrar paquete = Nueva ventana*;
  - plegar los paneles de Moodle;
  - compatibilidad de paquetes (1.8 frente a 1.7);
  - comprobación SEB del botón.

### B8 — Repaso de Elmasri, documentación y cierre (J, K)
- `src/components/help/elmasriReference.ts`: diagrama con todas las construcciones. Se usa como ejemplo en la pestaña *Sintaxis* y en `elmasriReference.test.ts`. El test comprueba:
  - que compila sin errores;
  - el estilo esperado por construcción (doble, simple, discontinuo, rol, UK);
  - que el modelo relacional no tiene columnas ni restricciones duplicadas por tabla;
  - que el SQL Oracle incluye `UNIQUE` y la FK compuesta.
- **Ayuda:** ejemplos nuevos en `syntaxExamples.ts`, con el test de compilación existente. Atajos Ctrl+Z/Y en *Uso del editor*.
- **Prompt de IA** ES/EN: `src/i18n/aiPrompt.ts`.
- **Resto de documentación:**
  - README ES/EN;
  - `eer-to-relational-mapping.md`: compuestos, roles en recursivas, UNIQUE de la 1:1, claves alternativas;
  - `CHANGELOG.md [Sin publicar]`;
  - `ARCHITECTURE.md §9` ajustado a lo real;
  - `task.md`.
- **Limpieza:** `relationalParser.ts` es código muerto (nadie lo importa); se elimina en `/code-simplify`.

## Verificación
- **Por bloque:**
  - `npx vitest run`: los 162 tests actuales más los nuevos;
  - `npm run lint` y `npx tsc -b`;
  - `npm run build` y `npm run build:moodle`;
  - las fixtures de B0 solo cambian donde el plan lo dice. Los cambios esperados son:
    - compuestos expandidos;
    - recursiva M:N con columnas únicas;
    - `UNIQUE` en las 1:1;
    - `SAMPLE_CODE` con clave parcial;
    - FK sin tipo y de tabla en el DSL relacional.
- **Correcciones:** cada una con su test en rojo antes del fix.
- **Smoke Playwright** `scripts/smoke-editor.mjs` (nuevo, como `smoke-moodle.mjs`), sobre `npm run dev`:
  - crear ternaria por formulario;
  - borrar una entidad → desaparece su tabla;
  - *Limpiar* → modelo relacional vacío;
  - mover y borrar, y luego Ctrl+Z dos veces → vuelve el estado;
  - escribir en el panel de código y luego Ctrl+Z (deshace el bloque tecleado);
  - compuesto con líneas visibles;
  - cambiar el tipo en el relacional y luego cambiar el EER → el tipo se conserva y la FK lo hereda;
  - SQL con FK compuesta.
- **`scripts/smoke-moodle.mjs`:** se amplía con el botón de pantalla completa (con y sin soporte simulado), deshacer en el examen y la barra a 1024 px.
- **Validación del autor:**
  - el SCORM nuevo en un curso de pruebas de la UMA (ventana actual y *Nueva ventana*) y con SEB;
  - revisar la herramienta local `correccion/` con un bloque de entrega 1.8 (cambio de etiquetas a ids en los enlaces).
- **`/ship`:** según la memoria (push, MSIX y documentación de la Store), salvo que el autor decida otra cosa como en la v1.7.0.

