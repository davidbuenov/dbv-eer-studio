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
- [x] **Rename del Repositorio a `dbv-eer-studio`**: hecho en GitHub (`gh repo rename`), remote local, workflow de Pages y README.
- [x] **Paso 7 (relaciones n-arias) implementado**: confirmado que el DSL (`link relacion entidad cardinalidad`) y el parser ya soportaban conectar 3+ entidades a una relación sin cambios; solo faltaba el motor de conversión. Añadido en `eerToRelational.ts` siguiendo la regla formal de `eer-to-relational-mapping.md` (PK = combinación de FKs, excepto la de la entidad con cardinalidad 1).
- [ ] **Deuda técnica — Exportar SVG del Modelo Relacional**: las tarjetas son HTML (no SVG), por lo que el botón "Exportar SVG" solo funciona en la pestaña Diagrama EER. Requeriría un renderer SVG puro de las tarjetas relacionales.
- [ ] **Deuda técnica — Build multiplataforma**: el empaquetado Tauri solo se ha compilado y probado en Windows; falta validar macOS/Linux.
- [x] **GitHub Releases**: `v1.2.0` publicado en https://github.com/davidbuenov/dbv-eer-studio/releases/tag/v1.2.0 con `.msi` y `-setup.exe`.
- [ ] **Microsoft Store**: empaquetado MSIX listo y probado (ver Hito 5); falta reservar identidad real en Partner Center (acción del usuario, no automatizable), capturas, política de privacidad y descripción de la ficha. Ver `dbv-specs-ops/docs/MICROSOFT_STORE.md`.
- [ ] **Uptodown u otro catálogo**: no iniciado.
- [ ] **Decisión pendiente — firma en CI**: los 3 workflows de release están sin firmar/sin auto-actualización a propósito. Firmar en CI implicaría subir la clave privada del updater como secret de GitHub Actions, a diferencia de `dbv-md-reader` (que firma Windows siempre en local). Sin decidir todavía.
- [ ] **Internacionalización (ES/EN)**: pendiente, tarea aparte de este ciclo — necesaria antes de publicar en marketplaces (mismo criterio que `dbv-teleprompter`/`dbv-md-reader`, que ya la tienen). Requiere extraer las cadenas de texto de todos los componentes a un `i18n.ts`/equivalente y un selector de idioma en la UI.

---

## 🔄 Context Snapshot / Snapshot de Contexto

> **Last update / Última actualización:** 2026-08-23
> **Punto exacto:** Sesión larga de continuación del empaquetado nativo, en 3 tandas: (1) auditoría y arreglo de defectos reales en el `.exe` (zoom, drag, icono, exportar SVG, créditos); (2) `/code-simplify` + `/test` + `/ship` → v1.2.0 publicado (commit, tag, push, GitHub Release) más el Paso 7 (relaciones n-arias) que se detectó como hueco durante los tests; (3) plan grande de distribución completa (auto-actualización, menú nativo macOS, chincheta always-on-top, 3 workflows de CI, MSIX para Microsoft Store), ejecutado tras aprobación explícita del usuario.
> **Nota de sesión / Feedback del usuario:** Verificado en el ejecutable real por el usuario en la tanda 1 — "todo bien", "ahora va perfecto". En la tanda 3, el usuario corrigió una idea equivocada mía (que `dbv-tauri-starter` ya documentaba el menú nativo de macOS — no era cierto, solo vivía en el código de `dbv-md-reader`) y pidió backportear esa lección a los repos compartidos.
> **Estado:** v1.2.0 en producción (web + GitHub Releases). Hito 5 sustancialmente completado en Windows, incluyendo preparación de Microsoft Store (MSIX probado de extremo a extremo, bloqueado solo por la reserva de identidad en Partner Center). Pendiente: exportar SVG del Modelo Relacional, validar build real en macOS/Linux, decidir firma en CI, internacionalización, y que el usuario revise/haga push de los 2 commits de documentación dejados en `dbv-specs-ops` y `dbv-tauri-starter`.




