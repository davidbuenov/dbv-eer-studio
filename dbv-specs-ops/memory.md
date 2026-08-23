# 🧠 Memory & Context

> **Frontera de uso (Memory vs. Tasks):**
> - `task.md` → progreso **operativo**: checklist de tareas, Snapshot de Contexto, estado de la sesión.
> - `memory.md` → contexto **cualitativo y temático**: conocimiento persistente, decisiones técnicas profundas, lecciones, y el área del producto en foco.
>
> *Instrucción para la IA: Consulta este archivo al inicio de cada sesión para recuperar el hilo técnico.*

## 🎯 Contexto Activo
- **Estado actual del desarrollo:** v1.2.0. Suite EER ↔ Relacional ↔ SQL completa, empaquetado nativo con Tauri v2 funcionando en Windows (verificado ejecutando el `.exe` real, no solo compilándolo), suite de tests unitarios con Vitest, y repositorio renombrado a `dbv-eer-studio` en GitHub. Commit y publicación en marketplaces pendientes de decisión del usuario.
- **Foco inmediato:** Elegir canal(es) de distribución para publicar el instalador nativo (self-hosted en GitHub Releases, Microsoft Store vía MSIX, Uptodown, o combinación) — ver `dbv-specs-ops/docs/MARKETPLACE_PUBLISHING.md`.

## 🏗️ Log de Decisiones Técnicas (ADR Ligero)
- **2026-08-23 — Renombrado a `dbv-eer-studio` e Inicio de Tauri v2 (Fin de Sesión):** Se renombró oficialmente la app y el repositorio a `dbv-eer-studio` en `package.json`, `vite.config.ts`, `project.config.md` y `README.md`. Se inicializó la estructura de Tauri v2 (`src-tauri/`). Sesión finalizada a petición del usuario dejando registrado su malestar por problemas de visualización en la ventana nativa y falta de adherencia estricta a `dbv-tauri-starter`.

- **2026-08-23 — Fase `/spec` de la Suite Integrada EER ↔ Relacional ↔ SQL:** Se define formalmente el alcance para implementar el motor de conversión basado en los 9 pasos de `dbv-specs-ops/docs/eer-to-relational-mapping.md`, el editor relacional, la exportación SQL DDL (Postgres, MySQL, SQLite, ANSI) y la ingeniería inversa. Se confirma la migración a app de escritorio nativa usando `dbv-tauri-starter` como hito posterior al cierre de la suite web.

- **2026-08-23 — Adopción de SDD sin Agent Readiness:** Se desactiva `Agent Readiness (Web)` en `project.config.md` porque eer-studio es una SPA 100% cliente sin API ni datos que ofrecer a agentes externos; no se generan `robots.txt`/`llms.txt`/Agent Plugin.

- **2026-08-23 — Migración a escritorio nativa confirmada pero pospuesta:** El usuario confirma que el destino final del proyecto es una app de escritorio (candidato natural: Tauri v2, dado que otros proyectos `dbv-*` del mismo autor ya usan ese stack). Explícitamente **no** se inicia ahora: primero se quiere avanzar el backlog de la app web reflejado en `task.md`. Se incluyeron en `dbv-specs-ops/docs/` las guías `WEB_TO_DESKTOP_MIGRATION.md`, `NATIVE_DESKTOP_APPS.md`, `NATIVE_APPS_RELEASE_CI.md` y `MARKETPLACE_PUBLISHING.md` para tenerlas listas cuando llegue el momento, pero ninguna decisión de arquitectura de escritorio (arquetipo, sidecar vs. reescritura Rust, etc.) se ha tomado todavía.
- **2026-08-23 — Rename a `dbv-eer-studio` agendado a discreción:** Registrado en `task.md` para ser ejecutado cuando el desarrollo de las funcionalidades principales finalice o antes de la publicación nativa de escritorio.


