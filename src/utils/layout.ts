// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

export interface Point {
  x: number;
  y: number;
}

/** Desplazamiento horizontal entre atributos consecutivos (la elipse mide 90 px de ancho). */
export const ATTRIBUTE_STEP_X = 100;

// Caja de colisión: dos centros más cercanos que esto se consideran solapados.
const OVERLAP_X = 95;
const OVERLAP_Y = 50;
// Cota de seguridad: un diagrama muy denso nunca debe colgar el bucle de búsqueda.
const MAX_ATTEMPTS = 50;

/** Indica si un punto cae encima de alguno de los nodos ya colocados. */
export function isOccupied(point: Point, occupied: readonly Point[]): boolean {
  return occupied.some(o => Math.abs(o.x - point.x) < OVERLAP_X && Math.abs(o.y - point.y) < OVERLAP_Y);
}

/**
 * Primera posición libre partiendo de `start` y avanzando +100 px en X.
 *
 * Es la regla que propuso el colaborador para crear atributos en serie sin que queden uno
 * encima de otro: se mantiene la fila (misma Y) para que el diagrama siga ordenado.
 */
export function findFreePosition(start: Point, occupied: readonly Point[]): Point {
  let candidate = { x: Math.round(start.x), y: Math.round(start.y) };
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS && isOccupied(candidate, occupied)) {
    candidate = { x: candidate.x + ATTRIBUTE_STEP_X, y: candidate.y };
    attempts++;
  }
  return candidate;
}

interface GroupableNode {
  id: string;
  label: string;
  type: string;
  parentEntity?: string;
}

const ATTRIBUTE_TYPES = ['attribute', 'key_attribute', 'derived_attribute', 'multivalued_attribute'];

/**
 * Nodos que se mueven juntos al arrastrar: los seleccionados más, salvo que se pida lo contrario
 * (`Alt`), todos los atributos que cuelgan de ellos, recursivamente (componentes de compuestos).
 * `parentEntity` guarda la referencia tal como se escribió tras `->`, por eso se compara con id y
 * con etiqueta.
 */
export function collectDragGroup(
  baseIds: readonly string[],
  nodes: readonly GroupableNode[],
  includeAttributes: boolean
): Set<string> {
  const group = new Set(baseIds);
  let frontier = nodes.filter(n => group.has(n.id));

  while (includeAttributes && frontier.length > 0) {
    const parents = frontier;
    frontier = nodes.filter(
      n =>
        !group.has(n.id) &&
        ATTRIBUTE_TYPES.includes(n.type) &&
        parents.some(p => n.parentEntity === p.id || n.parentEntity === p.label)
    );
    frontier.forEach(n => group.add(n.id));
  }

  return group;
}

export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Semiejes de cada forma tal como las dibuja `NodeRenderer` (centro en (x, y)).
const HALF_SIZE_BY_TYPE: Record<string, Point> = {
  entity: { x: 50, y: 25 },
  weak_entity: { x: 50, y: 25 },
  relationship: { x: 60, y: 40 },
  identifying_relationship: { x: 60, y: 40 },
  attribute: { x: 45, y: 25 },
  key_attribute: { x: 45, y: 25 },
  derived_attribute: { x: 45, y: 25 },
  multivalued_attribute: { x: 45, y: 25 },
  specialization: { x: 18, y: 18 },
  union: { x: 18, y: 18 },
};

/**
 * Ids de los nodos que quedan ENTEROS dentro del rectángulo (criterio de Word/PowerPoint/Visio):
 * así un rectángulo alrededor de una entidad no arrastra atributos vecinos que solo roza.
 * El rectángulo puede venir en cualquier sentido de arrastre.
 */
export function nodesInsideRect(rect: Rect, nodes: readonly (GroupableNode & Point)[]): string[] {
  const left = Math.min(rect.x1, rect.x2);
  const right = Math.max(rect.x1, rect.x2);
  const top = Math.min(rect.y1, rect.y2);
  const bottom = Math.max(rect.y1, rect.y2);

  return nodes
    .filter(n => {
      const half = HALF_SIZE_BY_TYPE[n.type] ?? { x: 0, y: 0 };
      return n.x - half.x >= left && n.x + half.x <= right && n.y - half.y >= top && n.y + half.y <= bottom;
    })
    .map(n => n.id);
}
