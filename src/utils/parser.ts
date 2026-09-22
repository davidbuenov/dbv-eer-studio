import type { NodeData, LinkData } from '../types';
import { COORD_REGEX, CANVAS_CONFIG } from '../constants';

/**
 * Extrae coordenadas (x, y) de una línea de código
 */
export function extractCoordinates(line: string): { x: number; y: number } | null {
  const coordMatch = line.match(COORD_REGEX);
  if (coordMatch) {
    return {
      x: parseInt(coordMatch[1], 10),
      y: parseInt(coordMatch[2], 10)
    };
  }
  return null;
}

/**
 * Genera posición en espiral para nodos sin coordenadas
 */
export function createSpiralPositionGenerator() {
  let angle = 0;
  const { CENTER_X, CENTER_Y, SPIRAL_RADIUS, SPIRAL_INCREMENT, SPIRAL_GROWTH } = CANVAS_CONFIG;

  return () => {
    angle += SPIRAL_INCREMENT;
    const r = SPIRAL_RADIUS + (angle * SPIRAL_GROWTH);
    return {
      x: Math.round(CENTER_X + Math.cos(angle) * r),
      y: Math.round(CENTER_Y + Math.sin(angle) * r)
    };
  };
}

import { compileEER } from './compiler';

/**
 * Convierte el código DSL en estructuras de datos visuales
 * 
 * @description
 * Delega en el compilador `compileEER(code)` garantizando que nunca se
 * emitan nodos con identificadores o etiquetas indefinidos ni enlaces rotos.
 * 
 * @param code - Código DSL del diagrama EER
 * @returns Objeto con arrays de nodos y enlaces válidos
 */
export function parseCode(code: string): { nodes: NodeData[]; links: LinkData[] } {
  const result = compileEER(code);
  return { nodes: result.nodes, links: result.links };
}

