// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { LinkData } from '../types';

/** Separación entre líneas paralelas que unen los mismos dos nodos. */
export const PARALLEL_LINK_SPACING = 18;

/**
 * Desplazamiento perpendicular de cada enlace (en el sentido origen → destino de ese enlace).
 *
 * En una relación recursiva (EMPLEADO participa dos veces en SUPERVISA) hay dos enlaces entre
 * los mismos nodos: dibujados igual, quedaban superpuestos y sus cardinalidades y roles se
 * tapaban. Los enlaces de un mismo par se reparten simétricamente alrededor del eje; un enlace
 * único no se desplaza.
 */
export function computeParallelOffsets(links: readonly LinkData[]): number[] {
  const pairKey = (l: LinkData) => [l.source, l.target].sort().join('\u0000');
  const groups = new Map<string, number[]>();
  links.forEach((l, i) => groups.set(pairKey(l), [...(groups.get(pairKey(l)) ?? []), i]));

  const offsets = links.map(() => 0);
  groups.forEach(indices => {
    indices.forEach((linkIndex, k) => {
      const link = links[linkIndex]!;
      const base = (k - (indices.length - 1) / 2) * PARALLEL_LINK_SPACING;
      // La normal se invierte al invertir el sentido: se expresa respecto a un orden canónico.
      const canonical = link.source <= link.target;
      offsets[linkIndex] = indices.length > 1 ? (canonical ? base : -base) : 0;
    });
  });
  return offsets;
}
