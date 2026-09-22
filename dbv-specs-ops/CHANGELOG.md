# Changelog — eer-studio

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.4.1] — 2026-09-22

### Added
- **Compilador y Linter EER (`src/utils/compiler.ts`)**: Análisis y validación léxico-sintáctica en dos niveles previa al renderizado visual y relacional. Diagnósticos tipados (`Diagnostic`) con severidad `error` (sintaxis bloqueante) y `warning` (semántica/pedagógica), e internacionalización de mensajes explicativos (ES/EN).
- **Barra de Diagnósticos en `CodePanel`**: Indicador visual al pie del editor con icono y estado en vivo (verde para sintaxis válida con conteo de entidades/relaciones; ámbar/rojo para advertencias o errores con número de línea y mensaje explicativo). Permite hacer clic en el mensaje para posicionar y seleccionar automáticamente la línea errónea en el editor de texto.
- **Estrategia Stale-while-error (`useEERParser`)**: Tolerancia a fallos durante la edición en vivo. Si el usuario borra o modifica temporalmente una entidad dejando la sintaxis incompleta (`ent `), el Canvas EER y el Modelo Relacional conservan congelado el último estado compilado válido, evitando parpadeos visuales (*flickering*) y la desaparición de nodos.
- **Red de Seguridad Zero-Crash (`ErrorBoundary`)**: Componente `ErrorBoundary` de React envolviendo la aplicación en `App.tsx` para atrapar excepciones imprevistas, conservar el código fuente en memoria/localStorage y ofrecer una pantalla amigable de recuperación en lugar de un reinicio de la aplicación.
- **Suite de pruebas unitarias del compilador (`compiler.test.ts`)**: 9 tests de cobertura para validación de líneas vacías, entidades sin nombre, relaciones sin nombre, atributos sin padre, enlaces incompletos, enlaces con nodos no declarados, identificadores duplicados y sintaxis válida.

### Fixed
- **Reinicio de la aplicación al editar y dejar una entidad sin nombre**: Si en el editor de texto se borraba el nombre de una entidad (`ent `), el parser generaba un `NodeData` con `label: undefined`, lo que provocaba un fallo fatal `TypeError: Cannot read properties of undefined (reading 'trim')` en `sanitizeName` dentro de `eerToRelational.ts`. Al no existir un `ErrorBoundary`, React desmontaba todo el árbol de componentes y la aplicación se reiniciaba al estado inicial (`SAMPLE_CODE`), perdiendo los cambios del usuario. Corregido con el paso previo de compilación, guardas defensivas en `sanitizeName` e `inferSQLType`, y contención de errores.

## [1.4.0] — 2026-08-24

### Added
- **Internacionalización ES/EN**: selector de idioma en la cabecera, `LanguageProvider`/`useLanguage` propios (sin librería externa), diccionarios planos `es.ts`/`en.ts` (~150 cadenas de UI) y `steps.ts` (~34 claves pedagógicas de los 9 Pasos con interpolación). Cubre toda la UI estática, el Inspector de 9 Pasos, el pie de tarjeta del Modelo Relacional y las cabeceras comentadas del script SQL exportado. `StepTrace` (`src/types/relational.ts`) pasa de texto pre-formateado a datos estructurados (`stepKey` + `params`), traducidos en el punto de renderizado. El DSL de ejemplo (`SAMPLE_CODE`) y el prompt de IA (`ModalAIPrompt`) permanecen en español a propósito (contenido de dominio, no UI).
- **Exportar SVG del Modelo Relacional**: nuevo botón "Exportar SVG" en la pestaña Modelo Relacional (antes solo existía en Diagrama EER). Renderer SVG puro dedicado (`exportRelationalSVG.ts`) que reconstruye las tarjetas HTML de pantalla como `<rect>`/`<text>`, reutilizando la misma geometría (`relationalGeometry.ts`, extraída de `RelationalViewer.tsx` para evitar divergencia) y respetando el idioma activo en el texto pedagógico exportado.

