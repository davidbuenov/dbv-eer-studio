// =============================================================================
// dbv-eer-studio — Guía del profesor de la edición Moodle (contenido)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
//
// Solo contenido: los estilos y componentes están en styles.typ.
// Se compila desde main.typ (que añade la portada).

#import "styles.typ": *

*EER Studio* es un editor de diagramas Entidad-Relación Extendido creado por *David Bueno Vallejo* (Universidad de Málaga), con licencia MIT. Su *edición Moodle* permite hacer un examen de modelado EER dentro del Campus Virtual. Es un único fichero que se sube como paquete SCORM.

#v(4pt)
#grid(
  columns: (1fr, 1fr, 1fr, 1fr),
  column-gutter: 8pt,
  ..(
    ("Sin internet", "Basta con que el navegador llegue al servidor Moodle."),
    ("Safe Exam Browser", "Pensado para funcionar dentro de SEB."),
    ("Solo EER", "Sin modelo relacional, SQL, prompt de IA ni ficheros."),
    ("Entrega bloqueada", "Moodle impide cambiarla una vez enviada o cerrada."),
  ).map(((t, d)) => block(
    width: 100%, height: 2.1cm, fill: slate-soft, inset: 8pt, radius: 4pt,
    {
      text(9.5pt, weight: "bold", fill: indigo-dark, t)
      v(2pt)
      set par(justify: false)
      text(8.5pt, d)
    },
  ))
)

// =============================================================================
= La idea: dos actividades
// =============================================================================

El examen se monta con *dos actividades*, una junto a otra en la misma sección del curso:

#grid(
  columns: (1fr, 1fr),
  column-gutter: 10pt,
  activity-card(
    "①", "Paquete SCORM «Examen EER»", "Para dibujar",
    [El alumno *dibuja* el diagrama, con el ratón o escribiendo código. Se autoguarda en el navegador.
    Es solo la mesa de trabajo: *no guarda nada en Moodle*.],
  ),
  activity-card(
    "②", "Tarea «Entrega del examen EER»", "Para entregar",
    [El alumno *pega* su diagrama en el texto en línea y pulsa «Enviar tarea».
    *Es lo único que cuenta y lo único que corriges.*],
    accent: emerald, soft: emerald-soft,
  ),
)

#block(breakable: false)[
== El recorrido del alumno

#grid(
  columns: (1fr, 16pt, 1fr, 16pt, 1fr, 16pt, 1fr),
  rows: 3.15cm,
  step(1, "Abre", [Entra en el SCORM: el editor arranca con la plantilla del examen.]),
  arrow,
  step(2, "Dibuja", [Con el ratón o escribiendo código. Todo se autoguarda en el navegador.]),
  arrow,
  step(3, "Copia", [Pulsa *«Copiar para entregar»*. Aparece el aviso verde «Copiado…».]),
  arrow,
  step(4, "Entrega", [En la Tarea: pega (Ctrl+V), *Guardar cambios* y *«Enviar tarea»*.], accent: emerald, soft: emerald-soft),
)
#v(4pt)
]

#callout(title: "Después de entregar")[
  Si el alumno vuelve al SCORM puede seguir dibujando, pero *eso ya no cambia lo que entregó*. La entrega válida es la de la Tarea.
]

#shot("img/examen-alumno.png", [El examen tras pulsar «Copiar para entregar». Dentro de Moodle aparece en el reproductor SCORM.])

== El bloque de entrega

Lo que el alumno pega en la Tarea tiene este aspecto:

#[
  #show raw: set text(size: 6.6pt)
  ```text
  === EER-STUDIO BEGIN v1 ===
  // EER Studio · edición Moodle · © 2025-2026 David Bueno Vallejo (Universidad de Málaga) · https://github.com/davidbuenov/dbv-eer-studio
  // eer-studio-moodle app=1.7.0 exam=exam-01b5a86c date=2026-11-13T06:25:56.429Z checksum=9188dc84
  ent HOTEL (150, 100)
  key_att Nombre -> HOTEL (59, -2)
  ...
  === EER-STUDIO END ===
  ```
]

