# EER Studio · Edición Moodle — paquetes listos para usar

Paquetes SCORM 1.2 para hacer un **examen de modelado EER en Moodle**. Funcionan sin internet y están pensados para Safe Exam Browser.

| Fichero | Qué es |
| --- | --- |
| [`eer-studio-moodle-vacio_scorm12.zip`](./eer-studio-moodle-vacio_scorm12.zip) | Examen con el **editor vacío**. Se sube a Moodle como *Paquete SCORM*. |
| [`eer-studio-moodle-ejemplo-hotel_scorm12.zip`](./eer-studio-moodle-ejemplo-hotel_scorm12.zip) | Examen de **ejemplo**, que arranca con el diagrama del caso «Hoteles Royal UMA». Útil para probar el flujo completo. |
| [`eer-studio-moodle-vacio.html`](./eer-studio-moodle-vacio.html) | El examen vacío suelto: se abre con doble clic y sirve de **visor para corregir** las entregas («Cargar entrega»). |

Para descargar un fichero desde GitHub, ábrelo y pulsa el botón de descarga (*Download raw file*).

**Antes de usarlos, lee la [guía del profesor](../docs/moodle/)** ([PDF](../docs/moodle/GUIA_PROFESOR.pdf) · [Markdown](../docs/moodle/GUIA_PROFESOR.md)). Ahí se explica cómo configurar el SCORM y la Tarea de entrega para que la entrega quede bloqueada.

Para generar un paquete con tu propia plantilla de partida, sigue la sección 2.2 de la guía (`npm run build:moodle -- --template ...`).

Estos ficheros se regeneran en cada versión con `npm run build:moodle:release` y conservan siempre el mismo nombre.

---

*EER Studio · edición Moodle · © 2025-2026 David Bueno Vallejo · Universidad de Málaga · Licencia MIT · <https://github.com/davidbuenov/dbv-eer-studio>*
