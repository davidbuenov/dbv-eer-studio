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

/**
 * Escapa caracteres especiales de regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
