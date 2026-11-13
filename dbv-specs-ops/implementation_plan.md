---
dependencies:
  - "react: ^19.2.0, lucide-react: ^0.555.0 (ya presentes)"
  - "vite (dev, ya presente) — build adicional con vite.config.moodle.ts"
  - "node:zlib (crc32/deflateRaw, Node >= 22.2) para generar el zip SCORM — sin dependencias npm nuevas"
risks:
  - "El editor de texto en línea de Moodle (TinyMCE) altera el bloque pegado: <p>/<br> por línea, entidades (&gt; &amp; &nbsp;), espacios colapsados."
  - "navigator.clipboard.writeText bloqueado dentro del iframe del reproductor SCORM (sin allow=clipboard-write) o por SEB."
  - "Autoguardado en localStorage visible para el siguiente alumno en un PC compartido sin SEB."
  - "El build single-file arrastra código de Tauri/relacional (imports dinámicos) o deja alguna petición de red, rompiendo el modo sin internet."
  - "Plantilla de partida con '</script>' o caracteres especiales que rompan el HTML al incrustarla."
  - "Regresión en la edición actual por los cambios en ficheros compartidos (HelpCenter, i18n)."
rollback_strategy: "Todo va en ficheros nuevos (src/moodle/, moodle.html, vite.config.moodle.ts, scripts/build-moodle.mjs, docs/moodle/) salvo dos cambios aditivos compartidos: prop opcional `tabs` en HelpCenter (por defecto, todas) y claves nuevas en es.ts/en.ts. Rollback = git revert del commit. `npm run build` y los 138 tests actuales no cambian; se comprueba antes de cerrar."
---

# Plan de Implementación: Edición Moodle para Exámenes EER

Implementa `SPECIFICATIONS.md §3.10`. Sustituye al plan de v1.6.0, ya entregado (queda en el historial de git, commit `51eab62`).

## Adversarial Architect Review

```xml
<architect_review>
  <builder>Nuevo punto de entrada `moodle.html` → `src/moodle/MoodleExamApp.tsx`, que reutiliza Toolbar, CodePanel, Canvas, useEERParser y HelpCenter sin importar EERDiagramer (así el relacional, el SQL y Tauri quedan fuera del bundle). Build propio que inlina JS/CSS en un único HTML, incrusta la plantilla y lo empaqueta en un SCORM 1.2 como el de "El subrayador". Entrega: bloque con marcadores + suma de control copiado al texto en línea de la Tarea.</builder>
  <adversary>(1) TinyMCE convierte el bloque del DSL en HTML (<p> por línea, &gt; en las flechas "->", &nbsp;): el profesor no podría reconstruir el diagrama ni el script de corrección leerlo. (2) La Clipboard API exige permiso clipboard-write, que el iframe del reproductor SCORM de Moodle probablemente no concede, y SEB puede restringir el portapapeles: el botón "Copiar para entregar" fallaría en silencio en pleno examen. (3) Con el autoguardado en localStorage, el siguiente alumno del mismo PC abriría el diagrama EER del anterior. (4) Un import dinámico olvidado (p. ej. @tauri-apps/api desde AboutTab o platform.ts) generaría un chunk aparte que el HTML único no contiene: pantalla en blanco sin internet. (5) Si el DSL está en estado inválido (Stale-while-error), ¿qué se entrega: el texto o el último diagrama válido?</adversary>
  <builder>(1) `decodeSubmission` limpia HTML (bloques → saltos de línea, entidades, &nbsp;) antes de buscar los marcadores, y valida la suma de control; tests con HTML real de TinyMCE. (2) Cadena de respaldo: Clipboard API → execCommand('copy') con textarea oculto → modal con el bloque ya seleccionado para Ctrl+C. Siempre se avisa del resultado. (3) Clave de autoguardado por examen (hash de plantilla + id de build) con caducidad de 12 h, botón "Nuevo examen" y recomendación en la guía (SEB borra los datos al salir). (4) `inlineDynamicImports`, verificación automática de que el HTML no tiene `src=`/`href=` externos y smoke test con la red bloqueada. (5) Se entrega siempre el texto DSL tal cual (es lo que el alumno ve y lo que se corrige); si hay errores del linter, se avisa antes de copiar pero no se impide.</builder>
  <adversary>Riesgo residual: en un PC compartido sin SEB, dentro de la ventana de 12 h y con el mismo paquete, otro alumno podría ver el autoguardado del anterior si este no pulsó "Nuevo examen".</adversary>
  <builder>Aceptado conscientemente (el aula usa SEB o PCs por alumno; la entrega válida es la de la Tarea, que es personal) y registrado en memory.md.</builder>
</architect_review>
```

