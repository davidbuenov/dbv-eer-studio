# 🏗 Arquitectura Técnica: eer-studio

> **Fase:** `/plan` (Planificación Técnica)
> **Estado:** Validado (reconstruido a partir del código existente)
> **Última Revisión:** 2026-08-23

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Justificación |
| --- | --- | --- |
| **Lenguaje** | TypeScript 5.9 | Tipado estático sobre React, evita errores de forma de datos del DSL/parser |
| **Framework principal** | React 19 | SPA sin necesidad de SSR; ecosistema maduro de componentes |
| **Build / Dev server** | Vite (`rolldown-vite` 7.2) | Arranque y HMR rápidos |
| **Estilos** | Tailwind CSS 3.4 (config por defecto, sin tokens propios) | Utilidades rápidas, consistentes con el resto de proyectos `dbv-*` |
| **Iconos** | Lucide React | Set de iconos ligero y consistente |
| **Persistencia** | Ninguna (sin BD) — ficheros `.eer` locales vía File System Access API | Proyecto 100% cliente, sin backend |
| **Testing** | Ninguno todavía | Deuda técnica registrada en `task.md` |
| **CI/CD** | GitHub Actions (`.github/workflows/deploy-pages.yml`) | Build + deploy automático a GitHub Pages en cada push a `main` |

---

# 🏗 Arquitectura Técnica: eer-studio

> **Fase:** `/spec` (Especificación & Arquitectura)
> **Estado:** Validado (Arquitectura ampliada para Mapeo Relacional & Desktop Roadmap)
> **Última Revisión:** 2026-08-23

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Justificación |
| --- | --- | --- |
| **Lenguaje** | TypeScript 5.9 | Tipado estático sobre React y modelos lógicos relacionales/EER |
| **Framework principal** | React 19 | SPA sin backend; arquitectura modular de componentes |
| **Build / Dev server** | Vite (`rolldown-vite` 7.2) | Compilación y HMR ultra-rápidos |
| **Estilos** | Tailwind CSS 3.4 | Utilidades visuales consistentes |
| **Iconos** | Lucide React | Iconografía de tablas, claves (PK/FK), exportación y diagramas |
| **Persistencia** | Local (File System Access API) | Archivos `.eer`, `.json` de esquema relacional y `.sql` |
| **Empaquetado Nativo (Roadmap)** | Tauri v2 (`dbv-tauri-starter`) | Binario ligero de escritorio con WebView nativo (WebView2 / WebKitGTK / WKWebView) |

---

## 📂 Estructura de Directorios Ampliada

```text
src/
├── components/
│   ├── canvas/          # Canvas EER, NodeRenderer, LinkRenderer
│   ├── editor/          # CodePanel (DSL EER), Toolbar, ResizableDivider
│   ├── modals/          # Modales EER (Entity, Attribute, Relationship, etc.)
│   ├── relational/      # RelationalViewer (Canvas), RelationalEditor, TableCard, StepInspectorModal (Ayuda 9 Pasos)
│   ├── sql/             # SQLPreviewModal (Oracle SQL prioritario, Postgres, MySQL, SQLite)
├── hooks/
│   ├── useEERParser.ts
│   ├── useRelationalParser.ts   # [NUEVO] Hook de sincronización DSL Relacional ↔ Canvas
│   ├── useRelationalSchema.ts   # [NUEVO] Hook de conversión EER ➔ Relacional y trazabilidad de 9 pasos
│   ├── useSQLGenerator.ts       # [NUEVO] Hook de generación DDL Oracle / Multi-SGBD
│   ├── useFileOperations.ts
├── utils/
│   ├── parser.ts                # Parser del DSL EER
│   ├── codeGenerator.ts         # Generador de DSL EER desde Canvas
│   ├── relational/              # Módulo de conversión relacional y DSL
│   │   ├── eerToRelational.ts   # Algoritmo de 9 pasos con trazabilidad pedagógica
│   │   ├── relationalParser.ts  # Parser de DSL Relacional (Texto con coordenadas ➔ Objeto)
│   │   ├── relationalCodeGenerator.ts # Generador de DSL Relacional (Objeto ➔ Texto con coordenadas)
│   │   ├── relationalToSQL.ts   # Exportador a Oracle SQL (por defecto), PostgreSQL, MySQL, SQLite, ANSI
│   │   └── relationalToEER.ts   # Ingeniería inversa Relacional ➔ EER
├── types/
│   ├── index.ts                 # Tipos EER (NodeData, LinkData, etc.)
│   ├── relational.ts            # Tipos Relacionales (RelationalSchema, Table, Column, FK, PK, StepTrace)

```

---

## 🔑 Dominio de Datos y Motores de Conversión