### Changed
- **README reescrito en dos idiomas** (`README.md` español + `README.en.md` inglés), siguiendo el formato de `dbv-md-reader`: cabecera con badges, conmutador de idioma, sección "Descárgalo e instálalo" por plataforma (Windows/Linux/macOS/navegador) con los nombres reales de los artefactos, tabla de los 9 pasos, referencia del DSL y estructura del proyecto. **El listado de novedades por versión sale del README** y queda centralizado en este CHANGELOG. Se documenta explícitamente que los paquetes de Linux y macOS los genera la CI pero no se han probado aún en hardware real.
- **`/code-simplify`**: consolidada la i18n en un `translate()` puro (`src/i18n/translate.ts`) que usan tanto el Provider de React como los utils, eliminando 3 mapas de diccionarios y 2 implementaciones duplicadas de interpolación; extraído `computeFKEdges()` a `relationalGeometry.ts` como única implementación del trazado de flechas FK (antes duplicado carácter a carácter entre la vista en pantalla y el exportador SVG); `RELATIONAL_COLORS` adoptado también por `RelationalViewer`; `downloadTextFile()` unificado en `src/utils/download.ts`; los dos botones "Exportar SVG" fusionados en uno; y helpers idempotentes `addColumn`/`addForeignKey` en el motor de conversión.

### Fixed
- **Paso 8A (herencia): retirada de la PK sintética predeterminada de la subclase y reordenación del pipeline.** El Paso 1 asigna a entidades sin clave una PK sintética `ID_<TABLA>` (`STEP1_DEFAULT_PK`). Al heredar la PK de la superclase en el Paso 8A, la PK sintética no se retiraba, produciendo una PK compuesta errónea `['DNI', 'ID_INGENIERO']`. Además, se reordenó el Paso 8 para ejecutarse antes del bucle de relaciones (Pasos 3/4/5/7), garantizando que cualquier relación conectada a una subclase propague la PK heredada real (`DNI`) como clave ajena.
- **Fuga de object URL al exportar**: los dos handlers de exportación SVG creaban un `URL.createObjectURL()` que nunca se revocaba, dejando el Blob anclado en memoria durante toda la vida del proceso (relevante en la app de escritorio, abierta durante horas). Centralizado en `downloadTextFile()`, que sí revoca.
- **Paso 8 (herencia): restricciones FK duplicadas.** Si una subclase era alcanzable desde dos nodos de especialización, la columna se añadía una vez (había guard) pero el `CONSTRAINT` se añadía dos veces con el mismo nombre, generando un DDL que Oracle rechaza. Corregido con `addForeignKey` idempotente.
- **Atributos derivados y multivaluados sobre relaciones se materializaban como columnas.** Los Pasos 1 y 2 ya los descartaban, pero los Pasos 4, 5 y 7 no aplicaban el filtro, así que un atributo `[derived]` colgado de una relación acababa como columna real y uno `[multivalued]` se aplanaba violando la 1FN. Unificado en `getMappableAttributes()`.
- **La app no arrancaba con el almacenamiento del navegador bloqueado**: `localStorage` lanza excepción (no devuelve `null`) en modo privado o con los datos de sitio deshabilitados, y la lectura del idioma ocurría al inicializar el estado. Protegido con `try/catch`.
- **Paso 2: la relación identificativa se procesaba dos veces.** El bucle genérico de relaciones (Pasos 3/4/5/7) no excluía las relaciones identificativas ya consumidas por el Paso 2, así que las volvía a tratar como una relación binaria normal. Con cardinalidades declaradas (caso del ejemplo por defecto `EMPLEADO`/`TIENE_DEP`/`DEPENDIENTE`) esto propagaba **por segunda vez** la misma FK del propietario, duplicando columna y restricción en la tabla de la entidad débil (visible además como claves React duplicadas en consola y etiquetas de flecha FK solapadas); sin cardinalidades, generaba una **tabla puente espuria** con el nombre de la relación identificativa. Cubierto con 3 tests nuevos.