- **2026-08-23 — Hito 5 (Tauri v2) desatascado — causas reales de los fallos previos:** Se retomó el empaquetado nativo tras un intento fallido con Antigravity. El build de Rust/WiX/NSIS ya compilaba y generaba `.exe`/instalador sin errores — el problema no era la tubería de build sino comportamientos concretos de WebView2 no cubiertos por `WEB_TO_DESKTOP_MIGRATION.md`/`NATIVE_DESKTOP_APPS.md` hasta ahora:
  - **Zoom con Ctrl+rueda/Ctrl+± no funcionaba:** Tauri v2 desactiva por defecto `zoomHotkeysEnabled` (mapea a `IsZoomControlEnabled` de WebView2 en Windows). Se activó explícitamente en `tauri.conf.json` → `app.windows[0]`.
  - **Arrastre de tablas en Modelo Relacional lento en nativo pero fluido en web:** `RelationalViewer.tsx` llamaba a `onTablePositionChange` en cada `mousemove`, y el padre (`EERDiagramer.tsx`) regeneraba el DSL relacional completo (`generateRelationalDSL`) y actualizaba el panel de código en cada frame de arrastre — coste que WebView2 no absorbe tan bien como un navegador de escritorio. Fix: posición "en vivo" en estado local del componente durante el drag; el DSL solo se regenera al soltar el ratón (`handleMouseUp`).
  - **El mismo arrastre seguía sin sentirse fluido tras el fix anterior:** la tarjeta tenía `transition-all duration-200` (pensada para el hover), que también animaba `left`/`top` — cada actualización de posición perseguía con una animación de 200 ms en vez de saltar al instante, dando sensación de "rebote". Fix: desactivar la transición mientras `draggingTableId === table.id`.
  - **Botón "Exportar SVG" sin efecto:** no era un bug de Tauri — el handler depende de `svgRef` del Canvas EER, que se desmonta al cambiar a la pestaña Relacional (las tarjetas ahí son HTML, no SVG). Ya fallaba igual en la web. Fix aplicado: ocultar el botón fuera de la pestaña EER en vez de dejarlo fallar en silencio. Exportar el Modelo Relacional a SVG queda pendiente como funcionalidad nueva (requeriría un renderer SVG puro de las tarjetas, no HTML+foreignObject).
  - **Icono por defecto de Tauri:** se generó un icono propio (libro abierto sobre fondo indigo, mismo glifo que `ModalCredits.tsx`) con `npx tauri icon <svg 1024x1024>`, que regenera automáticamente ico/icns/PNG/Store logos/Android/iOS desde una única fuente vectorial.
  - Verificado en el ejecutable real (no solo compilación) lanzando el `.exe` de `src-tauri/target/release/` directamente durante la sesión — clave para no repetir el error de dar por bueno un build que solo se había compilado pero nunca ejecutado.

- **2026-08-23 — Versión 1.2.0 (minor, no major):** El empaquetado nativo con Tauri es una funcionalidad grande pero aditiva — no rompe la versión web ni cambia comportamiento existente. Se descartó 2.0.0 (reservado para cambios incompatibles/rediseños) y se descartó también bajar a 0.x (propuesta inicial del usuario, corregida tras confirmar que el proyecto ya estaba en 1.1.0). Se sube en bloque en `package.json`, `tauri.conf.json`, `Cargo.toml` y `ModalCredits.tsx` — los cuatro deben mantenerse sincronizados en cada release.
- **2026-08-23 — Ciclo `/code-simplify` + `/test` + `/ship` sobre el Hito 5:** Se detectó y eliminó código muerto (`src/utils/platform.ts::isTauri()`, cero referencias), se corrigieron errores de lint reales en `relationalParser.ts` (escapes innecesarios en regex, un `as any` sustituido por `CascadeOption`), y se excluyó `src-tauri/` del linting de ESLint (antes analizaba por error JS generado por Cargo dentro de `target/`). Se añadió Vitest y la primera suite de tests del proyecto, cubriendo inicialmente 8 de los 9 pasos formales de `eerToRelational.ts` — el Paso 7 (relaciones n-arias, 3+ entidades) no estaba implementado en el motor (`entityLinks.length === 2` descartaba en silencio cualquier relación con más de dos entidades). Se verificó que el DSL (`link relacion entidad cardinalidad`) y su parser ya soportaban conectar 3+ entidades a una relación sin ningún cambio — el hueco era solo del motor de conversión, no de la UI. Se implementó siguiendo la regla formal de `eer-to-relational-mapping.md`: la PK de la tabla de relación es la combinación de las FKs de todas las entidades participantes, salvo la de cualquier entidad con restricción de cardinalidad 1 (esa FK queda como columna no-clave). Cubierto con 2 tests adicionales.

## ⚠️ Lecciones Aprendidas / Errores Evitados
- **[Adopción SDD]:** Al adoptar el framework sobre un proyecto con código y README ya maduros, la documentación de `SPECIFICATIONS.md`/`ARCHITECTURE.md` se reconstruyó leyendo el código real (componentes, hooks, utils, Tailwind classes) en vez de partir de cero, marcando `[INFERIDO]` vs `[CONFIRMADO]` según la fuente.

## 🗺️ Mapa de Relaciones
- **`useEERParser` (hooks):** parsea el DSL de texto a la estructura de nodos/enlaces que consume `Canvas`/`NodeRenderer`/`LinkRenderer`. Depende de `utils/parser.ts`.
- **`utils/codeGenerator.ts`:** dirección inversa — reconstruye el DSL cuando el usuario arrastra nodos o usa la Toolbar/Modales. Es el par crítico de `parser.ts`; ambos deben mantenerse sincronizados en cualquier cambio de formato del DSL.
- **`useFileOperations`:** encapsula File System Access API (guardar/abrir `.eer`) con su fallback.
- **`ResizableDivider`:** componente extraído en un refactor previo, usado entre `Canvas` y `CodePanel`.

---

## 🧹 Política de Mantenimiento
Actualizar este archivo en los triggers definidos por `docs/MASTER_PROMPT.md` (`/plan`, `/build`, `/test` y gate obligatorio en `/ship`). Si una sesión no genera decisiones nuevas, no forzar una entrada — registrar `<memory_update_proposal>none</memory_update_proposal>` con la razón, tal como indica el `MASTER_PROMPT.md`.