- La *primera línea de comentario* es el crédito de autoría de EER Studio. Va en todas las entregas y en todos los `.eer` descargados.
- La *segunda* son los metadatos: versión, examen, fecha y hora de la copia (UTC) y *suma de control*. La suma de control permite detectar si el texto se modificó a mano después de copiarlo.
- Después viene el *código DSL* del diagrama, que es lo que se corrige.

// =============================================================================
= Conseguir el paquete del examen
// =============================================================================

== Descargar los paquetes ya generados

La *última versión* de los paquetes está siempre en la carpeta #link(paquetes)[`dist-moodle`] del repositorio en GitHub, y la de esta guía en #link(documentacion)[`docs/moodle`]. Los enlaces de descarga directa no cambian entre versiones:

#table(
  columns: (auto, 1fr),
  [Fichero], [Qué es],
  [#link(descarga("eer-studio-moodle-vacio_scorm12.zip"))[`eer-studio-moodle-vacio_scorm12.zip`]], [Examen con el *editor vacío*, listo para subir a Moodle.],
  [#link(descarga("eer-studio-moodle-ejemplo-hotel_scorm12.zip"))[`eer-studio-moodle-ejemplo-hotel_scorm12.zip`]], [Examen de *ejemplo*, que arranca con el diagrama del caso «Hoteles Royal UMA». Útil para probar el flujo completo.],
  [#link(descarga("eer-studio-moodle-vacio.html"))[`eer-studio-moodle-vacio.html`]], [El examen vacío suelto: se abre con doble clic y sirve de *visor para corregir* (sección 6).],
)

== Generar un paquete con tu plantilla

Para que el examen arranque con tu enunciado o tus entidades ya colocadas, genera el paquete con el #link(repo)[repositorio de EER Studio] y Node.js 22.2 o posterior:

```bash
npm install                      # solo la primera vez

# Sin plantilla (editor vacío)
npm run build:moodle

# Con plantilla de partida y título
npm run build:moodle -- --template examenes/hotel.eer --title "Examen BD · Junio 2026"
```

#table(
  columns: (auto, 1fr),
  [Opción], [Para qué sirve],
  [`--template <fichero.eer>`], [Código con el que arranca el editor: enunciado en comentarios, entidades ya colocadas…],
  [`--title "<texto>"`], [Título visible en la barra del examen y en Moodle.],
  [`--id <id>`], [Identificador del examen. Por defecto se calcula a partir del título y la plantilla.],
  [`--name <nombre>`], [Nombre de los ficheros generados. Por defecto, el título sin acentos ni espacios.],
)

Se generan dos ficheros en `dist-moodle/`:

- *`<nombre>_scorm12.zip`*: el que se sube a Moodle.
- *`<nombre>.html`*: el mismo examen suelto. Se abre con doble clic para probarlo y sirve de *visor para corregir* (sección 6).

#callout(kind: "warning", title: "La plantilla no es secreta")[
  La plantilla va dentro del paquete y cualquier alumno puede leerla. *No pongas la solución en ella.*
]

#callout(title: "Regenerar sin perder el trabajo")[
  El identificador del examen es la clave del autoguardado. Si regeneras el paquete con el mismo título y la misma plantilla (o el mismo `--id`), los alumnos que ya hayan empezado conservan su trabajo.
]

// =============================================================================
= Configurar las dos actividades en Moodle
// =============================================================================

Aplica a las dos *las mismas restricciones de acceso*: fechas, grupo, contraseña o Safe Exam Browser.

== Paquete SCORM «Examen EER»

_Añadir una actividad o recurso → Paquete SCORM_, y sube el `.zip`.