### 1. Modelo de Datos Relacional (`src/types/relational.ts`)
- `RelationalColumn`: Nombre, tipo de dato (`VARCHAR`, `INTEGER`, etc.), `isPrimaryKey`, `isNullable`, `isUnique`, `defaultValue`, `checkExpression`.
- `ForeignKeyConstraint`: Columnas origen, Tabla destino, Columnas destino, `onDelete` (`CASCADE`, `SET NULL`, `RESTRICT`), `onUpdate`.
- `RelationalTable`: Nombre, lista de `RelationalColumn`, lista de `ForeignKeyConstraint`, `sourceEERConcept` (trazabilidad al paso del algoritmo 1-9).
- `RelationalSchema`: Lista de `RelationalTable` y opciones de mapeo elegidas (ej. `Option8A` para herencia).

### 2. Motor EER ➔ Relacional (`src/utils/relational/eerToRelational.ts`)
Sigue estrictamente la especificación de **9 Pasos** en `dbv-specs-ops/docs/eer-to-relational-mapping.md`:
- **Paso 1:** Filtra `NodeType === 'entity'` y genera tablas con sus columnas primarias.
- **Paso 2:** Filtra `NodeType === 'weak_entity'`, busca propietario por `identifying_relationship` y construye PK combinada.
- **Paso 3:** Mapea relaciones 1:1 según opción (FK propagada, mezclada o tabla cruzada).
- **Paso 4:** Mapea relaciones 1:N propagando PK del lado 1 como FK al lado N.
- **Paso 5:** Mapea relaciones M:N creando tabla puente con PK = {FK1, FK2}.
- **Paso 6:** Extrae `multivalued_attribute` a tabla secundaria.
- **Paso 7:** Procesa relaciones n-arias ($n > 2$) en tablas de $N$-vías.
- **Paso 8:** Procesa nodos `specialization` aplicando opciones 8A, 8B, 8C o 8D.
- **Paso 9:** Procesa nodos `union` / categorías (Caso 9.1 con clave sustituta o Caso 9.2).

### 3. Motor SQL DDL (`src/utils/relational/relationalToSQL.ts`)
Genera sentencias DDL limpias formateadas con sangría, comentarios explicativos por tabla indicando la regla del algoritmo origen, e instrucciones `CREATE TABLE`, `PRIMARY KEY`, `FOREIGN KEY` e `INDEX`.

### 4. Compilador, Linter EER y Resiliencia (`src/utils/compiler.ts`, `src/components/ErrorBoundary.tsx`)
Pipeline de validación previa y contención de errores:
- **Compilador EER (`src/utils/compiler.ts`)**:
  - `compileEER(code: string): CompileResult`: analiza línea a línea, clasifica diagnósticos en `error` (bloqueante) y `warning` (semántico/pedagógico).
  - Solo genera `NodeData[]` y `LinkData[]` a partir de líneas válidas, asegurando que ningún nodo contenga `id` o `label` indefinidos.
- **Estrategia Stale-while-error (`src/hooks/useEERParser.ts`)**:
  - Si `compileEER` detecta errores bloqueantes mientras el usuario escribe, el hook retiene en memoria (`lastValidNodesRef`, `lastValidLinksRef`) el último estado correcto para que el Canvas y el Modelo Relacional no sufran parpadeos ni desmontajes.
  - Expone `{ nodes, links, diagnostics, isValid }`.
- **Barra de Diagnósticos (`src/components/CodePanel.tsx`)**:
  - Renderiza el estado de compilación al pie del editor: éxito en verde con conteo de elementos o advertencia/error con número de línea y mensaje explicativo i18n.
- **ErrorBoundary React (`src/components/ErrorBoundary.tsx`)**:
  - Atrapa fallos no controlados en el árbol de componentes, preservando el código del usuario en `localStorage` y ofreciendo una vista de recuperación en lugar de un crash completo.

### 5. Compilador y Diagnósticos del Modelo Relacional (`src/utils/relational/relationalCompiler.ts`) `[NUEVO]`
- **Compilador DSL Relacional (`compileRelationalDSL`)**:
  - Parsea bloques `table NOMBRE [x: N, y: N] { ... }` validando llaves de apertura y cierre, declaraciones de columnas, PKs y sintaxis estricta de FK (`COL TIPO FK -> TABLA(COL_DESTINO) [ON DELETE ...]`).
  - Emite diagnósticos sintácticos (`error`) y semánticos (`warning`: integridad referencial ante tablas o columnas destino no declaradas, tablas sin PK, nombres duplicados).
  - `parseRelationalDSL(code)` delega en `compileRelationalDSL(code)`.
- **Estrategia Stale-while-error en Pestaña Relacional**:
  - `EERDiagramer.tsx` retiene el último esquema relacional válido si el usuario introduce errores sintácticos al editar el DSL relacional, previniendo la desaparición súbita de tablas (*flickering*).
  - Conecta los diagnósticos del DSL relacional con la barra inferior de `CodePanel`.

### 6. Usabilidad del Editor EER y Política Referencial (v1.6.0) `[NUEVO]`
- **Modelo de datos EER (`src/types/index.ts`):**
  - `NodeData.definingAttribute?: string` — atributo definidor de una especialización (`spec d -> SUPER [ATTR]`).
  - `LinkData.lineIndex?: number` — línea del DSL que declara el enlace. Permite localizar y reescribir las líneas `link` que "pertenecen" a una relación, especialización o unión sin volver a parsear el texto.
