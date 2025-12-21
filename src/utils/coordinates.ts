import type { NodeData } from '../types';
import { COORD_REGEX } from '../constants';

/**
 * Actualiza las coordenadas de un nodo en el código fuente
 * 
 * @description
 * Función clave para la edición bidireccional:
 * 1. Localiza el nodo por ID en el array
 * 2. Encuentra su línea original en el código
 * 3. Actualiza o añade las coordenadas (x, y)
 * 4. Regenera el código completo
 * 
 * Esto permite que mover nodos visualmente actualice el código automáticamente.
 * 
 * @param code - Código actual
 * @param node - Nodo con las coordenadas actualizadas
 * @param newX - Nueva coordenada X
 * @param newY - Nueva coordenada Y
 * @returns Código actualizado
 */
export function updateNodePosition(
  code: string,
  node: NodeData,
  newX: number,
  newY: number
): string {
  const lines = code.split('\n');
  const lineIndex = node.lineIndex;
  
  if (lineIndex >= 0 && lineIndex < lines.length) {
    let line = lines[lineIndex];
    
    // Si ya tiene coordenadas, reemplazarlas
    if (COORD_REGEX.test(line)) {
      line = line.replace(COORD_REGEX, '');
    }
    
    // Añadir nuevas coordenadas al final
    line = line.trimEnd();
    const newLine = `${line} (${Math.round(newX)}, ${Math.round(newY)})`;
    
    lines[lineIndex] = newLine;
    return lines.join('\n');
  }
  
  return code;
}

/**
 * Convierte coordenadas de pantalla a coordenadas del canvas
 * 
 * @param screenX - Coordenada X de pantalla
 * @param screenY - Coordenada Y de pantalla
 * @param svg - Elemento SVG
 * @param scale - Escala actual del zoom
 * @param offset - Offset del paneo
 * @returns Coordenadas del canvas
 */
export function screenToCanvasCoordinates(
  screenX: number,
  screenY: number,
  svg: SVGSVGElement,
  scale: number,
  offset: { x: number; y: number }
): { x: number; y: number } {
  const CTM = svg.getScreenCTM();
  if (!CTM) {
    return { x: screenX, y: screenY };
  }
  
  return {
    x: (screenX - CTM.e) / CTM.a / scale - offset.x / scale,
    y: (screenY - CTM.f) / CTM.d / scale - offset.y / scale
  };
}