---

## [1.3.0] — 2026-08-23

### Added
- **Auto-actualización con `tauri-plugin-updater`**: clave de firma propia (fuera del repo, generada por el usuario), botón "Buscar actualizaciones" en Créditos oculto en modo web y en instalaciones de Microsoft Store (`is_packaged_app`, detecta la ruta `WindowsApps`).
- **Menú nativo de macOS** (App/File/Edit/Window/Help) en `src-tauri/src/lib.rs`, con Abrir/Guardar/Guardar como propios, localizados según el idioma del sistema (`sys-locale`).
- **Chincheta "Fijar ventana encima" (Always on Top)** junto a "Guía 9 Pasos" — API multiplataforma de Tauri, sin código condicional por SO.
- **3 workflows de release** (`release-{windows,linux,macos}.yml`) para compilar y publicar en cada tag `vX.Y.Z`, línea base sin firmar.
- **Empaquetado MSIX para Microsoft Store** (`@choochmeque/tauri-windows-bundle`), probado de extremo a extremo; identidad pendiente de reserva en Partner Center. Ver `dbv-specs-ops/docs/MICROSOFT_STORE.md`.

### Fixed
- Corregido un fallo estructural real en `README.md`: dos bloques de código sin cerrar hacían que secciones enteras ("Publicación en GitHub Pages" y "Uso") se renderizasen como texto preformateado en GitHub en vez de como encabezados/listas.
- `Wide310x150Logo.png` del empaquetado MSIX se generaba como un placeholder negro sólido (mismo bug documentado en `dbv-md-reader`, causó allí un rechazo real de certificación) — corregido antes de cualquier envío.
- 24 avisos de `markdownlint` en `README.md` (líneas en blanco alrededor de encabezados/listas/bloques de código, numeración de listas, tabs literales, URL suelta, énfasis usado como encabezado).

---

## [1.2.0] — 2026-08-23

### Added
- **Suite Docente Integrada EER ↔ Relacional ↔ Oracle SQL DDL (`/build`):**
  - **Tipos Lógicos y Trazabilidad Pedagógica (`src/types/relational.ts`)**: Modelos de datos para esquemas relacionales, tablas, columnas, FKs, opciones de herencia (8A-8D) y objeto `StepTrace` para la explicación didáctica a alumnos universitarios.
  - **Motor de Conversión EER ➔ Relacional (9 Pasos) (`src/utils/relational/eerToRelational.ts`)**: Mapeo automático de los 9 pasos formales (`eer-to-relational-mapping.md`) adjuntando la justificación de cada regla.
  - **Generador y Exportador SQL DDL (`src/utils/relational/relationalToSQL.ts`)**: Soporte prioritario para **Oracle SQL (dialecto universitario por defecto con `CONSTRAINT`, `VARCHAR2`, `NUMBER`, `CASCADE CONSTRAINTS`)**, además de PostgreSQL, MySQL, SQLite y ANSI SQL.
  - **DSL de Texto Relacional Bidireccional con Coordenadas `(x, y)` (`relationalParser.ts` y `relationalCodeGenerator.ts`)**: Sintaxis en código de texto relacional sincronizada bidireccionalmente con el Canvas Relacional para reposicionamiento mediante código o ratón.
  - **Componentes UI y Navegación Docente (`EERDiagramer.tsx`)**: Pestañas superiores `[Diagrama EER] | [Modelo Relacional] | [Oracle SQL DDL]`, **Inspector Pedagógico de 9 Pasos** (`StepInspectorModal.tsx`), Canvas Relacional interactivo (`RelationalViewer.tsx`) y Visor/Exportador SQL (`SQLPreviewModal.tsx`).
  - **Motor de Ingeniería Inversa (Relacional ➔ EER) (`src/utils/relational/relationalToEER.ts`)**: Inferencia y derivación automática del código DSL de Diagramas EER a partir de un esquema relacional (identificación de entidades fuertes, débiles, relaciones 1:1, 1:N, M:N y claves primarias/ajenas).
  - **Resaltado Interactivo por Hover en el Canvas Relacional (`RelationalViewer.tsx`)**: Destacado dinámico de las relaciones FK conectadas al pasar el ratón sobre cualquier tarjeta de tabla.
