# Walkthrough — eer-studio v1.6.0

> Fecha: 2026-09-26 · Origen: propuestas del colaborador **Enrique Soler Castillo** más dos ampliaciones pedidas por el autor durante la validación (selección por rectángulo y Centro de Ayuda).
> Especificación: `docs/SPECIFICATIONS.md` §3.7 y §3.8 · Arquitectura: `docs/ARCHITECTURE.md` §6 y §7 · Plan: `implementation_plan.md`.

## Qué se entrega

| Área | Cambio | Dónde |
| --- | --- | --- |
| Rigor del mapeo | Atributos clave de relación M:N / n-aria en la PK (caso `CIRCULA(PILOTO, TRAMO, VUELTA)`); atributos de relaciones 1:1; FK del Paso 3 en el lado total real | `utils/relational/eerToRelational.ts` |
| Política referencial | `ON DELETE` por paso: CASCADE (Pasos 2, 6, 8A), NO ACTION (FK obligatoria, M:N, n-aria), SET NULL (FK opcional, Paso 9); DSL relacional y SQL la respetan (Oracle omite NO ACTION/RESTRICT) | `eerToRelational.ts`, `relationalCodeGenerator.ts`, `relationalCompiler.ts`, `relationalToSQL.ts`, `i18n/steps.ts` |
| Especializaciones | Atributo definidor `spec d -> SUPER [ATTR]`: rótulo en la arista y columna en la superclase | `utils/compiler.ts`, `LinkRenderer.tsx`, `eerToRelational.ts` |
| Edición visual | Doble clic / F2 / Enter edita cualquier elemento; renombrado por posiciones sintácticas | `utils/dslEditing.ts`, `hooks/usePropertiesForm.ts`, `ModalProperties.tsx` |
| Selección y navegación | Ctrl + clic, rectángulo (enteros dentro, Ctrl suma), grupo, atributos que siguen (Alt = solo el nodo), botón derecho/central = desplazar, rueda, Ctrl + rueda = zoom al cursor | `hooks/useCanvasInteraction.ts`, `Canvas.tsx`, `utils/layout.ts` |
| Productividad | "Añadir y crear otro", atributos de relación en el formulario, anti-solapamiento, resaltado en el DSL del elemento seleccionado, borrado múltiple seguro con atributos homónimos | `usePropertiesForm.ts`, `CodePanel.tsx`, `deleteNode.ts` |
| Ayuda | Centro de Ayuda (botón + F1) con Uso del editor, Sintaxis, Guía de 9 Pasos, Prompt IA (ES/EN) y Acerca de; acceso contextual desde 📖; sustituye a 4 modales | `components/help/`, `hooks/useHelpCenter.ts`, `i18n/aiPrompt.ts` |
| Multiidioma | Menú Archivo, ErrorBoundary y tooltip de diagnósticos traducidos; versión de "Acerca de" desde `package.json` | `i18n/`, `ErrorBoundary.tsx`, `vite.config.ts` |
| Interfaz | Toolbar sin pista de gestos y cabecera sin la etiqueta de subtítulo | `Toolbar.tsx`, `EERDiagramer.tsx` |

## Verificación
- **138 tests** (97 nuevos en el ciclo). Los tests de los bugs corregidos (PK de CIRCULA, política ON DELETE, SQL por dialecto, ejemplos de sintaxis) se verificaron en rojo quitando el arreglo.
- `npm run lint` limpio y `npm run build` correcto.
- Smoke tests Playwright en navegador real: flujos de edición (11 comprobaciones), navegación y rectángulo (12) y Centro de Ayuda (18), sin errores de consola.
- `.exe` de escritorio recompilado y validado manualmente por el autor.

## Decisiones registradas (memory.md)
- Tablas puente M:N y n-arias con `NO ACTION`; `CASCADE` solo con dependencia existencial.
- Edición visual como transformación pura del texto guiada por `lineIndex`, bloqueada con el DSL en error.
- Convención de navegación draw.io / Office sin botones de modo; soporte táctil aplazado a v1.7.0 (Pointer Events).
- El prompt de IA pasa a ser bilingüe (revisión del ADR i18n de 2026-08-23).

## Pendiente
- **v1.7.0 — soporte táctil** (task.md, roadmap).
- Deuda técnica previa anotada en task.md (FK compuestas en DSL relacional, opciones 8B/8C/8D, `spec d` duplicados, `link ENTIDAD atributo` sin dibujar).
- Publicación: generar el MSIX v1.6.0.0 y subirlo a Partner Center / Uptodown con las notas de versión ya actualizadas en `docs/store/`.
