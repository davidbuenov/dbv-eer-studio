// =============================================================================
// dbv-eer-studio — Guía del profesor de la edición Moodle (fichero principal)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
//
// Compilar (desde la raíz del repositorio):
//   typst compile docs/moodle/main.typ docs/moodle/GUIA_PROFESOR.pdf
// Contenido en guia-profesor.typ · estilos en styles.typ.
// Mantener sincronizada con docs/moodle/GUIA_PROFESOR.md.

#import "styles.typ": estilo, portada, repo, indigo-dark, version-app, afiliacion
#show: estilo

#portada(
  "Guía del profesor",
  "Examen de modelado EER en el Campus Virtual (Moodle 5) con EER Studio",
  "EER Studio · Edición Moodle",
  "David Bueno Vallejo",
  "Noviembre 2026",
  repo,
  version: version-app,
  afiliacion: afiliacion,
)
#counter(page).update(1)

// Índice justo después de la portada, en su propia página
#show outline.entry.where(level: 1): set text(weight: "semibold", fill: indigo-dark)
#outline(title: [Contenido], depth: 2, indent: 1.2em)
#pagebreak()

#include "guia-profesor.typ"
