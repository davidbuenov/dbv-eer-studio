// =============================================================================
// dbv-eer-studio — Estilos de la Guía del profesor (solo reglas y funciones)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

// ---------- Paleta (la de la app: indigo / slate de Tailwind) ----------
#let indigo = rgb("#4f46e5")
#let indigo-dark = rgb("#3730a3")
#let indigo-deep = rgb("#1e1b4b")
#let indigo-soft = rgb("#eef2ff")
#let indigo-light = rgb("#a5b4fc")
#let slate = rgb("#334155")
#let slate-muted = rgb("#64748b")
#let slate-soft = rgb("#f1f5f9")
#let slate-line = rgb("#e2e8f0")
#let emerald = rgb("#059669")
#let emerald-soft = rgb("#ecfdf5")
#let amber = rgb("#b45309")
#let amber-soft = rgb("#fffbeb")

#let repo = "https://github.com/davidbuenov/dbv-eer-studio"
// Versión de EER Studio documentada: cabecera de página y portada (main.typ). Subirla en cada /ship.
#let version-app = "1.7.0"
#let afiliacion = "Universidad de Málaga"
// Paquetes ya generados (carpeta dist-moodle/ del repositorio) y documentación (docs/moodle/).
// Los paquetes tienen nombres fijos para que estos enlaces no cambien entre versiones.
#let paquetes = "https://github.com/davidbuenov/dbv-eer-studio/tree/main/dist-moodle"
#let documentacion = "https://github.com/davidbuenov/dbv-eer-studio/tree/main/docs/moodle"
#let descarga(fichero) = "https://github.com/davidbuenov/dbv-eer-studio/raw/main/dist-moodle/" + fichero

// ---------- Tipografías ----------
#let fuente = ("Inter", "Segoe UI")
#let fuente-mono = ("Cascadia Mono", "Consolas")

// ---------- Componentes ----------
#let callout(kind: "info", title: none, body) = {
  let (accent, soft, icon) = if kind == "warning" {
    (amber, amber-soft, "⚠")
  } else if kind == "success" {
    (emerald, emerald-soft, "✓")
  } else {
    (indigo, indigo-soft, "ℹ")
  }
  block(
    width: 100%, fill: soft, inset: (x: 12pt, y: 9pt), radius: 4pt,
    stroke: (left: 3pt + accent),
    {
      if title != none {
        text(weight: "bold", fill: accent)[#icon #title]
        linebreak()
      }
      body
    },
  )
}

#let shot(path, caption, width: 100%) = figure(
  box(width: width, stroke: 0.6pt + slate-line, radius: 3pt, clip: true, image(path, width: 100%)),
  caption: caption,
)