#table(
  columns: (auto, 1.35fr, auto, 1.6fr),
  [Sección], [Ajuste], [Valor], [Motivo],
  [Apariencia], [*Mostrar paquete*], [*Ventana actual*], [SEB suele bloquear las ventanas nuevas.],
  [Apariencia], [*Mostrar la estructura del curso en el reproductor*], [*Oculto*], [Quita el botón `>` del índice lateral.],
  [Apariencia], [*Mostrar navegación*], [*No*], [Quita los botones `<< < ^ > >>` de debajo del editor.],
  [Calificación], [*Método de calificación*], [Objetos de aprendizaje], [El SCORM no califica: solo marca «completado» cuando el alumno copia su entrega.],
  [Gestión de intentos], [*Número de intentos*], [Sin límite], [Volver a entrar no debe consumir intentos.],
)

== Tarea «Entrega del examen EER»

_Añadir una actividad o recurso → Tarea_.

#table(
  columns: (auto, 1.5fr, 1.7fr),
  [Sección], [Ajuste], [Valor],
  [Disponibilidad], [*Permitir entregas desde*], [Inicio del examen.],
  [Disponibilidad], [*Fecha de entrega*], [Fin del examen.],
  [Disponibilidad], [*Fecha límite*], [Fin del examen (o unos minutos de margen). *A partir de esta fecha, Moodle no acepta ni deja modificar entregas.*],
  [Tipos de entrega], [*Texto en línea*], [Activado y *sin límite de palabras*.],
  [Tipos de entrega], [*Archivos enviados*], [Opcional, como alternativa con `.eer` (sección 5).],
  [Configuración de entrega], [*Requiere que los alumnos pulsen el botón de envío*], [*Sí*: tras «Enviar tarea», la entrega queda bloqueada.],
  [Configuración de entrega], [*Requiere que los alumnos acepten las condiciones de entrega*], [Recomendado.],
  [Configuración de entrega], [*Reabrir intentos* (o *Intentos adicionales*, según la versión)], [*Nunca*.],
)

#callout(kind: "success", title: "Nadie puede modificar la entrega")[
  Con estos ajustes, ningún alumno puede cambiar su entrega después de enviarla o una vez cerrada la Tarea, aunque vuelva a abrir el SCORM. Esa garantía la da Moodle, no la app.
]

== Instrucciones para el alumnado

Puedes pegar este texto en la descripción de la Tarea:

#block(width: 100%, inset: 12pt, radius: 4pt, stroke: (paint: indigo, thickness: 0.8pt, dash: "dashed"), {
  set par(justify: false)
  enum(
    [Abre la actividad *«Examen EER»* y haz tu diagrama. Se guarda solo: puedes venir aquí y volver sin perder nada.],
    [Cuando termines, pulsa el botón verde *«Copiar para entregar»*.],
    [Vuelve a esta Tarea, pulsa _Agregar entrega_, pega el texto (*Ctrl+V*) y pulsa _Guardar cambios_.],
    [Comprueba que el texto empieza por `=== EER-STUDIO BEGIN v1 ===` y termina por `=== EER-STUDIO END ===`.],
    [Pulsa *«Enviar tarea»*. A partir de ese momento ya no podrás cambiarlo.],
  )
})

// =============================================================================
= Aula sin internet y Safe Exam Browser
// =============================================================================

- *Sin internet*: el paquete lleva dentro todo el código, los estilos y los iconos, y no hace ninguna petición de red.
- *Navegador normal*: probado en el Campus Virtual de la UMA. El editor se carga dentro del reproductor SCORM y «Copiar para entregar» funciona.
- *Safe Exam Browser*:
  - Permite el dominio del Campus Virtual en la configuración del examen.
  - Copiar y pegar dentro de SEB funciona entre páginas del propio SEB, porque usa su propio portapapeles. *No desactives el portapapeles*, o el alumno no podrá pegar el bloque en la Tarea.
  - SEB bloquea las descargas por defecto: *en SEB no se usa «Descargar .eer»*, solo el texto en línea.
  - Al salir de SEB se borran los datos del navegador, autoguardado incluido. Lo entregado ya está en la Tarea.
- *PCs compartidos sin SEB*: el autoguardado caduca a las 12 horas. Con turnos seguidos en el mismo equipo, pide a cada alumno que pulse *«Empezar de nuevo»* al terminar, o genera un paquete distinto por turno (`--id`).

