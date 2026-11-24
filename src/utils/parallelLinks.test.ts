// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { PARALLEL_LINK_SPACING, computeParallelOffsets } from './parallelLinks';
import type { LinkData } from '../types';

const link = (source: string, target: string): LinkData => ({ source, target });

describe('Enlaces paralelos (relaciones recursivas)', () => {
  it('un enlace único no se desplaza', () => {
    expect(computeParallelOffsets([link('A', 'R'), link('B', 'R')])).toEqual([0, 0]);
  });

  it('dos enlaces entre los mismos nodos se separan simétricamente', () => {
    const [a, b] = computeParallelOffsets([link('EMPLEADO', 'SUPERVISA'), link('EMPLEADO', 'SUPERVISA')]);
    expect(a).toBe(-PARALLEL_LINK_SPACING / 2);
    expect(b).toBe(PARALLEL_LINK_SPACING / 2);
  });

  it('el sentido del enlace no los junta: `link R E` y `link E R` quedan separados', () => {
    // Mismo par en sentidos opuestos: el signo se invierte para que el desplazamiento real difiera.
    const [a, b] = computeParallelOffsets([link('EMPLEADO', 'SUPERVISA'), link('SUPERVISA', 'EMPLEADO')]);
    expect(a).toBe(-PARALLEL_LINK_SPACING / 2);
    expect(b).toBe(-PARALLEL_LINK_SPACING / 2); // = +9 respecto al sentido canónico
  });

  it('tres participaciones de la misma entidad se reparten alrededor del eje', () => {
    expect(computeParallelOffsets([link('E', 'R'), link('E', 'R'), link('E', 'R')])).toEqual([
      -PARALLEL_LINK_SPACING,
      0,
      PARALLEL_LINK_SPACING,
    ]);
  });
});
