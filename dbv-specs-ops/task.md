# Backlog - eer-studio

## Contexto del Proyecto (Context Snapshot)
* **Objetivo**: Editor EER ↔ Modelo Relacional ↔ Oracle SQL DDL con compiladores interactivos, linter de 2 niveles y tolerancia a fallos Stale-while-error.
* **Estado actual**: **v1.8.0 publicada** (2026-11-24): `main` + tag `v1.8.0` + release de GitHub (*Latest*, Linux y macOS). MSIX `1.8.0.0` enviado a la Microsoft Store (en certificación). **Versión cerrada por el autor.** 266 tests, smoke editor 26/26, smoke Moodle 36/36.
* **Próximo paso**: cuando Microsoft publique la v1.8.0, marcarlo en `MICROSOFT_STORE.md §4`. Siguiente versión: v1.9.0 (soporte táctil).

## Checklist de Tareas

- [x] **Fase `/spec` — Edición Moodle para exámenes EER** (`SPECIFICATIONS.md §3.10`): HTML único sin red dentro de un SCORM 1.2, solo EER con ayuda y plantilla opcional, autoguardado, entrega por texto en línea de la Tarea con bloque y suma de control, cierre configurado en Moodle.
- [x] **Fase `/plan` — Edición Moodle**: Adversarial Review + `implementation_plan.md` (aprobado por el usuario el 2026-11-13).
- [x] **Fase `/build` — Edición Moodle**
  - [x] Bloque 1: utilidades puras `src/moodle/` (submission, autosave, scorm12, clipboard, examConfig) con tests.
  - [x] Bloque 2: interfaz del examen (`moodle.html`, `MoodleExamApp`, `useExamSession`, barra de acciones, modales; `variant="exam"` en HelpCenter; i18n `moodle.*`).
  - [x] Bloque 3: `vite.config.moodle.ts` + `scripts/build-moodle.mjs` (inlinado, plantilla, verificación sin refs externas, manifiesto, zip) + `npm run build:moodle`.
  - [x] Bloque 4: `docs/moodle/GUIA_PROFESOR.md`, ARCHITECTURE §8, README ES/EN y CHANGELOG.
- [x] **Fase `/test` — Edición Moodle**: 24 tests unitarios nuevos (162 en total), lint, `tsc -b`, `dist/` con la misma estructura y smoke Playwright `scripts/smoke-moodle.mjs` (26/26: red bloqueada, autoguardado, copiar/cargar, manipulación, ayuda reducida, respaldo del portapapeles, SCORM simulado).
- [x] **Fase `/code-simplify` — Edición Moodle**: tipo `ScormWindow` exportado en lugar de casts; secuencias de escape restauradas; security review sin hallazgos (sin dependencias nuevas ni secretos; plantilla con `<` escapado, manifiesto escapado en XML, nombres de fichero saneados, texto pegado renderizado solo por React).
- [x] **Validación del autor en el Campus Virtual de la UMA** (navegador normal: SCORM, copiar y pegar en la Tarea). Pendiente: prueba con SEB.
- [x] **Mejoras tras la validación**: guía ampliada (dos actividades, ocultar la navegación SCORM, instrucciones para el alumnado, lista de comprobación SEB, problemas frecuentes); PDF con Typst (diseño del autor: `main.typ` + `styles.typ` + `guia-profesor.typ`); crédito de autoría con la Universidad de Málaga; adjuntos de release con nombres fijos (`build:moodle:release`).
- [x] **`/ship` v1.8.0** (2026-11-24): revisión de código de la rama (10 problemas corregidos, 3 tests nuevos); versión 1.8.0 en package.json/lock, Cargo.toml/lock, tauri.conf y `styles.typ`; CHANGELOG `[1.8.0]`; walkthrough; PDF de la guía y `build:moodle:release`; MSIX `1.8.0.0` verificado; fichas ES/EN, capturas y `SUBMISSION_GUIDE_v1.8.0.md`. Uptodown se abandona (decisión del autor). Agradecimiento a María del Mar Roldán García (sugerencias de la v1.8.0) en *Acerca de* y README. `main` + tag `v1.8.0` (movido al commit del agradecimiento antes de publicar) + release publicada. Enviada a la Store el 2026-11-24; versión cerrada.
- [x] **`/ship` v1.7.0** (2026-11-13): versión 1.7.0 en package.json/lock, Cargo y tauri.conf; CHANGELOG `[1.7.0]`; walkthrough; commit + tag + push; paquetes oficiales en `dist-moodle/`. **Sin MSIX ni envío a la Store** por decisión del autor (el escritorio no cambia de forma relevante).

- [x] **Fase `/spec` v1.6.0: Usabilidad del editor EER y rigor del mapeo**
  - [x] `SPECIFICATIONS.md` §3.7 (PK con key_att de relación, política ON DELETE, `[ATTR]`, edición, selección múltiple, resaltado DSL, crear otro).
  - [x] `ARCHITECTURE.md` §6 y `eer-to-relational-mapping.md` (política referencial y atributo definidor).
- [x] **Fase `/plan` v1.6.0**: Adversarial Review + `implementation_plan.md` (aprobación previa del usuario para ejecutar todas las fases hasta /code-simplify).
- [x] **Fase `/build` v1.6.0**
  - [x] Bloque 1: Motor relacional (key_att en PK Pasos 5/7, atributos Paso 3, ON DELETE/nulabilidad, DSL relacional, SQL por dialecto).
  - [x] Bloque 2: Atributo definidor `[ATTR]` (tipos, compilador, render, Paso 8A) + `LinkData.lineIndex` + nudge de coordenadas duplicadas.
  - [x] Bloque 3: Utilidades puras `layout.ts` y `dslEditing.ts`; generadores con coordenadas.
  - [x] Bloque 4: UI (modo edición, crear otro, atributos de relación, resaltado DSL, selección múltiple, arrastre de grupo).
  - [x] Bloque 5: Documentación (ayuda integrada, prompt IA, README ES/EN con agradecimiento, CHANGELOG).
  - [x] Bloque 6 (añadido tras la validación del usuario; 3 tests unitarios + smoke Playwright de 12 comprobaciones): rectángulo de selección con el botón izquierdo, desplazar con el derecho o el central, rueda para desplazar, Ctrl+rueda para zoom al cursor.
