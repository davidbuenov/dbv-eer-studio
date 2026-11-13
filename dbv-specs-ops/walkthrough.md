# Walkthrough — eer-studio v1.7.0

> Fecha: 2026-11-13 · Origen: petición del autor para usar EER Studio en exámenes de Bases de Datos en el Campus Virtual de la UMA (Moodle 5), en aulas sin internet y con Safe Exam Browser.
> Especificación: `docs/SPECIFICATIONS.md` §3.9 y §3.10 · Arquitectura: `docs/ARCHITECTURE.md` §8 · Plan: `implementation_plan.md` · Guía de uso: `docs/moodle/`.

## Qué se entrega

| Área | Cambio | Dónde |
| --- | --- | --- |
| Edición Moodle | Variante de examen independiente, solo con el editor EER, la ayuda reducida (*Uso del editor* y *Sintaxis*) y ES/EN | `moodle.html`, `src/moodle/MoodleExamApp.tsx`, `components/` |
| Empaquetado | HTML único sin peticiones de red dentro de un SCORM 1.2; plantilla y título opcionales (`--template`, `--title`); verificación automática de que no quedan referencias externas | `vite.config.moodle.ts`, `scripts/build-moodle.mjs` |
| Persistencia | Autoguardado por examen en `localStorage` (caduca a las 12 h) con volcado al salir de la página | `src/moodle/autosave.ts`, `useExamSession.ts` |
| Entrega | «Copiar para entregar»: bloque con crédito de autoría, metadatos y suma de control para el texto en línea de una Tarea; respaldo si el portapapeles está bloqueado; aviso si el código tiene errores | `src/moodle/submission.ts`, `clipboard.ts` |
| Corrección | «Cargar entrega» reconstruye el diagrama desde el texto o el HTML de Moodle y avisa si se manipuló | `submission.ts`, `components/SubmissionModals.tsx` |
| SCORM | `incomplete` al abrir, `completed` al copiar; sin API funciona igual | `src/moodle/scorm12.ts` |
| Distribución | Paquetes oficiales versionados con nombres fijos (vacío, ejemplo «Hoteles Royal UMA» y visor HTML) | `dist-moodle/`, `scripts/build-moodle-release.mjs` |
| Documentación | Guía del profesor en Markdown y PDF (Typst; diseño del autor), con enlaces a `dist-moodle/` y `docs/moodle/` en GitHub | `docs/moodle/` |
| Ayuda compartida | `HelpCenter` con `variant="exam"` (aditivo; la edición completa no cambia) | `components/help/` |
| Escritorio | Sin botón «Buscar actualizaciones» ni plugins de actualización (§3.9): Windows se actualiza desde Microsoft Store | `src-tauri/` |

## Verificación
- **166 tests** (28 nuevos de la edición Moodle: bloque de entrega con HTML de TinyMCE, suma de control, crédito de autoría, autoguardado, SCORM, portapapeles y configuración).
- `tsc -b`, `npm run lint` y `npm run build` limpios; `dist/` mantiene la misma estructura de ficheros.
- Smoke test Playwright `scripts/smoke-moodle.mjs`: **26/26** con toda la red bloqueada (plantilla, autoguardado tras recargar, copiar, cargar desde HTML, manipulación, bloque incompleto, errores, empezar de nuevo, ayuda reducida, inglés, respaldo del portapapeles y reproductor SCORM simulado).
- **Validación del autor en el Campus Virtual de la UMA** con el navegador normal: el SCORM se carga y «Copiar para entregar» funciona dentro del reproductor. **Pendiente: prueba con Safe Exam Browser.**

## Decisiones registradas (memory.md)
- La edición Moodle es otro punto de entrada que no importa `EERDiagramer`. La entrega válida es la Tarea de Moodle, que es la que garantiza el bloqueo; el SCORM es solo contenedor.
- Riesgo aceptado: autoguardado visible para el siguiente alumno en un PC compartido sin SEB (mitigado con la caducidad de 12 h y «Empezar de nuevo»).
- Deuda técnica aceptada: `MoodleExamApp` repite el cableado del editor EER.
- Lecciones: escapes Unicode convertidos en literales por las herramientas de escritura, `^` de `npm run` en Windows y retardo de `useEERParser` en los tests de extremo a extremo.
