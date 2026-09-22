// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { NodeData, LinkData, NodeType } from '../types';
import type { CompileResult, Diagnostic } from '../types/compiler';
import { COORD_REGEX } from '../constants';
import { extractCoordinates, createSpiralPositionGenerator } from './parser';

const KNOWN_NODE_COMMANDS = [
  'ent',
  'weak_ent',
  'rel',
  'ident_rel',
  'att',
  'key_att',
  'derived_att',
  'multivalued_attribute',
  'multivalued_att',
] as const;

/**
 * Compila y valida el código DSL del diagrama EER línea a línea.
 *
 * Emite diagnósticos en dos niveles:
 * - severity === 'error': Errores de sintaxis bloqueantes (ej: entidad sin nombre, enlace sin destino).
 * - severity === 'warning': Advertencias semánticas no bloqueantes (ej: enlace a nodo no declarado).
 *
 * Garantiza que nunca se devuelvan nodos con id o label vacíos/indefinidos.
 */
export function compileEER(code: string): CompileResult {
  const lines = code.split('\n');
  const diagnostics: Diagnostic[] = [];
  const newNodes: NodeData[] = [];
  const candidateLinks: Array<{ link: LinkData; lineIndex: number }> = [];
  const existingIds = new Set<string>();
  const declaredEntityAndRelNames = new Set<string>();

  const getDefaultPos = createSpiralPositionGenerator();

  // Primer pase: Declaración de nodos y validación sintáctica
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const cleanLine = line.trim();

    // Ignorar líneas vacías, comentarios y cabeceras de layout relacional
    if (!cleanLine || cleanLine.startsWith('//') || cleanLine.startsWith('--') || cleanLine.startsWith('/*')) {
      return;
    }

    const coords = extractCoordinates(cleanLine);
    const lineWithoutCoords = cleanLine.replace(COORD_REGEX, '').trim();
    const parts = lineWithoutCoords.split(/\s+/);
    const command = parts[0]?.toLowerCase() ?? '';

    // Ignorar comandos de layout relacional guardados en archivos .eer
    if (command === 'relational') {
      return;
    }

    // 1. Comandos de Nodos (Entidades, Relaciones, Atributos)
    if (KNOWN_NODE_COMMANDS.includes(command as typeof KNOWN_NODE_COMMANDS[number])) {
      const label = parts[1]?.trim();

      // Validación bloqueante: Falta el nombre del nodo
      if (!label) {
        let messageKey = 'compiler.missingEntityName';
        if (['rel', 'ident_rel'].includes(command)) {
          messageKey = 'compiler.missingRelationshipName';
        } else if (['att', 'key_att', 'derived_att', 'multivalued_attribute', 'multivalued_att'].includes(command)) {
          messageKey = 'compiler.missingAttributeName';
        }

        diagnostics.push({
          line: lineNum,
          severity: 'error',
          code: 'MISSING_NODE_NAME',
          messageKey,
          params: { command },
        });
        return;
      }

      const isAttribute = ['att', 'key_att', 'derived_att', 'multivalued_attribute', 'multivalued_att'].includes(command);
      const isEntityOrRel = ['ent', 'weak_ent', 'rel', 'ident_rel'].includes(command);

      // Advertencia semántica: Nombres duplicados de entidades o relaciones principales
      if (isEntityOrRel) {
        const upperLabel = label.toUpperCase();
        if (declaredEntityAndRelNames.has(upperLabel)) {
          diagnostics.push({
            line: lineNum,
            severity: 'warning',
            code: 'DUPLICATE_NODE_IDENTIFIER',
            messageKey: 'compiler.duplicateNode',
            params: { name: label },
          });
        } else {
          declaredEntityAndRelNames.add(upperLabel);
        }
      }

      // Generar ID único
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
      if (command === 'multivalued_attribute' || command === 'multivalued_att') type = 'multivalued_attribute';

      // Atajo para atributo: att Nombre -> Entidad
      let parentEntity: string | undefined;
      if (isAttribute && lineWithoutCoords.includes('->')) {
        const arrowIndex = parts.indexOf('->');
        if (arrowIndex !== -1) {
          const targetParent = parts[arrowIndex + 1]?.trim();
          if (!targetParent) {
            diagnostics.push({
              line: lineNum,
              severity: 'error',
              code: 'MISSING_PARENT_ENTITY',
              messageKey: 'compiler.missingParentEntity',
              params: { command, name: label },
            });
          } else {
            parentEntity = targetParent;
            candidateLinks.push({
              link: { source: targetParent, target: id, label: '', style: 'solid' },
              lineIndex: index,
            });
          }
        }
      }

      newNodes.push({ id, type, label, x, y, lineIndex: index, parentEntity });
      return;
    }

    // 2. Especialización / Unión
    if (['spec', 'union'].includes(command)) {
      const meta = parts[1] && parts[1] !== '->' ? parts[1].trim() : command === 'union' ? 'u' : 'd';
      let id = meta || `spec_${index}`;
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
        lineIndex: index,
      });

      if (lineWithoutCoords.includes('->')) {
        const arrowIndex = parts.indexOf('->');
        if (arrowIndex !== -1) {
          const targetParent = parts[arrowIndex + 1]?.trim();
          if (!targetParent) {
            diagnostics.push({
              line: lineNum,
              severity: 'error',
              code: 'MISSING_PARENT_ENTITY',
              messageKey: 'compiler.missingParentEntity',
              params: { command, name: meta },
            });
          } else {
            candidateLinks.push({
              link: { source: targetParent, target: id, label: '', style: 'double' },
              lineIndex: index,
            });
          }
        }
      }
      return;
    }

    // 3. Conexiones (link)
    if (command === 'link') {
      const source = parts[1]?.trim();
      const target = parts[2]?.trim();

      if (!source || !target) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          code: 'INCOMPLETE_LINK',
          messageKey: 'compiler.incompleteLink',
          params: {},
        });
        return;
      }

      let label = '';
      let style: 'solid' | 'double' = 'solid';

      const labelMatch = lineWithoutCoords.match(/"([^"]+)"/);
      if (labelMatch && labelMatch[1]) label = labelMatch[1];

      if (lineWithoutCoords.includes('[total]') || lineWithoutCoords.includes('[double]')) {
        style = 'double';
      }

      candidateLinks.push({
        link: { source, target, label, style },
        lineIndex: index,
      });
      return;
    }

    // 4. Comando no reconocido
    diagnostics.push({
      line: lineNum,
      severity: 'error',
      code: 'UNKNOWN_COMMAND',
      messageKey: 'compiler.unknownCommand',
      params: { command },
    });
  });

  // Segundo pase: Resolución y validación semántica de enlaces
  const resolvedLinks: LinkData[] = [];
  candidateLinks.forEach(({ link, lineIndex }) => {
    const lineNum = lineIndex + 1;
    const sourceExists = newNodes.some(n => n.id === link.source || n.label === link.source);
    const targetExists = newNodes.some(n => n.id === link.target || n.label === link.target);

    if (!sourceExists) {
      diagnostics.push({
        line: lineNum,
        severity: 'warning',
        code: 'UNDECLARED_NODE_REFERENCE',
        messageKey: 'compiler.undeclaredReference',
        params: { name: link.source },
      });
    }

    if (!targetExists) {
      diagnostics.push({
        line: lineNum,
        severity: 'warning',
        code: 'UNDECLARED_NODE_REFERENCE',
        messageKey: 'compiler.undeclaredReference',
        params: { name: link.target },
      });
    }

    // Solo emitir el enlace si ambos extremos existen en el grafo
    if (sourceExists && targetExists) {
      resolvedLinks.push(link);
    }
  });

  const isValid = !diagnostics.some(d => d.severity === 'error');

  return {
    isValid,
    nodes: newNodes,
    links: resolvedLinks,
    diagnostics,
  };
}