- [x] **Fase `/test` v1.6.0**: 60 tests nuevos (101 total; los clave verificados en rojo sin el fix) + lint + build + smoke test Playwright de los gestos del canvas.
- [x] **Fase `/code-simplify` v1.6.0**: parámetro duplicado eliminado; `toDslIdentifier` neutraliza caracteres con significado en el DSL; security review sin hallazgos (sin dependencias nuevas, sin secretos ni sinks HTML).
- [x] **Fase `/spec` + `/plan` v1.6.0 — Centro de Ayuda** (`SPECIFICATIONS.md §3.8`, `ARCHITECTURE.md §7`, anexo en `implementation_plan.md`).
- [x] **Fase `/build` Centro de Ayuda**: HelpCenter + 5 pestañas, useHelpCenter, prompt IA bilingüe, versión desde package.json, F1, acceso contextual, toolbar sin pista, retirada de modales antiguos.
- [x] **Fase `/test` + `/code-simplify` Centro de Ayuda**: 138 tests (34 nuevos; el de sintaxis verificado en rojo con los ejemplos antiguos), lint, build y smoke Playwright de 18 comprobaciones (F1, pestañas, pestaña recordada, ES/EN, acceso contextual). Además se tradujeron textos fijos que quedaban: menú Archivo, ErrorBoundary y tooltip de diagnósticos.
- [x] **Validación manual del usuario** → `/ship` (v1.6.0): versión 1.6.0 en package.json/Cargo/tauri.conf, CHANGELOG `[1.6.0]`, notas de tienda, `walkthrough.md`, commit + tag.

- [x] **Fase `/spec`: Compilador, Linter y Diagnósticos del Modelo Relacional**
  - [x] Definir alcance en `SPECIFICATIONS.md` §3.6 (Validación 2 niveles, Stale-while-error relacional, feedback de integridad referencial).
  - [x] Diseñar arquitectura en `ARCHITECTURE.md` §5 (`compileRelationalDSL`, diagnósticos en `CodePanel`, resiliencia).
- [x] **Fase `/plan`: Planificación e Implementation Plan**
  - [x] Ejecutar Adversarial Architect Review (debate en XML con términos formales de SPEC).
  - [x] Crear `implementation_plan.md` con Frontmatter (dependencies, risks, rollback_strategy) y desglose de tareas.
  - [x] Obtener aprobación explícita del usuario.
- [x] **Fase `/build`: Implementación Incremental**
  - [x] `src/types/compiler.ts`: Extensión de códigos de diagnóstico relacionales y tipos de retorno.
  - [x] `src/utils/relational/relationalCompiler.ts`: Compilador del DSL relacional con diagnósticos sintácticos y linter semántico multi-pasada.
  - [x] `src/utils/relational/relationalParser.ts`: Delegar en `compileRelationalDSL`.
  - [x] `src/i18n/es.ts` & `src/i18n/en.ts`: Claves de internacionalización para diagnósticos relacionales y resumen de elementos.
  - [x] `src/components/CodePanel.tsx`: Soporte para `countSummary` en la barra inferior de diagnósticos.
  - [x] `src/EERDiagramer.tsx`: Conectar diagnósticos relacionales, validar y aplicar Stale-while-error en la pestaña relacional.
- [x] **Fase `/test`: Pruebas Unitarias y Validación**
  - [x] Tests unitarios en `src/utils/relational/relationalCompiler.test.ts` (10 tests cubriendo errores, advertencias pedagógicas, forward references e integridad referencial).
  - [x] Suite completa de tests pasando (41/41 tests en verde), lint con 0 errores y build de producción verificado.

- [x] **Fase `/spec`: Compilador / Linter EER y Tolerancia a Fallos**
  - [x] Actualizar `SPECIFICATIONS.md` con §3.5 (Linter 2 niveles, Stale-while-error, Barra Diagnósticos, Red de Seguridad).
  - [x] Actualizar `ARCHITECTURE.md` con §4 (Pipeline de compilador, hook `useEERParser`, componentes `ErrorBoundary` y barra diagnósticos).
- [x] **Fase `/plan`: Planificación e Implementation Plan**
  - [x] Ejecutar Adversarial Architect Review (debate en XML con términos formales de SPEC).
  - [x] Crear `implementation_plan.md` con Frontmatter (dependencies, risks, rollback_strategy) y desglose de tareas.
  - [x] Obtener aprobación explícita del usuario.
- [x] **Fase `/build`: Implementación Incremental**
  - [x] `src/types/compiler.ts`: Tipos `Diagnostic`, `CompileResult`, severidades y códigos de error.
  - [x] `src/utils/compiler.ts`: Compilador léxico/sintáctico y linter semántico con mensajes pedagógicos.
  - [x] `src/i18n/compiler.ts` y diccionarios `es.ts`/`en.ts`: Localización de diagnósticos pedagógicos.
  - [x] `src/utils/parser.ts` & `src/utils/relational/eerToRelational.ts`: Guardas defensivas en `sanitizeName` y normalización.
  - [x] `src/hooks/useEERParser.ts`: Estrategia Stale-while-error reteniendo último AST válido.
  - [x] `src/components/ErrorBoundary.tsx`: Límite de errores React envolviendo la app en `App.tsx` / `main.tsx`.
  - [x] `src/components/CodePanel.tsx`: Barra de diagnósticos inferior con estado (éxito/error/aviso) y navegación a línea.
- [x] **Fase `/test`: Pruebas Unitarias y Validación**
  - [x] Tests unitarios en `src/utils/compiler.test.ts` (entidades sin nombre, enlaces rotos, sintaxis correcta, tolerancia a fallos).
  - [x] Validación manual en navegador (edición en vivo de entidades sin reiniciar la app verificada por el usuario).

- [x] **Fase `/spec`: Especificación y Definición del Modelo Relacional**
  - [x] Definir alcance funcional en `SPECIFICATIONS.md` (Conversión 9 Pasos, Editor Relacional, SQL DDL, Ingeniería Inversa, Roadmap Tauri v2).
  - [x] Diseñar arquitectura de módulos y modelos de datos en `ARCHITECTURE.md`.
  - [x] Registrar entradas en `CHANGELOG.md` y `memory.md`.
- [x] **Fase `/plan`: Planificación e Implementation Plan**
  - [x] Ejecutar Adversarial Architect Review.
  - [x] Crear `implementation_plan.md` con desglose por fases y feedback universitario.
  - [x] Obtener aprobación explícita del usuario.
