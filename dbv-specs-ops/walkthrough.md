# Walkthrough — eer-studio v1.8.0

> Fecha: 2026-11-24 · Origen: sugerencias de mejora de María del Mar Roldán García, segundo correo de Enrique Soler Castillo (modelo relacional) y uso real de la edición Moodle en el Campus Virtual de la UMA.
> Especificación: `docs/SPECIFICATIONS.md` §3.11 (A–L) · Arquitectura: `docs/ARCHITECTURE.md` §9 · Plan: `implementation_plan.md` (bloques B0–B8) · Detalle: `CHANGELOG.md` `[1.8.0]`.

## Qué se entrega

| Área | Cambio | Dónde |
| --- | --- | --- |
| Compatibilidad | Instantáneas de la v1.7.0 (ejemplo inicial, ejemplos de la ayuda, plantilla del hotel): los diagramas existentes compilan igual | `src/compat/` |
| Notación EER | Clave parcial (`partial_key_att`, subrayado discontinuo), especialización parcial (`spec d -> X partial`), roles (`role:Nombre`), claves alternativas (`key_att … unique`, «UK») | `utils/compiler.ts`, `NodeRenderer`, `LinkRenderer`, `codeGenerator.ts` |
| Correcciones del EER | Compuestos dibujados y mapeados a columnas; recursivas con líneas paralelas y nombres de FK únicos | `compiler.ts`, `parallelLinks.ts`, `eerToRelational.ts` |
| Modelo relacional | Ya no va un cambio por detrás del EER; FK compuestas, `UNIQUE` y FK sin tipo en el DSL relacional; tipos editados conservados, propagados a las FK y guardados en el `.eer` | `useEERParser`, `relationalCompiler.ts`, `typeOverrides.ts`, `relationalToSQL.ts` |
| Formularios | Relaciones de cualquier grado con lista de participantes y roles; «Pertenece a» con atributos (compuestos) y propietario preseleccionado; clave parcial y clave alternativa | `ModalProperties`, `usePropertiesForm`, `dslEditing.ts` |
| Deshacer | `Ctrl+Z`/`Ctrl+Y` y botones ↶ ↷ en la edición completa y en Moodle; tecleo agrupado por pausas | `codeHistory.ts`, `useCodeHistory` |
| Linter | Avisos de entidades débiles (sin identificativa, sin clave parcial, `key_att` en débil), clave parcial en fuerte, recursiva sin roles, `FK_NOT_REFERENCING_KEY`, `FK_TYPE_MISMATCH` | `compiler.ts`, `relationalCompiler.ts` |
| Pantalla completa | Moodle (con aviso si el reproductor la bloquea y barra adaptable), web y escritorio (ventana Tauri, `F11`/`Esc`) | `fullscreen.ts`, `useFullscreen` |
| Documentación | Ayuda (ejemplos, atajos, diagrama de referencia de Elmasri que además es test), prompt IA ES/EN con toda la notación, README ES/EN, guía del profesor (MD + PDF) | `components/help/`, `i18n/aiPrompt.ts`, `docs/moodle/` |

### Revisión de código antes de la entrega (2026-11-24)

Una revisión de la rama encontró 10 problemas, corregidos antes del commit de versión: borrar una clave parcial no hacía nada; borrar un compuesto homónimo pasaba sus componentes al otro; una relación escrita a mano con menos de dos participantes no se podía guardar desde el formulario; un comentario `//` al final de un `spec` bloqueaba el diagrama; los tipos relacionales sobrevivían a *Limpiar*; la cabecera `// RELATIONAL TYPES` se acumulaba en cada guardar/abrir; nombres `UQ_…` de más de 30 caracteres en Oracle; error sin capturar de la pantalla completa nativa; claves de React repetidas en «Pertenece a»; roles que empiezan por dígito.

## Verificación

- **266 tests** (Vitest), `tsc -b`, `eslint`, `npm run build` y `npm run build:moodle:release` limpios.
- Smoke Playwright del editor (`scripts/smoke-editor.mjs`): **26/26**.
- Smoke Playwright de Moodle (`scripts/smoke-moodle.mjs dist-moodle/examen-bd-hotel-prueba.html`): **36/36**, con la red bloqueada y reproductor SCORM simulado (pantalla completa permitida y bloqueada).

## Decisiones registradas (memory.md)

- `spec … partial` sin marca = total (compatible con la v1.7.0); `role:Nombre`; varios `key_att` siguen formando la PK compuesta y `unique` marca las alternativas.
- Los tipos editados en el relacional se guardan como líneas `relational TABLA.COLUMNA : TIPO`, que la v1.7.0 ignora sin error.
- En un iframe del mismo origen (reproductor SCORM de Moodle) la pantalla completa se permite sin `allowfullscreen`.
- La restricción de igualdad de roles en uniones se descarta; el soporte táctil pasa a la v1.9.0.
