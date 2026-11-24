// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { isAttributeType, type NodeData, type LinkData, type NodeType } from '../types';
import type { CompileResult, Diagnostic, DiagnosticCode } from '../types/compiler';
import { COORD_REGEX } from '../constants';
import { extractCoordinates, createSpiralPositionGenerator } from './parser';
import { findFreePosition, ATTRIBUTE_STEP_X } from './layout';

const DEFINING_ATTRIBUTE_REGEX = /\[([^\]]*)\]/;
// Admite letras con tilde: los alumnos nombran atributos en español (`Categoría`).
const IDENTIFIER_REGEX = /^[\p{L}_][\p{L}\p{N}_]*$/u;
const ONE_CARDINALITIES = ['1', '0..1', '1..1'];

const KNOWN_NODE_COMMANDS = [
  'ent',
  'weak_ent',
  'rel',
  'ident_rel',
  'att',
  'key_att',
  'partial_key_att',
  'derived_att',
  'multivalued_attribute',
  'multivalued_att',
] as const;

const ATTRIBUTE_COMMANDS: readonly string[] = ['att', 'key_att', 'partial_key_att', 'derived_att', 'multivalued_attribute', 'multivalued_att'];
// Participación de una especialización (`spec d -> X partial`); sin palabra = total, como en la v1.7.0.
const SPECIALIZATION_OPTIONS = ['partial', 'total'];
const ROLE_PREFIX = 'role:';

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
        } else if (ATTRIBUTE_COMMANDS.includes(command)) {
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

      const isAttribute = ATTRIBUTE_COMMANDS.includes(command);
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

      // Determinar posición final. Un atributo pegado con las mismas coordenadas exactas que un
      // nodo anterior (copiar/pegar una línea en el DSL) se dibuja desplazado para que no quede
      // oculto debajo; el texto no se reescribe hasta que el usuario lo arrastre.
      let { x, y } = coords || getDefaultPos();
      if (isAttribute && coords && newNodes.some(n => n.x === coords.x && n.y === coords.y)) {
        ({ x, y } = findFreePosition({ x: coords.x + ATTRIBUTE_STEP_X, y: coords.y }, newNodes));
      }

      // Determinar tipo de nodo
      let type: NodeType = 'entity';
      if (command === 'weak_ent') type = 'weak_entity';
      if (command === 'rel') type = 'relationship';
      if (command === 'ident_rel') type = 'identifying_relationship';
      if (command === 'att') type = 'attribute';
      if (command === 'key_att') type = 'key_attribute';
      if (command === 'partial_key_att') type = 'partial_key_attribute';
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

      // Clave alternativa: `key_att Email -> CLIENTE unique` (§3.11 L4). La palabra va tras el propietario.
      const arrowAt = parts.indexOf('->');
      const options = (arrowAt === -1 ? parts.slice(2) : parts.slice(arrowAt + 2)).map(p => p.toLowerCase());
      const isUnique = command === 'key_att' && options.includes('unique');

      newNodes.push({ id, type, label, x, y, lineIndex: index, parentEntity, ...(isUnique ? { isUnique } : {}) });
      return;
    }

    // 2. Especialización / Unión
    if (['spec', 'union'].includes(command)) {
      // Atributo definidor opcional: `spec d -> EMPLEADO [TipoTrabajo]`. Sin corchetes la
      // especialización es definida por el usuario (no hay discriminante).
      let definingAttribute: string | undefined;
      let specParts = parts;
      const definingMatch = command === 'spec' ? lineWithoutCoords.match(DEFINING_ATTRIBUTE_REGEX) : null;
      if (definingMatch) {
        const candidate = definingMatch[1]!.trim();
        if (!IDENTIFIER_REGEX.test(candidate)) {
          diagnostics.push({
            line: lineNum,
            severity: 'error',
            code: 'INVALID_DEFINING_ATTRIBUTE',
            messageKey: 'compiler.invalidDefiningAttribute',
            params: { name: candidate },
          });
          return;
        }
        definingAttribute = candidate;
        specParts = lineWithoutCoords.replace(DEFINING_ATTRIBUTE_REGEX, ' ').trim().split(/\s+/);
      }

      const meta = specParts[1] && specParts[1] !== '->' ? specParts[1].trim() : command === 'union' ? 'u' : 'd';
      let id = meta || `spec_${index}`;
      if (existingIds.has(id)) {
        id = `${id}_${index}`;
      }
      existingIds.add(id);

      const { x, y } = coords || getDefaultPos();

      // Participación: palabra opcional tras la superclase (y tras `[ATTR]`, ya retirado de
      // `specParts`). Cualquier otra palabra es un error: hasta la v1.7.0 se ignoraba en silencio.
      const specArrow = specParts.indexOf('->');
      const afterSuper = command === 'spec' && specArrow !== -1 ? specParts.slice(specArrow + 2) : [];
      // Un comentario al final de la línea (`// …`) no es una opción, como en `att` o `link`.
      const commentAt = afterSuper.findIndex(o => o.startsWith('//'));
      const specOptions = commentAt === -1 ? afterSuper : afterSuper.slice(0, commentAt);
      const invalidOption = specOptions.find(o => !SPECIALIZATION_OPTIONS.includes(o.toLowerCase()));
      if (invalidOption) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          code: 'INVALID_SPECIALIZATION_OPTION',
          messageKey: 'compiler.invalidSpecializationOption',
          params: { option: invalidOption },
        });
        return;
      }
      const isPartial = specOptions.some(o => o.toLowerCase() === 'partial');

      newNodes.push({
        id,
        type: command === 'union' ? 'union' : 'specialization',
        label: meta,
        x,
        y,
        meta,
        lineIndex: index,
        definingAttribute,
        ...(isPartial ? { isPartial } : {}),
      });

      if (lineWithoutCoords.includes('->')) {
        const arrowIndex = specParts.indexOf('->');
        if (arrowIndex !== -1) {
          const targetParent = specParts[arrowIndex + 1]?.trim();
          if (!targetParent) {
            diagnostics.push({
              line: lineNum,
              severity: 'error',
              code: 'MISSING_PARENT_ENTITY',
              messageKey: 'compiler.missingParentEntity',
              params: { command, name: meta },
            });
          } else {
            // En notación de Elmasri el atributo definidor se rotula sobre la arista
            // superclase–círculo; reutilizamos la etiqueta del enlace para dibujarlo.
            // Doble línea = participación total; simple = parcial (§3.11 D).
            candidateLinks.push({
              link: { source: targetParent, target: id, label: definingAttribute ?? '', style: isPartial ? 'solid' : 'double' },
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

      // Rol del participante: `role:Supervisor` (§3.11 E). Da nombre a su FK en el relacional.
      const roleToken = parts.slice(3).find(p => p.toLowerCase().startsWith(ROLE_PREFIX));
      const role = roleToken?.slice(ROLE_PREFIX.length);
      if (roleToken !== undefined && !IDENTIFIER_REGEX.test(role ?? '')) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          code: 'INVALID_ROLE',
          messageKey: 'compiler.invalidRole',
          params: { role: role ?? '' },
        });
        return;
      }

      candidateLinks.push({
        link: { source, target, label, style, ...(role ? { role } : {}) },
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

  // Segundo pase: Resolución y validación semántica de enlaces.
  // Los extremos se normalizan al id del nodo: el dibujo y el motor relacional buscan por id,
  // y un atributo tiene id con sufijo (`Direccion_3`), así que un enlace que guardara la
  // etiqueta (`att Calle -> Direccion`) no se dibujaba ni se mapeaba (§3.11 C).
  const resolvedLinks: LinkData[] = [];
  candidateLinks.forEach(({ link, lineIndex }) => {
    const lineNum = lineIndex + 1;
    const source = resolveReference(link.source, lineIndex, newNodes);
    const target = resolveReference(link.target, lineIndex, newNodes);
    const sourceExists = source.id !== undefined;
    const targetExists = target.id !== undefined;

    [source, target].forEach((ref, i) => {
      if (ref.isAmbiguous) {
        diagnostics.push({
          line: lineNum,
          severity: 'warning',
          code: 'AMBIGUOUS_ATTRIBUTE_REFERENCE',
          messageKey: 'compiler.ambiguousAttributeReference',
          params: { name: i === 0 ? link.source : link.target },
        });
      }
    });

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
      resolvedLinks.push({ ...link, source: source.id!, target: target.id!, lineIndex });
    }
  });

  // `parentEntity` también pasa a ser el id real (agrupar al arrastrar y mapear compuestos).
  newNodes.forEach(n => {
    if (n.parentEntity) {
      n.parentEntity = resolveReference(n.parentEntity, n.lineIndex, newNodes).id ?? n.parentEntity;
    }
  });

  diagnostics.push(...lintKeyAttributesOnRelationships(newNodes, resolvedLinks));
  diagnostics.push(...lintWeakEntitiesAndRoles(newNodes, resolvedLinks));

  const isValid = !diagnostics.some(d => d.severity === 'error');

  return {
    isValid,
    nodes: newNodes,
    links: resolvedLinks,
    diagnostics,
  };
}

interface ResolvedReference {
  id: string | undefined;
  isAmbiguous: boolean;
}

/**
 * Avisos pedagógicos sobre entidades débiles, claves parciales y roles (§3.11 G). Son errores
 * de modelado frecuentes en examen que el diagrama dibuja sin queja pero que el Paso 2 o el
 * relacional no pueden resolver bien. Nunca bloquean (severity 'warning').
 */
function lintWeakEntitiesAndRoles(nodes: readonly NodeData[], links: readonly LinkData[]): Diagnostic[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const lineOf = (node: NodeData) => node.lineIndex + 1;
  // Propietario de un atributo: el de `->` (ya resuelto a id) o el otro extremo de su `link`.
  const ownerOf = (attr: NodeData) =>
    byId.get(attr.parentEntity ?? '') ??
    links.map(l => (l.target === attr.id ? byId.get(l.source) : undefined)).find(n => n && !isAttributeType(n.type));
  const diagnostics: Diagnostic[] = [];
  const warn = (node: NodeData, code: DiagnosticCode, messageKey: string, params: Record<string, string>) =>
    diagnostics.push({ line: lineOf(node), severity: 'warning', code, messageKey, params });

  nodes
    .filter(n => n.type === 'weak_entity')
    .forEach(weak => {
      const neighbours = links.filter(l => l.source === weak.id || l.target === weak.id).map(l => byId.get(l.source === weak.id ? l.target : l.source));
      if (!neighbours.some(n => n?.type === 'identifying_relationship')) {
        warn(weak, 'WEAK_ENTITY_WITHOUT_IDENTIFYING_RELATIONSHIP', 'compiler.weakEntityWithoutIdentifyingRelationship', { name: weak.label });
      }
      const keys = nodes.filter(
        n => (n.type === 'partial_key_attribute' || (n.type === 'key_attribute' && !n.isUnique)) && ownerOf(n) === weak
      );
      if (keys.length === 0) {
        warn(weak, 'WEAK_ENTITY_WITHOUT_PARTIAL_KEY', 'compiler.weakEntityWithoutPartialKey', { name: weak.label });
      }
    });

  nodes.forEach(attr => {
    const owner = attr.type === 'key_attribute' || attr.type === 'partial_key_attribute' ? ownerOf(attr) : undefined;
    if (attr.type === 'key_attribute' && !attr.isUnique && owner?.type === 'weak_entity') {
      warn(attr, 'KEY_ATTRIBUTE_ON_WEAK_ENTITY', 'compiler.keyAttributeOnWeakEntity', { name: attr.label, entity: owner.label });
    }
    if (attr.type === 'partial_key_attribute' && owner && owner.type !== 'weak_entity') {
      warn(attr, 'PARTIAL_KEY_ON_STRONG_ENTITY', 'compiler.partialKeyOnStrongEntity', { name: attr.label, owner: owner.label });
    }
  });

  // Recursiva: la misma entidad participa varias veces; sin roles no se sabe quién es quién
  // y el relacional numera las FK (EMPLEADO_DNI, EMPLEADO_DNI_2) en lugar de nombrarlas.
  nodes
    .filter(n => n.type === 'relationship' || n.type === 'identifying_relationship')
    .forEach(rel => {
      // `link` admite los dos sentidos (`link E R` y `link R E`): se mira el otro extremo.
      const participants = links
        .filter(l => l.source === rel.id || l.target === rel.id)
        .map(l => ({ link: l, entity: byId.get(l.source === rel.id ? l.target : l.source) }))
        .filter(p => p.entity?.type === 'entity' || p.entity?.type === 'weak_entity');
      const repeated = participants.filter(p => participants.filter(o => o.entity === p.entity).length > 1);
      if (repeated.some(p => !p.link.role)) {
        warn(rel, 'RECURSIVE_RELATIONSHIP_WITHOUT_ROLES', 'compiler.recursiveRelationshipWithoutRoles', {
          name: rel.label,
          entity: repeated[0]!.entity!.label,
        });
      }
    });

  return diagnostics;
}

/**
 * Resuelve una referencia del DSL (`link A B`, `att X -> A`) al id de un nodo declarado.
 *
 * - Un id existente se respeta tal cual: así `link d X` sigue yendo a la especialización `d`
 *   aunque haya otra rotulada `d` (su id es `d_12`).
 * - Si es una etiqueta, ganan las entidades, relaciones y especializaciones (la primera
 *   declarada, como hasta la v1.7.0).
 * - Si solo hay atributos con esa etiqueta, se toma el último declarado ANTES de la línea que
 *   la usa (lo natural al escribir `att Direccion -> CLIENTE` y debajo sus componentes) o,
 *   si todos van después, el primero. Varios candidatos ⇒ ambigua (aviso, no error).
 */
function resolveReference(ref: string, lineIndex: number, nodes: readonly NodeData[]): ResolvedReference {
  const byId = nodes.find(n => n.id === ref);
  const byLabel = nodes.filter(n => n.label === ref);
  const nonAttribute = byLabel.find(n => !isAttributeType(n.type));
  const before = byLabel.filter(n => n.lineIndex < lineIndex);
  const attributeChoice = before[before.length - 1] ?? byLabel[0];

  const resolved = byId ?? nonAttribute ?? attributeChoice;
  return {
    id: resolved?.id,
    isAmbiguous: !byId && !nonAttribute && byLabel.length > 1,
  };
}

/**
 * Advierte de atributos clave colgados de relaciones binarias con algún lado de cardinalidad 1.
 *
 * Solo en una tabla de relación (M:N o n-aria) un atributo de la relación puede formar parte de
 * la PK. En 1:1 y 1:N sus atributos migran a una tabla de entidad cuya PK ya está fijada, así que
 * marcarlos como clave no tiene significado formal: el alumno probablemente quería otra cosa.
 */
function lintKeyAttributesOnRelationships(nodes: NodeData[], links: LinkData[]): Diagnostic[] {
  const findNode = (ref: string) => nodes.find(n => n.id === ref || n.label === ref);
  const isEntity = (node?: NodeData) => node?.type === 'entity' || node?.type === 'weak_entity';
  const diagnostics: Diagnostic[] = [];

  nodes
    .filter(n => n.type === 'key_attribute' && n.parentEntity)
    .forEach(attr => {
      const rel = findNode(attr.parentEntity!);
      if (rel?.type !== 'relationship' && rel?.type !== 'identifying_relationship') return;

      const entityLinks = links.filter(l => {
        const ends = [findNode(l.source), findNode(l.target)];
        return ends.includes(rel) && ends.some(isEntity);
      });
      const isBinaryWithOneSide =
        entityLinks.length === 2 && entityLinks.some(l => ONE_CARDINALITIES.includes((l.label ?? '').toUpperCase()));

      if (isBinaryWithOneSide) {
        diagnostics.push({
          line: attr.lineIndex + 1,
          severity: 'warning',
          code: 'KEY_ATTRIBUTE_ON_NON_MN_RELATIONSHIP',
          messageKey: 'compiler.keyAttributeOnNonMNRelationship',
          params: { name: attr.label, rel: rel.label },
        });
      }
    });

  return diagnostics;
}
