import type { NodeData } from '../types';

/**
 * Elimina un nodo del código DSL y todas sus referencias
 * 
 * @param code - Código DSL actual
 * @param nodeLabel - Etiqueta del nodo a eliminar
 * @returns Código DSL sin el nodo y sus referencias
 */
export function deleteNodeFromCode(code: string, nodeLabel: string): string {
  const lines = code.split('\n');
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Saltar líneas vacías o comentarios
    if (!trimmed || trimmed.startsWith('//')) {
      filteredLines.push(line);
      continue;
    }

    // Líneas que definen el nodo directamente
    const nodeDefinitionPattern = new RegExp(
      `^(ent|weak_ent|rel|ident_rel|att|key_att|derived_att|multivalued_att)\\s+${escapeRegex(nodeLabel)}(\\s|$)`
    );
    
    if (nodeDefinitionPattern.test(trimmed)) {
      continue; // Eliminar esta línea
    }

    // Caso especial: Si estamos eliminando 'd' o 'u', necesitamos eliminar su definición en spec/union
    if (nodeLabel === 'd' || nodeLabel === 'u') {
      // Para 'd': eliminar "spec d -> SUPERCLASS"
      // Para 'u': puede estar en "union CATEGORIA" donde CATEGORIA es el nombre de u
      if (nodeLabel === 'd' && /^spec\s+d\s*->/.test(trimmed)) {
        continue; // Eliminar la definición de especialización
      }
      
      // Para 'u': la unión puede no tener una línea "union u", pero sí "link u ..."
      // Eliminar cualquier línea que comience con "union" si es la unión que buscamos
      if (nodeLabel === 'u' && trimmed.startsWith('union ')) {
        continue; // Eliminar definición de unión
      }
    }

    // Líneas que referencian el nodo en links (link A B, link d SUBCLASS, link u ENTITY, etc)
    const linkPattern = new RegExp(`\\blink\\s+${escapeRegex(nodeLabel)}\\b`);
    if (linkPattern.test(trimmed)) {
      continue; // Eliminar links que comiencen con el nodo
    }

    // También eliminar links que TERMINEN con el nodo (link ENTITY d, link ENTITY u)
    const linkEndPattern = new RegExp(`\\blink\\b.*\\s+${escapeRegex(nodeLabel)}$`);
    if (linkEndPattern.test(trimmed)) {
      continue; // Eliminar links que terminen con el nodo
    }

    // Líneas que referencian el nodo en atributos (-> ENTIDAD)
    const attrPattern = new RegExp(`->\\s*${escapeRegex(nodeLabel)}\\b`);
    if (attrPattern.test(trimmed)) {
      continue; // Eliminar atributos conectados al nodo
    }

    // Líneas que especifican que el nodo es subclase/categoría de algo (spec d/o -> LABEL)
    const specRefPattern = new RegExp(`^spec\\s+[do]\\s*->\\s*${escapeRegex(nodeLabel)}\\b`);
    if (specRefPattern.test(trimmed)) {
      continue; // Eliminar referencias de especialización
    }

    // Conservar la línea
    filteredLines.push(line);
  }

  return filteredLines.join('\n');
}

const ATTRIBUTE_TYPES = ['attribute', 'key_attribute', 'derived_attribute', 'multivalued_attribute'];

/**
 * Elimina varios nodos del DSL (selección múltiple).
 *
 * `deleteNodeFromCode` borra por etiqueta, lo que es correcto para entidades y relaciones
 * (nombres únicos) pero no para atributos: dos entidades pueden tener su propio `Nombre`, y
 * borrar uno se llevaría el otro. Los atributos con etiqueta repetida se borran por su línea
 * de declaración; se hace primero, en orden descendente, porque los borrados por etiqueta
 * posteriores no dependen de índices de línea.
 */
export function deleteNodesFromCode(code: string, targets: readonly NodeData[], allNodes: readonly NodeData[]): string {
  const isSharedAttribute = (n: NodeData) =>
    ATTRIBUTE_TYPES.includes(n.type) && allNodes.filter(o => o.label === n.label).length > 1;

  const lineRemovals = new Set(targets.filter(isSharedAttribute).map(n => n.lineIndex));
  let result = code
    .split('\n')
    .filter((_line, index) => !lineRemovals.has(index))
    .join('\n');

  targets
    .filter(n => !isSharedAttribute(n))
    .forEach(n => {
      result = deleteNodeFromCode(result, n.label);
    });

  return result;
}

/**
 * Escapa caracteres especiales de regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
