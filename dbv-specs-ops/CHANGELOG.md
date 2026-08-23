# Changelog — eer-studio

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Sin publicar] / [Unreleased]

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