#let step(n, title, body, accent: indigo, soft: indigo-soft) = block(
  width: 100%, height: 100%, fill: soft, inset: 9pt, radius: 5pt, stroke: 0.6pt + accent,
  {
    box(circle(radius: 8pt, fill: accent, align(center + horizon, text(9pt, fill: white, weight: "bold")[#n])))
    h(5pt)
    box(baseline: -3pt, text(9.5pt, weight: "bold", fill: accent, title))
    v(4pt)
    set par(justify: false)
    text(8.5pt, body)
  },
)

#let arrow = align(center + horizon, text(16pt, fill: slate-muted)[→])

#let activity-card(badge, title, subtitle, body, accent: indigo, soft: indigo-soft) = block(
  width: 100%, radius: 5pt, stroke: 0.8pt + accent, clip: true,
  {
    block(width: 100%, fill: accent, inset: (x: 10pt, y: 7pt), below: 0pt, {
      set text(fill: white)
      text(14pt, weight: "bold", badge)
      h(6pt)
      text(10.5pt, weight: "bold", title)
      linebreak()
      text(8.5pt, subtitle)
    })
    block(width: 100%, fill: soft, inset: 10pt, above: 0pt, {
      set text(9pt)
      set par(justify: false)
      body
    })
  },
)

#let checklist(..items) = {
  set par(justify: false)
  for item in items.pos() {
    grid(columns: (14pt, 1fr), column-gutter: 4pt, text(fill: indigo)[☐], item)
    v(3pt)
  }
}

// ---------- Portada ----------
#let portada(titulo, subtitulo, etiqueta, autor, fecha, enlace, version: none, afiliacion: none) = page(
  margin: (x: 2.4cm, y: 2.6cm),
  fill: indigo-deep,
  header: none,
  footer: none,
  {
    set text(fill: white)
    show link: set text(fill: indigo-light)

    // Formas decorativas
    place(top + right, dx: 3.2cm, dy: -3.4cm, circle(radius: 6cm, fill: indigo.transparentize(35%)))
    place(top + right, dx: 0.6cm, dy: 6.5cm, circle(radius: 1.6cm, fill: indigo-light.transparentize(70%)))
    place(bottom + left, dx: -4.2cm, dy: 4cm, circle(radius: 5cm, fill: indigo-dark.transparentize(30%)))

    // Etiqueta superior
    block(
      fill: indigo.transparentize(20%), inset: (x: 10pt, y: 6pt), radius: 20pt,
      text(8.5pt, tracking: 1.4pt, weight: "semibold", upper(etiqueta)),
    )

    v(1fr)

    // Título
    text(44pt, weight: "bold", tracking: -0.8pt, par(leading: 0.55em, titulo))
    v(8pt)
    line(length: 3.2cm, stroke: 3pt + indigo-light)
    v(12pt)
    block(width: 85%, text(16pt, weight: "regular", fill: indigo-light, subtitulo))

    v(1.4fr)

    // Pie de portada
    line(length: 100%, stroke: 0.5pt + indigo-light.transparentize(50%))
    v(4pt)
    grid(
      columns: (1fr, auto),
      align: (left, right),
      {
        text(11pt, weight: "bold", autor)
        linebreak()
        if afiliacion != none {
          text(9.5pt, fill: indigo-light, afiliacion)
          linebreak()
        }
        text(9pt, link(enlace, enlace.replace("https://", "")))
      },
      {
        if version != none {
          text(11pt, weight: "bold", [Versión #version])
          linebreak()
        }
        text(10pt, fill: indigo-light, fecha)
      },
    )
  },
)

// ---------- Estilo global del documento ----------
#let estilo(doc) = {
  set document(
    title: "Guía del profesor: examen EER en Moodle con EER Studio",
    author: "David Bueno Vallejo",
  )
  set page(
    paper: "a4",
    margin: (x: 2.1cm, top: 2.3cm, bottom: 2.2cm),
    header: context {
      if here().page() > 1 {
        set text(8pt, fill: slate-muted)
        [EER Studio v#version-app · Edición Moodle #h(1fr) Guía del profesor]
        v(-4pt)
        line(length: 100%, stroke: 0.4pt + slate-line)
      }
    },
    footer: context {
      set text(8pt, fill: slate-muted)
      [© 2025-2026 David Bueno Vallejo · #afiliacion · Licencia MIT #h(1fr) #counter(page).display()]
    },
  )
  set text(font: fuente, size: 9.5pt, lang: "es", fill: slate)
  set par(justify: true, leading: 0.7em, spacing: 1.1em)
  set list(indent: 0.4em, body-indent: 0.6em, marker: text(fill: indigo)[•])
  set enum(indent: 0.4em, body-indent: 0.6em, numbering: n => text(fill: indigo, weight: "bold")[#n.])

  show raw: set text(font: fuente-mono, size: 8.5pt)
  show raw.where(block: true): it => block(
    width: 100%, fill: slate-soft, inset: 10pt, radius: 4pt, stroke: 0.5pt + slate-line, it,
  )
  show raw.where(block: false): it => box(fill: slate-soft, inset: (x: 3pt), outset: (y: 2.5pt), radius: 2pt, it)

  set heading(numbering: "1.1")
  show heading.where(level: 1): it => {
    v(1.1em)
    block(below: 0.5em, text(15pt, weight: "bold", fill: indigo-dark, it))
    line(length: 100%, stroke: 1.2pt + indigo)
    v(0.4em)
  }
  show heading.where(level: 2): it => {
    v(0.6em)
    block(below: 0.6em, text(11.5pt, weight: "semibold", fill: indigo, it))
  }
  show link: set text(fill: indigo)
  show strong: set text(fill: rgb("#1e293b"))

  set table(
    stroke: 0.5pt + slate-line,
    inset: (x: 6pt, y: 5pt),
    fill: (_, y) => if y == 0 { indigo-soft } else if calc.even(y) { rgb("#fafbfd") },
  )
  show table.cell.where(y: 0): set text(weight: "bold", fill: indigo-dark, size: 9pt)
  show table: set text(size: 9pt)
  show table: set par(justify: false)

  show figure.caption: set text(8.5pt, fill: slate-muted)
  set figure(gap: 8pt)

  doc
}
