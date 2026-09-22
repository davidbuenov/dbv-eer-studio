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

---

## 🖥️ Roadmap Nativo de Escritorio (`dbv-tauri-starter`)
Una vez implementada y probada la suite web de conversión EER ↔ Relacional ↔ SQL:
1. Se inicializará la capa de Tauri v2 mediante `dbv-tauri-starter`.
2. Se mantendrá el modo dual: la versión web compilará como SPA estática (GitHub Pages) y la versión de escritorio como binario nativo (.exe / .app / .deb).

