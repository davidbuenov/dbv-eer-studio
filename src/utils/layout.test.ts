// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { findFreePosition, collectDragGroup, isOccupied, nodesInsideRect } from './layout';

describe('findFreePosition — anti-solapamiento de atributos', () => {
  it('devuelve el punto de partida si está libre', () => {
    expect(findFreePosition({ x: 100, y: 100 }, [{ x: 400, y: 100 }])).toEqual({ x: 100, y: 100 });
  });

  it('avanza +100 px en X, manteniendo la fila, hasta encontrar hueco', () => {
    const occupied = [{ x: 100, y: 100 }, { x: 200, y: 100 }];
    expect(findFreePosition({ x: 100, y: 100 }, occupied)).toEqual({ x: 300, y: 100 });
  });

  it('considera solapado un nodo cercano aunque no coincida exactamente', () => {
    expect(isOccupied({ x: 130, y: 110 }, [{ x: 100, y: 100 }])).toBe(true);
    expect(isOccupied({ x: 200, y: 100 }, [{ x: 100, y: 100 }])).toBe(false);
  });

  it('no entra en bucle infinito en un diagrama saturado', () => {
    const occupied = Array.from({ length: 200 }, (_, i) => ({ x: i * 100, y: 0 }));
    expect(() => findFreePosition({ x: 0, y: 0 }, occupied)).not.toThrow();
  });
});

describe('collectDragGroup — los atributos siguen a su propietario', () => {
  const nodes = [
    { id: 'EMPLEADO', label: 'EMPLEADO', type: 'entity' },
    { id: 'Direccion_3', label: 'Direccion', type: 'attribute', parentEntity: 'EMPLEADO' },
    { id: 'Calle_4', label: 'Calle', type: 'attribute', parentEntity: 'Direccion' },
    { id: 'TRABAJA', label: 'TRABAJA', type: 'relationship' },
    { id: 'Horas_6', label: 'Horas', type: 'attribute', parentEntity: 'TRABAJA' },
    { id: 'DEPTO', label: 'DEPTO', type: 'entity' },
  ];

  it('incluye recursivamente los atributos y los componentes de compuestos', () => {
    expect([...collectDragGroup(['EMPLEADO'], nodes, true)].sort()).toEqual(['Calle_4', 'Direccion_3', 'EMPLEADO']);
  });

  it('también arrastra los atributos de una relación', () => {
    expect([...collectDragGroup(['TRABAJA'], nodes, true)].sort()).toEqual(['Horas_6', 'TRABAJA']);
  });

  it('con Alt (includeAttributes = false) solo mueve la selección', () => {
    expect([...collectDragGroup(['EMPLEADO', 'DEPTO'], nodes, false)].sort()).toEqual(['DEPTO', 'EMPLEADO']);
  });
});

describe('nodesInsideRect — rectángulo de selección', () => {
  const nodes = [
    { id: 'E', label: 'E', type: 'entity', x: 100, y: 100 }, // ocupa x 50..150, y 75..125
    { id: 'A', label: 'A', type: 'attribute', x: 100, y: 20 }, // ocupa x 55..145, y -5..45
    { id: 'R', label: 'R', type: 'relationship', x: 300, y: 100 },
  ];

  it('selecciona solo los nodos que quedan enteros dentro (criterio de Office)', () => {
    expect(nodesInsideRect({ x1: 40, y1: 60, x2: 160, y2: 140 }, nodes)).toEqual(['E']);
  });

  it('no selecciona un nodo que el rectángulo solo roza', () => {
    expect(nodesInsideRect({ x1: 60, y1: 60, x2: 160, y2: 140 }, nodes)).toEqual([]);
  });

  it('funciona en cualquier sentido de arrastre', () => {
    expect(nodesInsideRect({ x1: 400, y1: 200, x2: 0, y2: -10 }, nodes).sort()).toEqual(['A', 'E', 'R']);
  });
});
