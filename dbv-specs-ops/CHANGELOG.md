# Changelog — eer-studio

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Sin publicar]

### Removed
- **Botón "Buscar actualizaciones" y auto-actualizador** (`SPECIFICATIONS.md §3.9`): Windows se distribuye solo por Microsoft Store, que actualiza la app, y en Linux/macOS el botón nunca llegó a funcionar porque ninguna release publicaba el `latest.json` que consultaba. Se retiran `tauri-plugin-updater`, `tauri-plugin-process`, sus permisos y la configuración `plugins.updater`. Las nuevas versiones de Linux/macOS se descargan desde GitHub Releases.

## [1.6.0] — 2026-09-26

> Propuestas del colaborador **Enrique Soler Castillo** (`SPECIFICATIONS.md §3.7`).

### Added
- **Edición de elementos desde el diagrama**: doble clic (o `F2`/`Enter`) sobre un nodo abre el formulario precargado para renombrar entidades (y marcarlas como débiles), cambiar tipo y propietario de atributos, editar relaciones binarias (entidades, cardinalidades, participación total, identificativa), especializaciones (tipo, superclase, subclases, atributo definidor) y uniones. Renombrar actualiza todas las referencias del DSL; las coordenadas se conservan. Transformaciones puras en `src/utils/dslEditing.ts`.
- **Localizar el elemento en el DSL**: al seleccionar un nodo se resaltan su línea de declaración y sus líneas `link` en el editor, que se desplaza hasta ellas.
- **Selección múltiple**: `Ctrl`/`Cmd` + clic añade o quita nodos; arrastrar mueve el grupo; `Supr` elimina todos los seleccionados; `Escape` o clic en el fondo vacía la selección.
- **Los atributos siguen a su entidad o relación** al arrastrarla, recursivamente (`Alt` + arrastrar mueve solo el nodo). Sustituye a "Shift + arrastrar".
- **Rectángulo de selección** arrastrando con el botón izquierdo en el fondo: selecciona los nodos que quedan enteros dentro (criterio de Office); `Ctrl` lo suma a la selección.
- **Navegación estilo draw.io:** botón derecho o central + arrastrar desplaza el lienzo; la rueda desplaza (`Shift` = horizontal) y `Ctrl` + rueda / pellizco de touchpad hace zoom centrado en el cursor.
- **"Añadir y crear otro"** en el formulario de atributo: inserta y deja el formulario abierto con el mismo propietario y tipo, colocando el siguiente 100 px a la derecha.
- **Anti-solapamiento de atributos**: al crearlos en el canvas se desplazan si caen sobre otro nodo; en el DSL, un atributo pegado con las mismas coordenadas que otro nodo se dibuja desplazado +100 px.
- **Atributos de relación desde el formulario visual** (el propietario puede ser una entidad o una relación).
- **Atributo definidor de especializaciones**: sintaxis `spec d -> EMPLEADO [TipoTrabajo]`; se rotula en la arista superclase–círculo y se mapea como columna de la superclase (`STEP8_DEFINING_ATTR`). Sin corchetes, la especialización es definida por el usuario (sin discriminante).
- **Centro de Ayuda unificado** (`src/components/help/`): un botón **Ayuda** (o `F1`) sustituye a "Guía 9 Pasos", "Sintaxis", "Prompt IA" y "Créditos" con pestañas *Uso del editor* (nueva: gestos, atajos y flujo de trabajo), *Sintaxis*, *Guía de 9 Pasos*, *Prompt IA* y *Acerca de* (con colaboradores y la versión leída de `package.json`). El icono 📖 de cada tabla abre la Guía con esa tabla inspeccionada. Recuerda la última pestaña.
- **Prompt IA en inglés**: el prompt sigue el idioma de la interfaz (los comandos del DSL no se traducen).
- **Linter EER**: aviso `KEY_ATTRIBUTE_ON_NON_MN_RELATIONSHIP` y error `INVALID_DEFINING_ATTRIBUTE`. **Linter relacional**: error `INVALID_REFERENTIAL_ACTION`.

### Changed
- **Windows se distribuye solo por Microsoft Store** (igual que en `dbv-md-reader`): se elimina `release-windows.yml` y las Releases de GitHub dejan de incluir `.exe`/`.msi` desde esta versión. Linux y macOS siguen en GitHub Releases.
- **Política `ON DELETE` según la semántica de cada paso** (antes `CASCADE` universal): `CASCADE` solo en dependencia existencial (Pasos 2, 6 y 8A); `NO ACTION` en FKs obligatorias de 1:1/1:N y en tablas M:N y n-arias; `SET NULL` en FKs opcionales y categorías. Textos de la Guía de 9 Pasos, del Inspector y de `eer-to-relational-mapping.md` explican el porqué de cada acción.
- **DSL relacional**: siempre escribe `ON DELETE <acción>` y `NOT NULL` en FKs obligatorias; acepta `CASCADE | SET NULL | RESTRICT | NO ACTION` y, si se omite, asume `NO ACTION` (antes `CASCADE`).
- **Interfaz más limpia**: la toolbar pierde la pista de gestos (su contenido está en *Ayuda → Uso del editor*) y la cabecera la etiqueta "Suite Docente de Bases de Datos".
- **Editor de código sin ajuste de línea** (scroll horizontal) para que el resaltado coincida con cada línea.