## Cambios Propuestos

### Bloque 1 — Utilidades puras (`src/moodle/`, con tests)
- `submission.ts`: `encodeSubmission(dsl, meta)` / `decodeSubmission(text | html)` con marcadores `=== EER-STUDIO BEGIN v1 ===` … `=== EER-STUDIO END ===`, versión, fecha y suma de control (FNV-1a del DSL normalizado).
- `autosave.ts`: lectura y escritura en `localStorage` en `try/catch`, clave por examen y caducidad.
- `scorm12.ts`: busca `API` en `window.parent`/`opener` (hasta 7 niveles); `start()` → `incomplete`, `complete()` → `completed`, `LMSFinish` al descargar la página; sin API no hace nada.
- `clipboard.ts`: cadena de respaldo del portapapeles.
- `template.ts`: lee la plantilla incrustada (`<script id="eer-template" type="application/json">`).

### Bloque 2 — Interfaz del examen
- `moodle.html` + `src/moodle/main.tsx` + `MoodleExamApp.tsx` (shell, sin pestañas Relacional/SQL ni menú Archivo).
- `ExamActionsBar.tsx`: Copiar para entregar · Descargar .eer · Pegar entrega · Nuevo examen · Ayuda (F1) · ES/EN · versión.
- `ModalPasteSubmission.tsx` y `ModalCopyFallback.tsx`.
- Compartido (aditivo): prop opcional `tabs` en `HelpCenter` (el examen usa `['usage', 'syntax']`); claves nuevas `moodle.*` en `es.ts`/`en.ts`.

### Bloque 3 — Build y empaquetado
- `vite.config.moodle.ts` (entrada `moodle.html`, salida `dist-moodle/`, assets e imports dinámicos inlinados).
- `scripts/build-moodle.mjs`: build → inlinar JS/CSS en un único HTML → incrustar la plantilla (`--template`, con `<` escapado como `<`) → `imsmanifest.xml` SCORM 1.2 → zip (`node:zlib`). Salida: `dist-moodle/eer-studio-examen.html` y `eer-studio-examen_scorm12.zip`.
- `package.json`: script `build:moodle`. `.gitignore`: `dist-moodle`.

### Bloque 4 — Documentación
- `docs/moodle/GUIA_PROFESOR.md`: generar el paquete, crear el SCORM y la Tarea, ajustes de cierre (Enviar obligatorio, fechas límite y de corte, Reabrir = Nunca, texto en línea sin límite de palabras), SEB y cómo descargar y visualizar las entregas.
- `ARCHITECTURE.md` (nueva sección), `README.md`/`README.en.md` (apartado breve) y `CHANGELOG.md` `[Sin publicar]`.

## Plan de Verificación
- Tests unitarios: ida y vuelta de `encode`/`decode`, HTML de TinyMCE (`<p>`, `<br>`, `&gt;`, `&nbsp;`), suma de control alterada, bloque ausente o duplicado; autosave con `localStorage` bloqueado y caducado; SCORM con API simulada y sin API; plantilla con `</script>`.
- Regresión: los 138 tests actuales en verde, `npm run lint` y `npm run build` con la misma lista de ficheros en `dist/`.
- Smoke con Playwright sobre `file://` y **toda la red bloqueada**: arranca con la plantilla, dibujar → recargar → recupera el autoguardado → copiar → pegar el bloque envuelto en HTML → mismo DSL; `completed` con una API SCORM simulada en el frame padre.
- Validación manual del autor: subir el SCORM a un curso de pruebas del Moodle de la UMA, con y sin SEB, y hacer una entrega completa.
