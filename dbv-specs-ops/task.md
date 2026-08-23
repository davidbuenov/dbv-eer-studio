# Backlog - eer-studio

## Contexto del Proyecto (Context Snapshot)
* **Objetivo**: Desarrollar la suite completa de modelado de bases de datos bajo SDD (`dbv-specs-ops`), incorporando conversión EER ➔ Relacional (9 Pasos), Editor de Modelo Relacional, Exportador SQL DDL, Ingeniería Inversa (Relacional ➔ EER) y posterior empaquetado nativo de escritorio (`dbv-tauri-starter`).
* **Estado actual**: Fase `/spec` completada. Especificaciones (`SPECIFICATIONS.md`) y Arquitectura (`ARCHITECTURE.md`) actualizadas con el diseño formal del modelo relacional y las 9 reglas de conversión (`eer-to-relational-mapping.md`).
* **Próximo paso**: Presentar el plan `/plan` detallado con la revisión adversaria de arquitectura (Adversarial Architect Review) y desglose de tareas en `implementation_plan.md` para aprobación del usuario antes de iniciar `/build`.

## Checklist de Tareas

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
    - [ ] Validar build en macOS/Linux (solo se ha probado Windows).
- [x] **Fase `/test`: Pruebas Unitarias e Integración**
  - [x] Pruebas unitarias para los 9 pasos de `eerToRelational.ts` (incluye Paso 7, relaciones n-arias, añadido tras detectarse como hueco) con Vitest.
  - [x] Pruebas del generador de SQL `relationalToSQL.ts` (Oracle, PostgreSQL, SQLite; PK/FK/NULL).
- [x] **Fase `/code-simplify`**: Refactorización, eliminación de código muerto (`platform.ts`) y corrección de errores de lint (`relationalParser.ts`); build y lint verificados sin errores.
- [x] **Fase `/ship`**: Versión 1.2.0. README, CHANGELOG, créditos y scripts actualizados; commit/tag pendientes de confirmación del usuario.

## 📌 Tareas Pendientes / Roadmap Futuro
- [x] **Rename del Repositorio a `dbv-eer-studio`**: hecho en GitHub (`gh repo rename`), remote local, workflow de Pages y README.
- [x] **Paso 7 (relaciones n-arias) implementado**: confirmado que el DSL (`link relacion entidad cardinalidad`) y el parser ya soportaban conectar 3+ entidades a una relación sin cambios; solo faltaba el motor de conversión. Añadido en `eerToRelational.ts` siguiendo la regla formal de `eer-to-relational-mapping.md` (PK = combinación de FKs, excepto la de la entidad con cardinalidad 1).
- [ ] **Deuda técnica — Exportar SVG del Modelo Relacional**: las tarjetas son HTML (no SVG), por lo que el botón "Exportar SVG" solo funciona en la pestaña Diagrama EER. Requeriría un renderer SVG puro de las tarjetas relacionales.
- [ ] **Deuda técnica — Build multiplataforma**: el empaquetado Tauri solo se ha compilado y probado en Windows; falta validar macOS/Linux.
- [ ] **Publicación en marketplaces**: pendiente de ejecutar el checklist de `dbv-specs-ops/docs/MARKETPLACE_PUBLISHING.md`.

---

## 🔄 Context Snapshot / Snapshot de Contexto

> **Last update / Última actualización:** 2026-08-23
> **Punto exacto:** Sesión de continuación del empaquetado nativo (tras un intento previo fallido con Antigravity). Se auditó el estado real de `src-tauri/` (que sí compilaba y generaba `.exe`/MSI/NSIS correctamente) y se corrigieron los defectos funcionales reales detectados al probar el ejecutable: zoom con Ctrl+rueda, arrastre en Modelo Relacional, icono por defecto de Tauri, botón "Exportar SVG" sin efecto en Relacional, y año/nombre desactualizados en Créditos.
> **Nota de sesión / Feedback del usuario:** Verificado en el ejecutable real por el usuario — "todo bien", "ahora va perfecto". La sesión anterior había quedado con el usuario molesto por no ver la renderización nativa; en esta sesión el renderizado ya funcionaba bien de partida (el problema no era la renderización sino comportamientos concretos del WebView2).
> **Estado:** Hito 5 sustancialmente completado en Windows. Pendiente: exportar SVG del Modelo Relacional (fuera de alcance, requiere nuevo renderer) y validar build en macOS/Linux.




