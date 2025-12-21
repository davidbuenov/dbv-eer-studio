import type { NodeData, LinkData, NodeType } from '../types';
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

/**
 * Convierte el código DSL en estructuras de datos visuales
 * 
 * @description
 * Analiza el código línea por línea y extrae:
 * - Nodos (entidades, relaciones, atributos, especializaciones, uniones)
 * - Enlaces (conexiones entre nodos con cardinalidad y participación)
 * - Coordenadas (x, y) opcionales para posicionamiento manual
 * 
 * Si no hay coordenadas, usa un algoritmo de espiral para distribución automática.
 * Mantiene el índice de línea original para permitir actualización bidireccional.
 * 
 * @param code - Código DSL del diagrama EER
 * @returns Objeto con arrays de nodos y enlaces
 * 
 * @example
 * ```ts
 * parseCode("ent EMPLEADO (100, 200)\natt Nombre -> EMPLEADO")
 * // Returns: { nodes: [...], links: [...] }
 * ```
 */
export function parseCode(code: string): { nodes: NodeData[]; links: LinkData[] } {
  const lines = code.split('\n');
  const newNodes: NodeData[] = [];
  const newLinks: LinkData[] = [];
  const existingIds = new Set<string>();
  
  const getDefaultPos = createSpiralPositionGenerator();

  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('//')) return;

    // Extraer coordenadas si existen
    const coords = extractCoordinates(cleanLine);
    
    // Quitar coordenadas para procesar el comando limpio
    const lineWithoutCoords = cleanLine.replace(COORD_REGEX, '').trim();
    const parts = lineWithoutCoords.split(/\s+/);
    const command = parts[0].toLowerCase();

    // Comandos de Nodos
    if (['ent', 'weak_ent', 'rel', 'ident_rel', 'att', 'key_att', 'derived_att', 'multivalued_attribute'].includes(command)) {
      const label = parts[1];
      
      // Generar ID único
      const isAttribute = ['att', 'key_att', 'derived_att', 'multivalued_attribute'].includes(command);
      let id = label;
      
      if (isAttribute || existingIds.has(id)) {
        id = `${label}_${index}`;
      }
      existingIds.add(id);
      
      // Determinar posición final
      const { x, y } = coords || getDefaultPos();

      // Determinar tipo de nodo
      let type: NodeType = 'entity';
      if (command === 'weak_ent') type = 'weak_entity';
      if (command === 'rel') type = 'relationship';
      if (command === 'ident_rel') type = 'identifying_relationship';
      if (command === 'att') type = 'attribute';
      if (command === 'key_att') type = 'key_attribute';
      if (command === 'derived_att') type = 'derived_attribute';
      if (command === 'multivalued_attribute') type = 'multivalued_attribute';

      newNodes.push({ id, type, label, x, y, lineIndex: index });

      // Atajo para atributo: att Nombre -> Entidad
      if (parts[2] === '->' && parts[3]) {
        newLinks.push({ source: parts[3], target: id, label: '', style: 'solid' });
      }
    }
    // Especialización / Unión
    else if (['spec', 'union'].includes(command)) {
      const meta = parts[1] || (command === 'union' ? 'u' : 'd');
      
      let id = parts[1] || `spec_${index}`;
      if (existingIds.has(id)) {
        id = `${id}_${index}`;
      }
      existingIds.add(id);

      const { x, y } = coords || getDefaultPos();

      newNodes.push({
        id,
        type: command === 'union' ? 'union' : 'specialization',
        label: meta,
        x,
        y,
        meta,
        lineIndex: index
      });

      if (parts[2] === '->' && parts[3]) {
        // Conexión doble a la superclase
        newLinks.push({ source: parts[3], target: id, label: '', style: 'double' });
      }
    }
    // Conexiones
    else if (command === 'link') {
      const source = parts[1];
      const target = parts[2];
      let label = '';
      let style: 'solid' | 'double' = 'solid';

      const labelMatch = lineWithoutCoords.match(/"([^"]+)"/);
      if (labelMatch) label = labelMatch[1];

      if (lineWithoutCoords.includes('[total]') || lineWithoutCoords.includes('[double]')) {
        style = 'double';
      }

      if (source && target) {
        newLinks.push({ source, target, label, style });
      }
    }
  });

  return { nodes: newNodes, links: newLinks };
}