- [ ] **Fase `/build`: Implementación Incremental**
  - [x] **Hito 1: Tipos y Motor EER ➔ Relacional (9 Pasos)**
    - [x] `src/types/relational.ts` (Modelos de datos relacionales + `StepTrace` educativo).
    - [x] `src/utils/relational/eerToRelational.ts` (Implementación de Pasos 1 a 9).
  - [x] **Hito 2: Generador y Exportador SQL DDL (Prioridad Oracle SQL)**
    - [x] `src/utils/relational/relationalToSQL.ts` (Oracle SQL por defecto, PostgreSQL, MySQL, SQLite, ANSI).
  - [x] **Hito 3: Visualizador, Inspector Pedagógico y Editor DSL Relacional**
    - [x] Componentes en `src/components/relational/` (`RelationalViewer.tsx`, `StepInspectorModal.tsx`).
    - [x] Modal de exportación `SQLPreviewModal.tsx`.
    - [x] DSL de texto relacional con coordenadas `[x: N, y: N]` (`relationalParser.ts` y `relationalCodeGenerator.ts`).
    - [x] Barra superior de pestañas docentes (`Diagrama EER`, `Modelo Relacional`, `Oracle SQL DDL`) en `EERDiagramer.tsx`.
  - [x] **Hito 4: Motor de Ingeniería Inversa (Relacional ➔ EER)**
    - [x] `src/utils/relational/relationalToEER.ts` (Inferir Diagrama EER desde Modelo Relacional - Postpuesto en UI).
    - [x] Resaltado interactivo de conexiones por Hover en `RelationalViewer.tsx`.
    - [x] Persistencia total de coordenadas relacionales en archivos `.eer`.
    - [x] Edición libre y bidireccional del panel de código del Modelo Relacional.
    - [x] Pestaña de Sintaxis Relacional en el modal de ayuda `ModalHelp.tsx`.
    - [x] Referencia académica explícita a Ramez Elmasri & Shamkant B. Navathe en `README.md` y `ModalCredits.tsx`.

  - [ ] **Hito 5: Empaquetado Nativo de Escritorio con `dbv-tauri-starter`**
    - [x] Inicialización de Tauri v2 y configuración dual (Web + Desktop).
    - [x] Build de release verificado (.exe + instaladores MSI/NSIS) compilando sin errores.
    - [x] Icono propio de la app (libro abierto, indigo) generado con `tauri icon`, sustituyendo al de Tauri por defecto.
    - [x] Zoom con Ctrl+rueda/Ctrl+± restaurado (`zoomHotkeysEnabled: true`, desactivado por defecto en WebView2).
    - [x] Arrastre de tablas en Modelo Relacional optimizado para el WebView nativo (posición local durante el drag, DSL solo se regenera al soltar; `transition-all` desactivada mientras se arrastra).
    - [x] Botón "Exportar SVG" corregido: solo se muestra en la pestaña EER (única con SVG real); no es un bug de Tauri, existía también en web.
    - [ ] Exportar SVG del Modelo Relacional (pendiente, fuera de alcance de esta sesión — las tarjetas son HTML, no SVG).
    - [ ] Validar build en macOS/Linux (solo se ha probado Windows) — el código del menú nativo (`macos_menu`) compila detrás de `#[cfg(target_os = "macos")]`, no se ha podido compilar de verdad en un Mac todavía.
    - [x] Auto-actualización (`tauri-plugin-updater`): clave de firma propia generada (`C:\Users\bueno\.tauri-keys\dbv-eer-studio.key`, no reutiliza la de `dbv-md-reader`), botón "Buscar actualizaciones" en Créditos oculto en modo web y en instalación Store (`is_packaged_app`).
    - [x] Menú nativo de macOS (App/File/Edit/Window/Help) portado de `dbv-md-reader` (PR#4/ADR-026) a `src-tauri/src/lib.rs`, con Abrir/Guardar/Guardar como propios de esta app (sin modo edición ni undo/redo, que no existen aquí).
    - [x] Chincheta "Fijar ventana encima" (Always on Top) — API multiplataforma de Tauri, sin comando Rust, botón junto a "Guía 9 Pasos".
    - [x] Los 3 workflows de release (`release-{windows,linux,macos}.yml`) copiados de `dbv-tauri-starter`, sin firmar (línea base intencional — firmar en CI queda pendiente de decisión, ver ADR en `memory.md`).
    - [x] Backport de la lección del menú nativo macOS a `dbv-specs-ops` y `dbv-tauri-starter` (commit local en ambos, sin push — pendiente de revisión del usuario antes de subir).
    - [x] Empaquetado MSIX para Microsoft Store (`@choochmeque/tauri-windows-bundle`) probado de extremo a extremo — `.msixbundle` generado correctamente. Identidad (`publisher`/`identifier`) con placeholders hasta reservar el nombre en Partner Center. Ver `dbv-specs-ops/docs/MICROSOFT_STORE.md`.
    - [x] Bug real encontrado y corregido antes de cualquier envío: `Wide310x150Logo.png` se generaba como placeholder negro sólido (mismo bug que causó un rechazo real en `dbv-md-reader`) — corregido componiendo el logo manualmente con Pillow.
- [x] **Fase `/test`: Pruebas Unitarias e Integración**
  - [x] Pruebas unitarias para los 9 pasos de `eerToRelational.ts` (incluye Paso 7, relaciones n-arias, añadido tras detectarse como hueco) con Vitest.
  - [x] Pruebas del generador de SQL `relationalToSQL.ts` (Oracle, PostgreSQL, SQLite; PK/FK/NULL).
- [x] **Fase `/code-simplify`**: Refactorización, eliminación de código muerto (`platform.ts`) y corrección de errores de lint (`relationalParser.ts`); build y lint verificados sin errores.
- [x] **Fase `/ship`**: Versión 1.2.0. README, CHANGELOG, créditos y scripts actualizados; commit/tag pendientes de confirmación del usuario.

## 📌 Tareas Pendientes / Roadmap Futuro

- [x] **Deuda técnica — auto-updater roto (detectada 2026-09-26)**: RESUELTA por decisión del autor — se retira el auto-actualizador en la próxima versión (`SPECIFICATIONS.md §3.9`, CHANGELOG `[Sin publicar]`). Ya implementado en `main`, pendiente de publicar.

- [ ] **v1.9.0 — Soporte táctil (tablets)** (decidido con el usuario el 2026-09-26; movido de v1.8.0 a v1.9.0 el 2026-11-24; ver `SPECIFICATIONS.md §3.7` fuera de alcance): migrar `Canvas`/`useCanvasInteraction` a Pointer Events con `touch-action: none`; un dedo en nodo = arrastrar, un dedo en fondo = desplazar, dos dedos = pellizco zoom/desplazamiento, mantener pulsado + arrastrar = rectángulo de selección, doble toque = editar. Requiere prueba en dispositivo táctil real.

- [x] **Fase `/spec` v1.8.0** (2026-11-24): `SPECIFICATIONS.md §3.11` (A compatibilidad, B clave parcial, C compuestos, D especialización parcial, E roles, F pantalla completa Moodle, G linter, H deshacer, I n-arias por interfaz, J repaso Elmasri, K documentación, L claves y modelo relacional) y `ARCHITECTURE.md §9`. Decisiones del autor: `spec ... partial` (sin marca = total, compatible con v1.7.0), `role:Nombre`, varios `key_att` siguen formando la PK compuesta + marca `unique` para claves alternativas, y tipos relacionales conservados y propagados a las FK. Hallazgos verificados con pruebas temporales: compuestos mal mapeados (una sola columna); recursiva M:N con columnas y restricciones FK duplicadas; relacional un cambio por detrás del EER (carrera con el retardo de 300 ms de `useEERParser`); FK compuestas partidas al pasar por el DSL relacional; `UNIQUE` nunca emitido en SQL (1:1 se comporta como 1:N); tipos editados perdidos al cambiar el EER.
- [x] **Fase `/plan` v1.8.0** (2026-11-24): Adversarial Review + `implementation_plan.md` (bloques B0–B8), aprobado por el autor.
- [ ] **Fase `/build` v1.8.0**
  - [x] B0: fixtures de compatibilidad v1.7.0 (`src/compat/`, instantáneas de `SAMPLE_CODE`, ejemplos de la ayuda y plantilla del hotel) + `ATTRIBUTE_NODE_TYPES`/`isAttributeType`/`AttributeKind` únicos en `src/types`.
  - [x] B1: correcciones con tests en rojo antes del fix (`compositeAttributes`, `relationalRoundTrip`, `recursiveRelationships`): compuestos (extremos y `parentEntity` a id + `expandSimpleAttributes` dirigido, que con los enlaces ya resueltos entraba en recursión infinita), relacional desfasado (`compiledCode` en `useEERParser`; verificado con `smoke-editor.mjs`, que falla con la lógica anterior), FK compuestas y `UNIQUE` en DSL relacional/SQL/vista/SVG, FK sin tipo y `FK_TYPE_MISMATCH` en el compilador relacional, recursivas con nombres únicos (Paso 5 unificado en un bucle), coordenadas negativas al cargar, `NUMBER(12, 2)`.
  - [x] B2: notación nueva (`partial_key_att`, `spec … partial|total`, `role:Nombre`, `key_att … unique`) en compilador, tipos, dibujo (subrayado a trazos, «UK», rol en cursiva), generadores, `dslEditing` y motor (Pasos 1/2 con claves alternativas y `uniqueConstraints`, rol como prefijo de FK). Tests en `notation.test.ts` y `dslEditing.test.ts`. Adelantada la parte de datos de B6: `ElementEdit.ends` es una lista (n-arias editables) y el formulario usa `participants`.
  - [x] B3: linter (`lintWeakEntitiesAndRoles`: 5 avisos) con `linterWeakEntities.test.ts`. `SAMPLE_CODE` gana `partial_key_att NombreDep -> DEPENDIENTE`; instantáneas de compatibilidad actualizadas tras revisar el diff (solo avisos nuevos y la PK de DEPENDIENTE). La plantilla del hotel (`ejemplos/202511ER_Hotel.eer`) no se toca: da `KEY_ATTRIBUTE_ON_WEAK_ENTITY` en HABITACION (decisión pendiente del autor).
  - [x] B4: tipos relacionales (`typeOverrides.ts` + tests): FK sin tipo en el DSL relacional (heredan de la columna referenciada), `FK_TYPE_MISMATCH`, tipos editados conservados al regenerar y guardados en el `.eer` (`relational T.C : TIPO`), aviso fijo en el panel relacional.
  - [x] B5: deshacer/rehacer (`codeHistory.ts` puro + `useCodeHistory`) en las dos ediciones: botones en la barra, Ctrl+Z/Y/Mayús+Z en lienzo y panel de código (tecleo agrupado por pausas de 1 s), Limpiar/Eliminar/Empezar de nuevo deshacibles (textos de confirmación actualizados).
  - [x] B6: formulario con lista de participantes (+ Añadir entidad / quitar, rol), tipo «Clave parcial», casilla «Clave alternativa (UNIQUE)» y «Participación total» en especializaciones.
  - [x] B7: Moodle: botón Pantalla completa (`fullscreen.ts` + `useFullscreen`, aviso si el reproductor la bloquea) y barra adaptable (solo iconos bajo `xl`). Hallazgo: en un iframe del mismo origen (el reproductor SCORM de Moodle) la pantalla completa se permite por defecto sin `allowfullscreen`.
  - [x] Smoke Playwright: `scripts/smoke-editor.mjs` nuevo (19/19; verificado que detecta el fallo L1 al reintroducirlo) y `scripts/smoke-moodle.mjs` ampliado (36/36).
  - [x] B8: diagrama de referencia de Elmasri (`elmasriReference.ts`, en *Sintaxis* y como test; no encontró huecos nuevos), ejemplos y atajos en la ayuda, prompt IA ES/EN, CHANGELOG `[Sin publicar]`, `eer-to-relational-mapping.md` (sección de implementación), ARCHITECTURE §9 y SPECIFICATIONS §3.11 marcados. README ES/EN, guía del profesor (MD + `guia-profesor.typ` + PDF regenerado con Typst) y ayuda de la app («Uso del editor»: compuestos, tipos de atributo, especialización parcial, avisos, pantalla completa, tipos relacionales) actualizados a petición del autor; quedan en la rama hasta el `/ship`, así que no describen nada publicado antes de tiempo.
- [x] **Ampliación tras revisión del autor (2026-11-24)**: ejemplo completo del prompt de IA con toda la notación (ES/EN, verificado visualmente sin solapes; corregido un `$nl` literal que se había colado en el prompt); pantalla completa también en la edición completa (web: Fullscreen API; escritorio: ventana Tauri, F11/Esc, permiso `core:window:allow-set-fullscreen`, `cargo check` OK); ayuda con pantalla completa y conservación de tipos. Hallazgo al dibujar el ejemplo: las recursivas pintaban sus dos líneas superpuestas (y claves de React repetidas) → `parallelLinks.ts`. Tests 260, smoke editor 23/23, Moodle 36/36.
- [x] **Formulario de atributos (petición del autor, 2026-11-24)**: «Pertenece a» incluye atributos para crear componentes de compuestos (`attributeOwnerOptions`, nombres repetidos desactivados) y preselecciona el elemento seleccionado (`suggestedAttributeOwner`; no existía en versiones anteriores: la v1.5.0 vaciaba el campo a propósito). `findParentLinks` reconoce como dueño un atributo compuesto (`link Direccion Calle`). Ayuda actualizada. Tests 263, smoke editor 26/26, Moodle 36/36.
- [x] **Fase `/test` v1.8.0**: 251 tests (85 nuevos), `tsc -b`, eslint, `npm run build`, `npm run build:moodle`, smoke editor 19/19 y Moodle 36/36.
- [x] **Fase `/code-simplify` v1.8.0**: `relationalParser.ts` (código muerto) eliminado; Paso 5 unificado; listas de tipos de atributo únicas. Security review: sin dependencias nuevas ni secretos; los textos nuevos (roles, tipos) se pintan con React o se escapan en el SVG; el SQL sigue siendo un script descargado por el propio usuario.
- [ ] **Validación del autor v1.8.0** (antes del `/ship`): probar el editor (notación nueva, ternarias, deshacer, tipos relacionales); subir el SCORM de prueba a un curso de la UMA y probar pantalla completa en ventana actual, en *Nueva ventana* y con SEB; revisar `correccion/` con una entrega 1.8 (enlaces por id); decidir si la plantilla del hotel pasa a `partial_key_att`.
- [ ] **v1.8.0 — Edición Moodle (pantalla completa), notación EER y mejoras del editor** (decidido por el autor el 2026-11-24: todo en la v1.8.0, salvo la restricción de igualdad de roles en uniones, descartada; ver `SPECIFICATIONS.md §3.11`). Notas de origen:
  - [ ] Botón **Pantalla completa** en la barra del examen, para que los menús laterales de Moodle (Identificación / Navegación / Administración) no quiten espacio al editor, sobre todo en pantallas pequeñas (captura del autor: con el SCORM en la ventana actual el lienzo queda en ~60 % del ancho y el título "EER Studio" de la barra se trunca a "E..").
  - [ ] Investigar qué vía funciona de verdad dentro de Moodle 5 / UMA y de SEB: (a) Fullscreen API sobre el `<iframe>` del reproductor SCORM (solo vale si Moodle lo emite con `allowfullscreen`; no verificado); (b) "ocultar paneles" con `postMessage`/acceso a `window.parent` (probablemente bloqueado por origen o frágil entre versiones de Moodle); (c) recomendar en la guía el ajuste *Mostrar paquete = Nueva ventana* con anchura/altura al 100 %. Probar en el Campus Virtual real antes de decidir.
  - [ ] Salida de pantalla completa visible (botón + Esc) y que el autoguardado y "Copiar para entregar" sigan funcionando; si falla la API, mensaje claro en lugar de fallar en silencio.
  - [ ] **Comentarios de un usuario (recibidos el 2026-11-24; el autor considera que tiene razón).** Los tres verificados en el código:
    - [ ] **Clave parcial de entidad débil sin notación propia.** El DSL no tiene `partial_key_att` (`UNKNOWN_COMMAND`, `compiler.ts` solo conoce `att`/`key_att`/`derived_att`/`multivalued_att`) y ningún atributo se dibuja con subrayado discontinuo. Hoy `key_att` en una entidad débil actúa como clave parcial en el mapeo (`eerToRelational.ts` ~468) pero se dibuja como clave normal (subrayado continuo). Añadir `partial_key_att` (tipo de nodo, render con subrayado discontinuo, mapeo, generador de código, botón en la barra, ayuda y prompt de IA).
    - [ ] **Atributos compuestos: faltan las líneas que unen los componentes.** `att Calle -> Direccion` crea el enlace con origen por *etiqueta* (`Direccion`), pero el id real de un atributo lleva sufijo (`Direccion_3`) y `LinkRenderer.tsx:23` resuelve solo por id, así que no se dibuja. Es la misma deuda ya registrada abajo (`LinkRenderer` resuelve extremos solo por id), con un caso real que la hace visible. El motor relacional sí reconoce atributos compuestos (`eerToRelational.ts` ~106-116). Corregir resolviendo en el compilador el id definitivo del origen y destino (también para `link ATRIBUTO ATRIBUTO`) y añadir test.
    - [ ] **Especialización parcial imposible de expresar.** El compilador dibuja siempre la arista superclase–círculo como `double` (total); no hay forma de pedir línea simple (parcial). Disjunta/solapada (`d`/`o`) sí existe. Decidir sintaxis: ojo, `[...]` ya es el atributo definidor (`DEFINING_ATTRIBUTE_REGEX`), así que `[partial]` colisionaría; opciones: palabra suelta `partial`/`total` tras el id (`spec d partial -> X`) o `[total]`/`[partial]` como palabras reservadas. Decidir también el valor por defecto sin romper diagramas existentes (hoy sin marca = total). El mapeo 8A–8D debe leer la participación de la especialización.
  - [ ] **Roles en relaciones recursivas** (p. ej. SUPERVISOR/SUPERVISADO en EMPLEADO–SUPERVISA): hoy no existen; la etiqueta del `link` se usa para la cardinalidad. Decidir sintaxis (p. ej. `link EMPLEADO SUPERVISA "1" (rol: SUPERVISOR)`), dibujo de la etiqueta de rol junto a la arista y campo en el diálogo de propiedades.
  - [ ] **Deshacer/rehacer (Ctrl+Z / Ctrl+Y) en el editor EER** (web, escritorio y Moodle): el Ctrl+Z nativo del cuadro de texto no cubre las acciones del lienzo (mover, crear, borrar), porque reescriben el DSL desde la app. Historial de versiones del texto del DSL (todo el estado vive en él), agrupando los arrastres en una sola entrada; botones en la barra. Prioritario para la edición Moodle: un borrado accidental en examen hoy no tiene vuelta atrás salvo el autoguardado.
  - [ ] **Repaso sistemático de la notación de Elmasri**: diagrama de prueba con todas las construcciones del capítulo (clave parcial, compuestos, multivaluados, derivados, ternarias, roles, total/parcial, d/o, unión, atributo definidor, ⊂) para detectar huecos antes que los alumnos; convertirlo en test de compilación y en ejemplo de la ayuda.
  - [ ] **Relaciones n-arias desde la interfaz gráfica**: hoy solo por DSL (el motor ya implementa el Paso 7 y el dibujo las soporta), y el diálogo de propiedades se niega a editarlas (`modalProperties.naryNote`). Generalizar `ModalProperties` a una lista de participantes reutilizando `RelationshipEndFields`, con botón "+ Añadir entidad" (mínimo dos); adaptar el estado del diálogo, `generateRelationshipCode` (`codeGenerator.ts`) y `dslEditing.ts`, con tests. Estimación: 100–150 líneas.
  - [ ] **Avisos pedagógicos del linter para entidades débiles**: entidad débil sin relación identificativa, entidad débil sin clave parcial, y `key_att` en entidad débil (sugerir `partial_key_att`, depende de la tarea de clave parcial). Mensajes ES/EN en `compiler.*`.
- [ ] **Deuda técnica (detectada en v1.6.0, pre-existente)**: el compilador del DSL relacional parte las FK compuestas en una FK por columna (**programado en v1.8.0, §3.11 L2**; también lo reportó Enrique Soler el 2026-09-28) y `link ENTIDAD atributo` sin `->` no se dibuja (**programado en v1.8.0, §3.11 C**); el motor solo implementa la opción 8A (8B/8C/8D en la especificación); dos `spec d` en el mismo diagrama comparten la etiqueta `d` y `link d X` se asocia siempre a la primera; `LinkRenderer` resuelve extremos solo por id, así que `link ENTIDAD atributo` (sin `->`) no se dibuja.
- [x] **Rename del Repositorio a `dbv-eer-studio`**: hecho en GitHub (`gh repo rename`), remote local, workflow de Pages y README.
- [x] **Paso 7 (relaciones n-arias) implementado**: confirmado que el DSL (`link relacion entidad cardinalidad`) y el parser ya soportaban conectar 3+ entidades a una relación sin cambios; solo faltaba el motor de conversión. Añadido en `eerToRelational.ts` siguiendo la regla formal de `eer-to-relational-mapping.md` (PK = combinación de FKs, excepto la de la entidad con cardinalidad 1).
- [x] **Deuda técnica — Exportar SVG del Modelo Relacional**: RESUELTA (2026-08-23). Las tarjetas siguen siendo HTML en pantalla, pero ahora existe un renderer SVG puro dedicado (`exportRelationalSVG.ts`) que reconstruye la vista completa para exportación — ver Fase 2 abajo.
- [x] **Bug del Paso 8A: PK sintética no retirada al heredar**: RESUELTO (2026-08-24). Retirada la PK sintética `STEP1_DEFAULT_PK` de las subclases al heredar en el Paso 8A y reordenado el pipeline para procesar el Paso 8 antes de las relaciones. Cubierto con tests TDD en `eerToRelational.test.ts`.
- [ ] **Deuda técnica — Build multiplataforma**: el empaquetado Tauri solo se ha compilado y probado en Windows; falta validar macOS/Linux.
- [x] **GitHub Releases**: `v1.2.0` publicado en https://github.com/davidbuenov/dbv-eer-studio/releases/tag/v1.2.0 con `.msi` y `-setup.exe`.
- [x] **Microsoft Store**: Paquete MSIX bundle (`dbv-eer-studio_1.5.0.0.msixbundle`) generado con identidad oficial, metadatos y capturas completadas, y subido a Partner Center para certificación (2026-09-23).
- [ ] **Uptodown u otro catálogo**: no iniciado.
- [ ] **Decisión pendiente — firma en CI**: los 3 workflows de release están sin firmar/sin auto-actualización a propósito. Firmar en CI implicaría subir la clave privada del updater como secret de GitHub Actions, a diferencia de `dbv-md-reader` (que firma Windows siempre en local). Sin decidir todavía.
- [x] **Internacionalización (ES/EN)** — implementada (2026-08-23). Ver desglose Fase 1 abajo.
- [x] **Exportar SVG del Modelo Relacional** — implementada (2026-08-23). Ver desglose Fase 2 abajo.
- [x] **Bug del Paso 2 (relación identificativa procesada dos veces)**: RESUELTO (2026-08-23). Detectado como claves React duplicadas durante la verificación visual de las Fases 1-2, diagnosticado a fondo al responder una pregunta teórica del usuario sobre entidades débiles sin atributos. Ver Fase 3 abajo.

### Fase `/plan` — Internacionalización ES/EN + Exportación SVG del Modelo Relacional (2026-08-23)
- [x] Adversarial Architect Review ejecutado (ver `memory.md`, ADR "StepTrace pasa a datos estructurados").
- [x] Alcance acordado con el usuario: i18n completa (UI estática + texto pedagógico de los 9 pasos), orden i18n → SVG.
- [x] `implementation_plan.md` creado con desglose de fases, dependencias, riesgos y estrategia de rollback.
- [ ] **Aprobación explícita del usuario pendiente antes de iniciar `/build`.**

**Fase 1 — Internacionalización (ES/EN):** ✅ Completada e implementada (2026-08-23), verificada en el navegador (dev server + Playwright: capturas ES/EN de cabecera, Inspector de 9 Pasos, Modelo Relacional y Ayuda DSL).
- [x] `LanguageContext` + hook `useLanguage` (en ficheros separados por la regla `react-refresh/only-export-components` de ESLint), diccionarios `es.ts`/`en.ts`, persistencia en `localStorage`, selector ES/EN en la cabecera. Provider inyectado en `App.tsx`.
- [x] Refactor de `StepTrace` (`src/types/relational.ts`) a `{ stepNumber, stepKey, params }` (dato estructurado, no texto pre-formateado).
- [x] Migrado `eerToRelational.ts` (31 stepTrace, los 9 pasos incluidas variantes 8A y 9.1/9.2 — 8B/8C/8D no estaban implementadas en el motor, fuera de alcance) y `relationalParser.ts` (placeholder de DSL directo) a `stepKey` + `params`.
- [x] Diccionario pedagógico `src/i18n/steps.ts` (34 claves + 9 pasos formales fijos) con interpolación, consumido en `RelationalViewer.tsx` y `StepInspectorModal.tsx`.
- [x] Traducidos los 12 componentes UI estáticos: `Toolbar.tsx`, `CodePanel.tsx`, `EERDiagramer.tsx`, `Canvas.tsx`, todos los Modales (`ModalHelp`, `ModalCredits`, `ModalProperties`, `ModalAIPrompt`, `ModalClearConfirm`, `ModalDeleteConfirm`), `SQLPreviewModal.tsx`.
- [x] Ampliación no prevista en el plan original: las cabeceras comentadas del script SQL exportado (`relationalToSQL.ts`) también se tradujeron (recibe `lang` desde `SQLPreviewModal.tsx`), por consistencia con la decisión de cobertura completa.
- [x] Decisión documentada: `SAMPLE_CODE` (`src/constants/index.ts`) y el prompt de `ModalAIPrompt.tsx` permanecen en español (contenido de dominio, no UI).
- [x] `relationalToSQL.test.ts` actualizado (stepTrace de los fixtures a `stepKey`/`params`) y en verde; suite completa (16 tests), `tsc -b`, `eslint .` y `npm run build` sin errores.
- [x] **Deuda técnica encontrada durante la verificación visual (no introducida por este cambio, pre-existente):** claves React duplicadas en el Modelo Relacional al convertir el ejemplo `DEPENDIENTE`. RESUELTA en la Fase 3 (ver abajo) — la causa real no era la generación de ids sino un doble procesamiento de la relación identificativa.

**Fase 3 — Fix del Paso 2: relación identificativa procesada dos veces:** ✅ Completada (2026-08-23), a petición explícita del usuario tras preguntar qué dice el algoritmo formal para una entidad débil sin atributos.
- [x] Causa raíz: el bucle genérico de relaciones (`relationships.forEach`, Pasos 3/4/5/7) en `eerToRelational.ts` no excluía las `identifying_relationship` ya consumidas por el bloque del Paso 2, reprocesándolas como relación binaria normal.
- [x] Dos manifestaciones: con cardinalidad declarada (`"1"`/`"N"`) → Paso 4 duplica la FK del propietario (columna + restricción); sin cardinalidad → Paso 5 crea una tabla puente espuria.
- [x] Fix: `Set` de relaciones identificativas realmente consumidas por el Paso 2 (registradas donde se propaga la FK, no por tipo de nodo), excluidas del bucle genérico. Una `identifying_relationship` mal formada que el Paso 2 no pueda tratar sigue llegando al bucle genérico en vez de desaparecer en silencio.
- [x] 3 tests nuevos en `eerToRelational.test.ts` (tabla puente espuria, FK duplicada con cardinalidad 1:N, entidad débil sin atributos propios), **verificados en rojo antes de dar el fix por bueno** desactivándolo temporalmente. Suite: 19 tests en verde.
- [x] Verificado en la app real: 0 errores de consola (antes 8), la tarjeta `DEPENDIENTE` muestra una sola columna `EMPLEADO_DNI`, y desaparecen las etiquetas de flecha FK solapadas.
- [x] Documentada la respuesta a la pregunta teórica original en un test: sin clave parcial la regla formal del Paso 2 no puede completarse (PK = FK propietario + clave parcial); el motor produce una PK formada solo por la FK del propietario, lo que limita a una instancia débil por propietario.

**Fase `/code-simplify` — 4 agentes de revisión en paralelo + Security Review:** ✅ Completada (2026-08-23).
- [x] Security Review (obligatoria por `MASTER_PROMPT.md`): sin secretos en el código nuevo; **cero dependencias nuevas** (sin riesgo de slopsquatting); sanitización verificada en profundidad (orígenes constreñidos a `[A-Za-z0-9_]` + `escapeXml()` en los 6 puntos de emisión al SVG).
- [x] **Fix #1 — el fix del Paso 2 estaba incompleto:** el `Set` se rellenaba dentro de `if (ownerTable)` y usaba `find` en vez de `filter`. Dos variantes del mismo bug seguían vivas. Corregido reclamando por semántica, no por éxito del procesamiento.
- [x] **Fix #2 — helpers idempotentes `addColumn`/`addForeignKey`**, adoptados por los Pasos 8 y 9. Corrige el `CONSTRAINT` duplicado del Paso 8 (DDL que Oracle rechaza).
- [x] **Fix #3 — `computeFKEdges()` en `relationalGeometry.ts`**: única implementación del trazado de flechas FK (antes duplicada carácter a carácter, incluido el asignador de puertos, que es estado con orden significativo). `RELATIONAL_COLORS` adoptado también por `RelationalViewer`. Elimina de paso un `find` O(T×F) con `toUpperCase()` en la ruta de arrastre.
- [x] **Fix #4 — `translate()` puro** en `src/i18n/translate.ts` usado por Provider y utils; eliminados 3 mapas de diccionarios, 2 `interpolate` duplicados y un `.replace()` manual frágil. `language.ts` fusiona tipo + contexto + hook.
- [x] **Fix #5 — `getMappableAttributes()`** unificado en los 5 llamantes: los atributos derivados y multivaluados ya no se materializan como columnas al colgar de una relación (Pasos 4/5/7).
- [x] Regresión propia de rendimiento corregida: `translateStep()` en la ruta caliente del arrastre → `translateStepTitle()` + `useMemo`.
- [x] Fuga de object URL corregida y centralizada en `src/utils/download.ts`; los dos botones "Exportar SVG" fusionados en uno.
- [x] Hardening: `localStorage` en `try/catch` (lanza excepción, no devuelve `null`, en modo privado — tumbaba la app al arrancar).
- [x] 2 tests nuevos (constraint duplicado del Paso 8, filtro de atributos en relaciones). Suite: 21 tests. `tsc -b`, `eslint`, `build` y verificación visual con Playwright en verde (0 errores de consola).
- [ ] **Hallazgo NO corregido, registrado como deuda técnica** (es corrección, no simplificación — fuera del alcance de `/code-simplify`): PK sintética no retirada en el Paso 8A. **Es la tarea de mañana**, ver "🔜 Siguiente sesión" al final de este fichero.

**Fase de documentación — README bilingüe:** ✅ Completada (2026-08-23).
- [x] `README.md` (español) y `README.en.md` (inglés) reescritos siguiendo el formato de `dbv-md-reader`: conmutador de idioma, badges, "Descárgalo e instálalo" por plataforma con nombres reales de artefactos, tabla de los 9 pasos, referencia del DSL, estructura del proyecto y créditos.
- [x] Las secciones "🆕 Novedades - Versión X" salen del README; el historial queda centralizado en `CHANGELOG.md`.
- [x] Honestidad explícita en el README: los paquetes de Linux y macOS los genera la CI pero no se han probado en hardware real; no se menciona Microsoft Store como disponible (la identidad sigue pendiente en Partner Center).
- [x] Verificado el balance de fences (18 = 9 bloques) y la existencia de todos los ficheros enlazados, por el precedente del bug de bloques sin cerrar de una versión anterior.

**Fase 2 — Exportar SVG del Modelo Relacional (depende de Fase 1):** ✅ Completada e implementada (2026-08-23), verificada con Playwright (descarga real del `.svg` vía el botón de la UI + render standalone del fichero exportado, comparado visualmente contra la vista en pantalla).
- [x] Geometría extraída a `src/utils/relational/relationalGeometry.ts` (`CARD_WIDTH`/`HEADER_HEIGHT`/`ROW_HEIGHT`/`FOOTER_HEIGHT`, `getTableHeight`, `getAnchorPortPosition`, `getOptimalSides`) — consumida tanto por `RelationalViewer.tsx` (que ya no define estas funciones localmente) como por el exportador, eliminando el riesgo de divergencia documentado en `implementation_plan.md`.
- [x] Paleta de colores hex en `src/utils/relational/relationalColors.ts` (calcada de las clases Tailwind slate/indigo/amber/cyan usadas en pantalla).
- [x] `src/utils/relational/exportRelationalSVG.ts`: reconstrucción manual de tarjetas (`<rect>`/`<text>`, cabecera/columnas/pie con esquinas redondeadas) + flechas FK reutilizando el mismo algoritmo de anclaje/curvatura que `RelationalViewer.tsx`.
- [x] Botón "Exportar SVG" condicionado a `activeTab === 'relational'` en `EERDiagramer.tsx`, mismo patrón `Blob`+`download` que `handleExport` (EER).
- [x] Texto del SVG exportado (`stepTitle`, "Paso N") usa el idioma activo vía `translateStep`/diccionario de la Fase 1.
- [x] Verificación end-to-end: descarga real disparada desde el botón de la UI (Playwright `waitForEvent('download')`), fichero `.svg` guardado y renderizado standalone en un navegador — comparado visualmente contra la captura de la vista en pantalla, coincide (tarjetas, colores PK/FK, curvas de flechas, texto pedagógico traducido).
- [x] Deuda técnica "Exportar SVG del Modelo Relacional" resuelta — actualizado en la sección de deuda técnica más abajo.

---

## 🔄 Context Snapshot / Snapshot de Contexto

> **Last update / Última actualización:** 2026-11-24 (v1.8.0 cerrada: publicada en GitHub y enviada a la Microsoft Store)
> **Punto exacto:** v1.8.0 completa (§3.11 A–L + ampliaciones del autor: pantalla completa en todas las ediciones, compuestos y propietario preseleccionado en el formulario, ejemplo completo del prompt IA, líneas paralelas en recursivas). Commit en la rama `feature/v1.8.0` (sin push, sin tag, versión aún 1.7.0 en `package.json`).
> **Estado:** 263 tests, `tsc -b`, `eslint .`, `npm run build`, `npm run build:moodle`, `cargo check`, `node scripts/smoke-editor.mjs` (26/26) y `node scripts/smoke-moodle.mjs dist-moodle/examen-bd-hotel-prueba.html` (36/36) en verde.
>
> **`/ship` v1.8.0, en este orden:**
> - **a. Validación del autor:** editor (notación nueva, formularios, deshacer, tipos relacionales); SCORM de prueba `dist-moodle/examen-bd-hotel-prueba_scorm12.zip` en un curso de la UMA (pantalla completa en ventana actual y con SEB); pantalla completa en escritorio (`npm run tauri dev`, F11/Esc); revisar `correccion/` con una entrega 1.8 (los enlaces llevan ids); decidir si `ejemplos/202511ER_Hotel.eer` pasa a `partial_key_att` (hoy da `KEY_ATTRIBUTE_ON_WEAK_ENTITY`; si se cambia, actualizar la instantánea `hotelTemplate` con `vitest -u` revisando el diff).
> - **b. Versión 1.8.0** en `package.json`/lock, `src-tauri/Cargo.toml` y `tauri.conf.json`; CHANGELOG `[Sin publicar]` → `[1.8.0] — fecha`; regenerar el PDF de la guía (`typst compile docs/moodle/main.typ docs/moodle/GUIA_PROFESOR.pdf`, la cabecera mostrará 1.8.0); `npm run build:moodle:release` (paquetes oficiales en `dist-moodle/`); `walkthrough.md`.
> - **c. Git:** fusionar `feature/v1.8.0` en `main`, tag `v1.8.0`, push con tags y publicar la release de GitHub (los workflows la crean como *Draft*).
> - **d. Store:** según la regla de `/ship` (MSIX + documentación en `docs/store/`), salvo que el autor decida como en la v1.7.0. La v1.6.0 sigue pendiente de envío.
> - **e. Untracked del autor, fuera del commit:** `docs/moodle/GUIA_PROFESOR v1.7.0.pdf` y `docs/store/notasActualizacionStore_v1.6.0.md`.
>
> *Histórico del snapshot anterior (v1.6.0):*
> **Para retomar, en este orden:**
> 1. ~~Releases en borrador~~ — **resuelto 2026-09-26**: v1.4.1, v1.5.0 y v1.6.0 publicadas en orden (v1.6.0 = *Latest*) con notas detalladas; v1.4.0 completada. Windows pasa a ser solo Microsoft Store (sin `.exe`/`.msi` en v1.6.0; `release-windows.yml` eliminado).
> 2. **Microsoft Store:** el autor envía la actualización v1.6.0 siguiendo `docs/store/SUBMISSION_GUIDE_v1.6.0.md`; al publicarse, actualizar `docs/MICROSOFT_STORE.md` §4.
> 3. **v1.8.0 — notación EER, deshacer y pantalla completa Moodle:** implementada el 2026-11-24 (`/spec` → `/plan` → `/build` → `/test` → `/code-simplify`). Sin commits: el árbol mezcla estos cambios con otros del autor anteriores a la sesión. Siguiente paso: validación del autor y `/ship` (README ES/EN, guía del profesor + PDF, paquetes `build:moodle:release`, versión 1.8.0, y MSIX/Store según la regla de `/ship`). El soporte táctil pasa a la v1.9.0.
> 4. **Regla de `/ship`** (autor, 2026-09-26): toda entrega incluye push, MSIX y documentación completa de la Store — `docs/MICROSOFT_STORE.md` §7.

> *Histórico del snapshot anterior (v1.5.0) a continuación.*

### 1️⃣ PRIMERO: Bug del Paso 8A — PK sintética no retirada al heredar

**Estado:** reproducido y confirmado con evidencia real (no es una inferencia). Sin corregir.

**Causa raíz (orden implícito del pipeline).** En `src/utils/relational/eerToRelational.ts` los pasos corren en este orden de código: Paso 1 (línea ~223) → Paso 2 (~297) → bucle genérico con Pasos 3/4/5/7 (~456-683) → Paso 6 (~786) → **Paso 8 (~871)** → Paso 9 (~943). Es decir, el Paso 8 muta tablas que los pasos anteriores ya dieron por terminadas:

1. El **Paso 1** da a toda entidad sin atributo clave una PK sintética `ID_<TABLA>` (línea ~266, `STEP1_DEFAULT_PK`). Una subclase típica no declara clave propia, así que la recibe.
2. Los **Pasos 3/4** propagan FKs leyendo `columns.filter(isPrimaryKey)` **en ese momento** — o sea, apuntando a la PK sintética.
3. El **Paso 8A** hace `addColumn(subTable, ..., 'start')` de la PK heredada de la superclase, pero **no retira la sintética**.

**Evidencia reproducida** (subclase `INGENIERO` sin atributo clave, superclase `EMPLEADO` con PK `DNI`, y una relación 1:N `PROYECTO → INGENIERO` procesada antes del Paso 8):

```text
INGENIERO.columns  = ['DNI', 'ID_INGENIERO']
INGENIERO.PKs      = ['DNI', 'ID_INGENIERO']    ← PK compuesta incorrecta; debería ser solo DNI
PROYECTO.FKs       = ['FK_PROYECTO_INGENIERO -> INGENIERO(ID_INGENIERO)']
                                                 ← referencia solo una parte de la PK compuesta
```

**Por qué importa:** en Oracle una FK debe referenciar la PK completa o una clave UNIQUE — el DDL generado no compila. Y pedagógicamente es incorrecto: la regla 8A dice que la subclase hereda la PK de la superclase, no que acumule dos.

**Enfoque sugerido** (decidir al empezar, no está cerrado): al aplicar 8A, retirar de la subclase la PK sintética generada por el Paso 1 antes de insertar la heredada — identificable por `stepTrace.stepKey === 'STEP1_DEFAULT_PK'`, que es justo para lo que sirve el `StepTrace` estructurado. Queda por decidir qué hacer con las FKs que los Pasos 3/4 ya emitieron apuntando a la columna retirada: o se reescriben, o se mueve el Paso 8 antes del bucle genérico (más limpio conceptualmente, pero más arriesgado). **Evaluar ambas antes de tocar código.**

**Cómo verificarlo** (misma práctica que se siguió con el fix del Paso 2, que funcionó bien):
1. Escribir primero el test con el escenario de arriba y **confirmarlo en rojo** antes de tocar el motor.
2. Aplicar el fix; comprobar que los 21 tests existentes siguen en verde (ojo a los tests del Paso 8 y a los de relaciones binarias).
3. Verificación visual en la app con el ejemplo por defecto, que **ya contiene una jerarquía** (`spec d -> EMPLEADO` con SECRETARIA/INGENIERO/TECNICO) — mirar la pestaña Modelo Relacional y el SQL DDL generado.

### 2️⃣ DESPUÉS: ciclo `/ship`

Al terminar el fix, ejecutar `/ship` según `docs/MASTER_PROMPT.md`. Puntos a no olvidar:

- **Versión sugerida: 1.4.0 (minor)** — hay funcionalidad nueva y aditiva (i18n ES/EN, exportación SVG del Modelo Relacional) y ningún cambio incompatible. Confirmar con el usuario, que es quien elige.
- **Subir la versión en los CUATRO sitios a la vez:** `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` y `src/components/ModalCredits.tsx`.
- Mover la sección `[Sin publicar]` de `CHANGELOG.md` a `[1.4.0] — fecha` (ya está redactada y bastante completa).
- **Gate de memoria obligatorio** (`<memory_update_proposal>`) antes de cerrar.
- ⚠️ **Importante:** los README ya documentan i18n y la exportación SVG del Modelo Relacional, pero eso **todavía no está en ninguna release publicada**. No dejar los README en `main` sin hacer el `/ship`, o quien descargue v1.3.0 leerá funciones que su binario no tiene.
- Recordar que el usuario revisa antes de hacer push; proponer commit y tag, pero **no hacer push**.