== Lista de comprobación antes del examen real

En un curso de pruebas, con un usuario de *rol alumno* y *dentro de SEB*:

#checklist(
  [El SCORM se abre en la ventana actual y muestra el editor con la plantilla.],
  [Al ir a la Tarea y volver al SCORM, el diagrama sigue ahí (aviso «Se ha recuperado el trabajo…»).],
  [«Copiar para entregar» muestra el aviso verde. Si aparece la ventana «Copia tu entrega», el alumno copia con Ctrl+C.],
  [El bloque se pega en el texto en línea de la Tarea y se envía.],
  [Ya enviada, la Tarea no deja editar la entrega.],
  [Como profesor, el bloque de esa entrega se carga en el visor con la suma de control correcta (sección 6).],
)

// =============================================================================
= Entrega alternativa por fichero (sin SEB)
// =============================================================================

Si la Tarea admite _Archivos enviados_, el alumno puede pulsar *«Descargar .eer»* y subir el fichero.

El `.eer` empieza por las mismas líneas de crédito y metadatos, que son comentarios del DSL, así que se abre sin cambios en la edición completa de EER Studio (web o escritorio).

// =============================================================================
= Revisar y corregir las entregas
// =============================================================================

*Para ver un diagrama:*

+ En la Tarea, abre la entrega del alumno y copia el texto. También vale el HTML que guarda Moodle.
+ Abre el `<nombre>.html` del examen con doble clic y pulsa *«Cargar entrega»*.
+ Pega y pulsa *Cargar*. El diagrama se reconstruye y la barra superior indica:
  - #text(fill: emerald, weight: "bold")[✓ suma de control correcta]: es exactamente lo que el alumno copió;
  - #text(fill: amber, weight: "bold")[⚠ NO coincide]: el texto se modificó después de copiarlo;
  - #text(fill: amber, weight: "bold")[⚠ varios bloques]: se carga el último.

#shot("img/cargar-entrega.png", [«Cargar entrega»: se puede pegar el texto o el HTML que guarda Moodle.], width: 78%)

#shot("img/entrega-verificada.png", [La barra confirma que la entrega coincide con lo que copió el alumno.])

*Para descargarlas todas:* _Tarea → Ver todas las entregas → Acción sobre las entregas → Descargar todas las entregas_. Moodle genera un zip con un fichero HTML de texto en línea por alumno. El bloque está pensado para leerse con un script, así que la *corrección automática* podrá trabajar directamente sobre ese zip (en preparación).

// =============================================================================
= Problemas frecuentes
// =============================================================================

#table(
  columns: (1fr, 1.5fr),
  [Síntoma], [Causa y solución],
  [Al pulsar «Copiar para entregar» aparece la ventana «Copia tu entrega»], [El navegador o SEB no deja copiar automáticamente. El texto ya está seleccionado: Ctrl+C y pegar en la Tarea.],
  [El alumno ha perdido el diagrama], [El autoguardado es por navegador y equipo, y caduca a las 12 horas. Si cambió de equipo o salió de SEB, el trabajo no entregado se pierde. Recomienda entregar con tiempo.],
  [La barra dice «No había bloque de entrega»], [Se pegó solo el código, sin las líneas `BEGIN`/`END`. El diagrama se carga igual, pero sin verificar la suma de control.],
  [La barra dice «la suma de control NO coincide»], [El texto se editó en la Tarea después de copiarlo. Revisa la entrega con cuidado.],
  [«El bloque está incompleto»], [Falta la línea `=== EER-STUDIO END ===`: el alumno no copió el bloque entero.],
)

#v(1fr)
#align(center, block(width: 100%, inset: 12pt, radius: 5pt, fill: slate-soft, {
  set text(8.5pt, fill: slate-muted)
  set par(justify: false)
  [*EER Studio · edición Moodle* — © 2025-2026 David Bueno Vallejo · Universidad de Málaga · Licencia MIT \
  Código fuente, novedades y versión web: #link(repo)[github.com/davidbuenov/dbv-eer-studio]]
}))