### Fixed
- **Textos sin traducir**: el menú *File* y sus opciones aparecían en inglés con la interfaz en español, y la pantalla de error (`ErrorBoundary`) y el tooltip de la barra de diagnósticos estaban fijos en español.
- **La guía de sintaxis mostraba comandos que el compilador no reconoce** (`entity`, `weak_entity`, `relationship`, `identifying_relationship`, `FK UNIQUE`); ahora un test compila cada ejemplo.
- **"Acerca de" mostraba una versión escrita a mano** (`v1.5.0`); ahora se inyecta desde `package.json`.
- **`Ctrl` + rueda ampliaba toda la ventana** (zoom del navegador/WebView) en lugar del diagrama.
- **Los atributos clave de una relación M:N o n-aria no entraban en la PK** (`CIRCULA(PILOTO, TRAMO, VUELTA)` generaba la PK solo con las dos FKs).
- **El SQL perdía cualquier acción referencial distinta de `CASCADE`** (el `SET NULL` del Paso 9 desaparecía). Ahora se emite por dialecto; en Oracle `NO ACTION`/`RESTRICT` se expresan omitiendo la cláusula (evita ORA-00905).
- **Paso 3 (1:1)**: los atributos de la relación se perdían, y la FK quedaba nullable aunque el lado que la recibe tuviese participación total.
- **Paso 4 (1:N)**: la FK era siempre `NOT NULL`, incluso con participación parcial del lado N.
- **Borrar un atributo eliminaba sus homónimos de otras entidades** (p. ej. todos los `Nombre`).
- **La guía de sintaxis integrada mostraba `att DNI [key]`**, una sintaxis que el compilador no reconoce (la correcta es `key_att`).
- **Los atributos no mostraban el resaltado de selección**, y el diálogo de borrado no traducía el tipo de los atributos ni de las uniones.
- **Clic en los botones de zoom con una herramienta activa** creaba un elemento en el canvas.

## [1.5.0] — 2026-09-22

### Added
- **Compilador y Linter del Modelo Relacional (`src/utils/relational/relationalCompiler.ts`)**: Análisis multi-pasada del DSL relacional con verificación de sintaxis de tablas (`table NOMBRE { ... }`), columnas, claves primarias y foráneas (`FK -> TARGET(COL)`). Validación pedagógica en dos niveles con advertencias para tablas sin clave primaria, claves foráneas que apuntan a tablas/columnas no declaradas o nombres duplicados, resolviendo forward references de forma transparente.
- **Barra de Diagnósticos en `CodePanel` para Modo Relacional**: Indicador visual interactivo al pie del editor con estado en vivo (verde con conteo de tablas y claves foráneas; ámbar/rojo con número de línea y mensaje formativo internacionalizado en ES/EN). Permite hacer clic en el diagnóstico para posicionar y seleccionar automáticamente la línea en el editor.
- **Estrategia Stale-while-error en Modo Relacional**: Tolerancia a fallos durante la edición en vivo. Si el usuario borra o modifica temporalmente una tabla (`table `), el visor del Modelo Relacional retiene congelado el último esquema compilado válido, evitando parpadeos visuales (*flickering*), pérdida de flechas FK y la desaparición de elementos del canvas.
- **Protección de interacción mixta**: El arrastre de tablas sobre el canvas relacional solo regenera el código DSL si el código actual es sintácticamente válido, evitando sobreescribir el trabajo en curso del estudiante.
- **Suite de pruebas del compilador relacional (`relationalCompiler.test.ts`)**: 10 tests de cobertura específicos para compilación relacional, forward references y verificación de integridad referencial.

### Fixed
- **Parpadeo y desaparición de tablas al editar DSL relacional**: Al escribir o renombrar una tabla en el código relacional, la falta de compilador previo provocaba que la tabla desapareciera al instante del visor relacional y se rompieran las flechas FK asociadas. Resuelto con compilación previa y persistencia Stale-while-error.

## [1.4.1] — 2026-09-22

### Added
- **Compilador y Linter EER (`src/utils/compiler.ts`)**: Análisis y validación léxico-sintáctica en dos niveles previa al renderizado visual y relacional. Diagnósticos tipados (`Diagnostic`) con severidad `error` (sintaxis bloqueante) y `warning` (semántica/pedagógica), e internacionalización de mensajes explicativos (ES/EN).
- **Barra de Diagnósticos en `CodePanel` (Modo EER)**: Indicador visual al pie del editor con icono y estado en vivo (verde para sintaxis válida con conteo de entidades/relaciones; ámbar/rojo para advertencias o errores con número de línea y mensaje explicativo). Permite hacer clic en el mensaje para posicionar y seleccionar automáticamente la línea errónea en el editor de texto.
- **Estrategia Stale-while-error (`useEERParser`)**: Tolerancia a fallos durante la edición en vivo. Si el usuario borra o modifica temporalmente una entidad dejando la sintaxis incompleta (`ent `), el Canvas EER y el Modelo Relacional conservan congelado el último estado compilado válido, evitando parpadeos visuales (*flickering*) y la desaparición de nodos.
- **Red de Seguridad Zero-Crash (`ErrorBoundary`)**: Componente `ErrorBoundary` de React envolviendo la aplicación en `App.tsx` para atrapar excepciones imprevistas, conservar el código fuente en memoria/localStorage y ofrecer una pantalla amigable de recuperación en lugar de un reinicio de la aplicación.
- **Suite de pruebas unitarias del compilador EER (`compiler.test.ts`)**: 9 tests de cobertura para validación de líneas vacías, entidades sin nombre, relaciones sin nombre, atributos sin padre, enlaces incompletos, enlaces con nodos no declarados, identificadores duplicados y sintaxis válida.

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