- **Escritorio nativo con Tauri v2 (`src-tauri/`)**: Empaquetado dual Web + Escritorio. Genera ejecutable e instaladores `.msi`/`-setup.exe` para Windows a partir del mismo código fuente de la SPA.
- **Icono propio de la aplicación**: generado con `tauri icon` a partir de un SVG del logo (libro abierto sobre fondo indigo), sustituyendo el icono por defecto de Tauri en todos los formatos (ico, icns, PNG, Windows Store logos, Android, iOS).
- **Paso 7: Mapeado de Relaciones N-arias (n > 2)** en `eerToRelational.ts`: crea la tabla de relación con FKs de todas las entidades participantes, excluyendo de la PK compuesta la de cualquier entidad con restricción de cardinalidad 1, siguiendo la regla formal de `eer-to-relational-mapping.md`.
- **Suite de pruebas unitarias con Vitest**: cobertura de los 9 pasos formales de `eerToRelational.ts` y del generador `relationalToSQL.ts` (dialectos Oracle, PostgreSQL y SQLite).

### Fixed
- **Zoom con Ctrl+rueda/Ctrl+± no funcionaba en el ejecutable nativo**: WebView2 desactiva `zoomHotkeysEnabled` por defecto; se activó explícitamente en `tauri.conf.json`.
- **Arrastre de tablas en el Modelo Relacional lento en el ejecutable nativo**: se regeneraba el DSL relacional completo en cada `mousemove`; ahora la posición se gestiona en estado local durante el arrastre y solo se confirma al soltar. Se eliminó además una `transition-all` que animaba `left`/`top` dando sensación de rebote.
- **Botón "Exportar SVG" sin efecto en la pestaña Modelo Relacional** (también ocurría en la versión web): dependía de una referencia SVG que solo existe en la pestaña Diagrama EER. Se oculta ahora fuera de esa pestaña en vez de fallar en silencio.
- Errores de lint (`no-useless-escape`, `no-explicit-any`) en `relationalParser.ts`.

### Changed
- **Repositorio renombrado** de `eer-studio` a `dbv-eer-studio` en GitHub, con actualización del workflow de despliegue a GitHub Pages (`VITE_BASE`) y de todas las referencias en `README.md`.
- Créditos (`ModalCredits.tsx`) actualizados: nombre, versión, enlace al repositorio y copyright (2025 → 2025-2026).

### Removed
- `src/utils/platform.ts` (`isTauri()`): código muerto sin ninguna referencia en la base de código.

---

## [1.1.0] — 2026 (previo a la adopción SDD)
- Deselección automática al editar código.
- Mover atributos con entidades (Shift+Drag).
- Prompt mejorado para IA (espaciado, límite de caracteres, ejemplos).
- Instrucción visual en la barra de herramientas para Shift+Drag.

## [1.0.0] — 2025-12 (previo a la adopción SDD)
- Refactorización completa en 7 fases: separación de responsabilidades en componentes (`Canvas`, `NodeRenderer`, `LinkRenderer`, `Toolbar`, `CodePanel`, 5 modales) y hooks dedicados (parser, archivos, canvas, toolbar, modales).
- `EERDiagramer.tsx` reducido de 749 a 445 líneas; optimización con `React.memo` y `useCallback`.
- Soporte de especialización/generalización y uniones/categorías.

> Nota: las entradas de 1.0.0 y 1.1.0 se reconstruyen a partir del `README.md` y del historial `git log`, ya que el proyecto no tenía `CHANGELOG.md` antes de esta adopción SDD.