- **Compilador EER (`src/utils/compiler.ts`):**
  - Parsea `[ATTR]` en `spec` (error `INVALID_DEFINING_ATTRIBUTE` si está vacío o no es identificador) y pone su nombre como `label` de la arista superclase–círculo.
  - Anti-solapamiento en lectura: un atributo con coordenadas explícitas idénticas a las de un nodo anterior se desplaza +100 px en X (solo en el modelo visual; el texto no se reescribe).
  - Linter: `KEY_ATTRIBUTE_ON_NON_MN_RELATIONSHIP` (warning) si un `key_att` cuelga de una relación binaria con algún lado de cardinalidad 1.
- **Edición de DSL como transformaciones puras (`src/utils/dslEditing.ts`):** funciones `string → string` testeables, sin React:
  - `getOwnedLineIndices(node, links)` — líneas de declaración + `link` propias de un nodo (resaltado y reescritura).
  - `renameReferences(code, oldLabel, newLabel, skipLines)` — renombrado por token (fuera de comillas y coordenadas, nunca el comando).
  - `replaceElementBlock(code, ownedLines, newBlock)` — sustituye el bloque de un elemento conservando su posición en el fichero.
- **Layout (`src/utils/layout.ts`):** `findFreePosition(x, y, occupied)` — desplaza +100 px en X hasta no solapar (cota de iteraciones).
- **Edición visual:** `useModalState` gana `editingNodeId` (null = creación). `EERDiagramer` rellena el estado del formulario desde el nodo (`buildEditState`) y, al confirmar, genera el bloque nuevo con los generadores de `codeGenerator.ts` (ahora con coordenadas opcionales en `spec`/`union` y `definingAttribute`).
- **Selección múltiple y arrastre de grupo (`useCanvasInteraction`):** `selectedNodeIds: string[]` sustituye a `selectedNodeId`. El conjunto a mover = selección ∪ descendientes-atributo (por `parentEntity`, recursivo) salvo con `Alt`. Al soltar, cada nodo movido actualiza su propia línea con `updateNodePosition`.
- **Resaltado en `CodePanel`:** capa de fondo absolutamente posicionada detrás de un `<textarea>` transparente con `wrap="off"`; la posición de cada banda = `padding + línea × lineHeight − scrollTop` (lineHeight medido con `getComputedStyle`). No se enfoca el textarea (enfocarlo deseleccionaría el nodo vía `onEditStart`).
- **Política referencial:** `eerToRelational.ts` asigna `onDelete` y nulabilidad por paso (tabla en SPECIFICATIONS §3.7.A). `relationalCodeGenerator.ts` emite siempre `ON DELETE <acción>` y `NOT NULL` en FKs obligatorias; `relationalCompiler.ts` acepta las 4 acciones (omitida ⇒ `NO ACTION`); `relationalToSQL.ts` las emite por dialecto (Oracle: solo `CASCADE`/`SET NULL`).

### 7. Centro de Ayuda (v1.6.0) `[NUEVO]`
- **`src/components/help/`**: `HelpCenter.tsx` (marco del modal y navegación lateral por pestañas) + un componente por pestaña: `EditorUsageTab`, `SyntaxTab`, `StepGuideTab`, `AIPromptTab`, `AboutTab`. Sustituyen y eliminan `ModalHelp`, `StepInspectorModal`, `ModalAIPrompt` y `ModalCredits` (su contenido se traslada, no se duplica).
- **Contenido como datos**: los ejemplos de sintaxis (`src/components/help/syntaxExamples.ts`) y las filas de "Uso del editor" son arrays de claves i18n, lo que permite testear que cada ejemplo EER compila con `compileEER` y que cada clave existe en ES y EN (el tipo `TranslationKey` lo garantiza en compilación).
- **Prompt IA bilingüe**: `src/i18n/aiPrompt.ts` exporta `getAIPrompt(lang)`.
- **Estado**: `src/hooks/useHelpCenter.ts` — `{ isOpen, tab, inspectedTable, openHelp(tab?, table?), setTab, close }`; persiste la última pestaña en `localStorage` con `try/catch`. `F1` la abre desde `EERDiagramer`. Los flags `showHelp`/`showCredits`/`showAIPrompt` salen de `useModalState`.
- **Versión**: `vite.config.ts` inyecta `__APP_VERSION__` leyendo `package.json` (declarado en `src/globals.d.ts`), para que "Acerca de" no quede desfasado en cada release.

---

## 🖥️ Roadmap Nativo de Escritorio (`dbv-tauri-starter`)
Una vez implementada y probada la suite web de conversión EER ↔ Relacional ↔ SQL:
1. Se inicializará la capa de Tauri v2 mediante `dbv-tauri-starter`.
2. Se mantendrá el modo dual: la versión web compilará como SPA estática (GitHub Pages) y la versión de escritorio como binario nativo (.exe / .app / .deb).

