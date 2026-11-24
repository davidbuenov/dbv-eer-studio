// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { isAttributeType, type AttributeKind, type NodeData, type LinkData } from '../types';
import {
  generateEntityCode,
  generateAttributeCode,
  generateRelationshipCode,
  generateSpecializationCode,
  generateUnionCode,
} from './codeGenerator';

/*
 * Edición del DSL EER como transformaciones puras `string → string`.
 *
 * Todas las funciones confían en los `lineIndex` que emite `compileEER`, así que SOLO deben
 * aplicarse a un código que compila (isValid === true): con Stale-while-error los nodos en
 * pantalla pueden pertenecer a un texto anterior y sus índices ya no corresponderían.
 */

export type { AttributeKind };

export interface RelationshipEnd {
  entity: string;
  cardinality: string;
  isTotal: boolean;
  /** Rol del participante (`role:Supervisor`), §3.11 E. */
  role?: string;
}

/** Cambios pedidos desde el formulario de propiedades en modo edición. */
export type ElementEdit =
  | { kind: 'entity'; name: string; isWeak: boolean }
  | { kind: 'attribute'; name: string; attrType: AttributeKind; owner: string; isUnique?: boolean }
  // Cualquier grado: binaria, ternaria… (§3.11 I). Sin participantes solo se escribe la declaración.
  | { kind: 'relationship'; name: string; isIdentifying: boolean; ends: RelationshipEnd[] }
  | {
      kind: 'specialization';
      specType: 'd' | 'o';
      superclass: string;
      subclasses: string[];
      definingAttribute: string;
      isTotal: boolean;
    }
  | { kind: 'union'; name: string; superclasses: string[]; category: string };

const ENTITY_TYPES = ['entity', 'weak_entity'];
const RELATIONSHIP_TYPES = ['relationship', 'identifying_relationship'];

/**
 * Resuelve una referencia del DSL como lo hace el motor: primero por id y, si no, por etiqueta.
 * Así `link d X` pertenece a la especialización cuyo id es `d`, aunque haya otras rotuladas `d`.
 */
export function resolveNodeRef(ref: string, nodes: readonly NodeData[]): NodeData | undefined {
  return nodes.find(n => n.id === ref) ?? nodes.find(n => n.label === ref);
}

/**
 * Líneas del DSL que "pertenecen" a un nodo: su declaración y, según el tipo, las líneas `link`
 * que lo conectan con sus entidades (relación), subclases (especialización) o superclases y
 * categoría (unión). Sirve para resaltarlas en el editor y para reescribirlas al editar.
 */
export function getOwnedLineIndices(node: NodeData, nodes: readonly NodeData[], links: readonly LinkData[]): number[] {
  const isEntityRef = (ref: string) => ENTITY_TYPES.includes(resolveNodeRef(ref, nodes)?.type ?? '');
  const touchesNode = (l: LinkData) =>
    resolveNodeRef(l.source, nodes) === node || resolveNodeRef(l.target, nodes) === node;
  const owned = new Set<number>([node.lineIndex]);

  let ownedLinks: LinkData[] = [];
  if (RELATIONSHIP_TYPES.includes(node.type)) {
    ownedLinks = links.filter(l => touchesNode(l) && (isEntityRef(l.source) || isEntityRef(l.target)));
  } else if (isAttributeType(node.type)) {
    // Un atributo colgado con `link ENTIDAD attr` en vez de `->`: esa línea también es suya.
    ownedLinks = findParentLinks(node, nodes, links);
  } else if (node.type === 'specialization' || node.type === 'union') {
    ownedLinks = links.filter(touchesNode);
  }
  ownedLinks.forEach(l => {
    if (l.lineIndex !== undefined) owned.add(l.lineIndex);
  });

  return [...owned].sort((a, b) => a - b);
}

/**
 * Sustituye el bloque de un elemento: la primera línea propia recibe `newBlock` (puede ser
 * multilínea) y el resto de líneas propias se eliminan. Las líneas `link` de un elemento
 * quedan agrupadas bajo su declaración (riesgo aceptado: su orden no tiene semántica).
 */
export function replaceElementBlock(code: string, ownedLines: readonly number[], newBlock: string): string {
  const lines = code.split('\n');
  const valid = ownedLines.filter(i => i >= 0 && i < lines.length);
  const first = Math.min(...valid);
  const toDrop = new Set(valid);
  const result: string[] = [];

  lines.forEach((line, index) => {
    if (index === first) {
      result.push(...newBlock.split('\n'));
    } else if (!toDrop.has(index)) {
      result.push(line);
    }
  });

  return valid.length > 0 ? result.join('\n') : code;
}

const LINK_LINE_REGEX = /^(\s*link\s+)(\S+)(\s+)(\S+)(.*)$/;
// El nombre tras `->` termina en espacio, en `[` (atributo definidor) o en `(` (coordenadas).
const ARROW_REF_REGEX = /(->\s*)([^\s[(]+)/;

/**
 * Renombra las REFERENCIAS a un nodo: extremos de `link` y el nombre tras `->`.
 *
 * Opera por posiciones sintácticas, nunca con un reemplazo de texto libre: así no toca el
 * comando, las cardinalidades entre comillas, las coordenadas ni otro nodo cuyo nombre solo
 * contenga al antiguo como subcadena. La línea de declaración la reescribe quien llama.
 */
export function renameReferences(code: string, oldLabel: string, newLabel: string): string {
  const renameToken = (token: string) => (token === oldLabel ? newLabel : token);
  const result = code.split('\n').map(line => {
    const trimmed = line.trim();
    let updated = line;
    if (trimmed.startsWith('//') || trimmed.startsWith('--')) {
      updated = line;
    } else if (LINK_LINE_REGEX.test(line)) {
      updated = line.replace(
        LINK_LINE_REGEX,
        (_m, head: string, source: string, gap: string, target: string, tail: string) =>
          `${head}${renameToken(source)}${gap}${renameToken(target)}${tail}`
      );
    } else if (ARROW_REF_REGEX.test(line)) {
      updated = line.replace(ARROW_REF_REGEX, (_m, arrow: string, ref: string) => `${arrow}${renameToken(ref)}`);
    }
    return updated;
  });
  return result.join('\n');
}

/**
 * Enlaces que unen un atributo con su propietario: una entidad o relación (en cualquier sentido)
 * o, si es un componente, el atributo compuesto del que sale el enlace (`Direccion → Calle`).
 */
function findParentLinks(attr: NodeData, nodes: readonly NodeData[], links: readonly LinkData[]): LinkData[] {
  const isOwnerType = (n?: NodeData) => ENTITY_TYPES.includes(n?.type ?? '') || RELATIONSHIP_TYPES.includes(n?.type ?? '');
  return links.filter(l => {
    const source = resolveNodeRef(l.source, nodes);
    const target = resolveNodeRef(l.target, nodes);
    const fromComposite = target === attr && !!source && isAttributeType(source.type);
    return (source === attr && isOwnerType(target)) || (target === attr && isOwnerType(source)) || fromComposite;
  });
}

/**
 * Normaliza un nombre escrito en un formulario para que sea un único token del DSL. El
 * compilador separa por espacios y da significado a `->`, comillas, corchetes y paréntesis,
 * así que "Fecha alta" o "A->B" romperían o reinterpretarían la línea: todo carácter que no
 * sea letra (con tildes), dígito o `_` se sustituye por `_`.
 */
export function toDslIdentifier(name: string): string {
  return name.trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_]/gu, '_');
}

const ATTRIBUTE_KIND_BY_TYPE: Record<string, AttributeKind> = {
  attribute: 'simple',
  key_attribute: 'key',
  partial_key_attribute: 'partial_key',
  derived_attribute: 'derived',
  multivalued_attribute: 'multivalued',
};

/** Tipo de atributo del formulario correspondiente a un `NodeType` de atributo. */
export function attributeKindOf(node: NodeData): AttributeKind {
  return ATTRIBUTE_KIND_BY_TYPE[node.type] ?? 'simple';
}

const labelOf = (ref: string, nodes: readonly NodeData[]) => resolveNodeRef(ref, nodes)?.label ?? ref;

/** Un nombre de atributo repetido en el diagrama no sirve como propietario: `-> Nombre` sería ambiguo. */
const isUniqueLabel = (node: NodeData, nodes: readonly NodeData[]) => nodes.filter(n => n.label === node.label).length === 1;

/**
 * Propietario que se sugiere al crear un atributo con un elemento seleccionado: una entidad,
 * una relación o un atributo (el nuevo será un componente suyo: atributo compuesto). Un atributo
 * con nombre repetido no se sugiere, porque la referencia por nombre sería ambigua.
 */
export function suggestedAttributeOwner(selected: NodeData | undefined, nodes: readonly NodeData[]): string | undefined {
  const canOwn =
    !!selected &&
    (ENTITY_TYPES.includes(selected.type) ||
      RELATIONSHIP_TYPES.includes(selected.type) ||
      (isAttributeType(selected.type) && isUniqueLabel(selected, nodes)));
  return canOwn ? selected.label : undefined;
}

export interface AttributeOwnerOption {
  label: string;
  /** Etiqueta del elemento del que cuelga (para mostrar «Direccion (CLIENTE)»). */
  ownerLabel: string;
  /** Hay otro atributo con el mismo nombre: no se puede elegir desde el formulario. */
  ambiguous: boolean;
}

/**
 * Atributos que pueden ser propietarios de otro (componentes de un atributo compuesto, §3.11 C),
 * para el desplegable «Pertenece a». `exclude` es el atributo en edición (no puede colgar de sí mismo).
 */
export function attributeOwnerOptions(nodes: readonly NodeData[], links: readonly LinkData[], exclude?: string): AttributeOwnerOption[] {
  return nodes
    .filter(n => isAttributeType(n.type) && n.id !== exclude)
    .map(n => {
      const link = findParentLinks(n, nodes, links)[0];
      const owner = n.parentEntity ?? (link ? (resolveNodeRef(link.source, nodes) === n ? link.target : link.source) : '');
      return { label: n.label, ownerLabel: labelOf(owner, nodes), ambiguous: !isUniqueLabel(n, nodes) };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Estado inicial del formulario de edición de un nodo: lo que hoy dice el DSL sobre él.
 * Es el inverso de `applyElementEdit` (ver tests de ida y vuelta).
 */
export function describeNodeForEdit(node: NodeData, nodes: readonly NodeData[], links: readonly LinkData[]): ElementEdit {
  const isNode = (ref: string) => resolveNodeRef(ref, nodes) === node;
  const isEntityRef = (ref: string) => ENTITY_TYPES.includes(resolveNodeRef(ref, nodes)?.type ?? '');
  let description: ElementEdit;

  if (ENTITY_TYPES.includes(node.type)) {
    description = { kind: 'entity', name: node.label, isWeak: node.type === 'weak_entity' };
  } else if (isAttributeType(node.type)) {
    const parentLink = findParentLinks(node, nodes, links)[0];
    const linkedOwner = parentLink ? (isNode(parentLink.source) ? parentLink.target : parentLink.source) : '';
    description = {
      kind: 'attribute',
      name: node.label,
      attrType: attributeKindOf(node),
      owner: labelOf(node.parentEntity ?? linkedOwner, nodes),
      isUnique: node.isUnique ?? false,
    };
  } else if (RELATIONSHIP_TYPES.includes(node.type)) {
    const ends: RelationshipEnd[] = links
      .filter(l => (isNode(l.source) && isEntityRef(l.target)) || (isNode(l.target) && isEntityRef(l.source)))
      .sort((a, b) => (a.lineIndex ?? 0) - (b.lineIndex ?? 0))
      .map(l => ({
        entity: labelOf(isNode(l.source) ? l.target : l.source, nodes),
        cardinality: l.label ?? '',
        isTotal: l.style === 'double',
        ...(l.role ? { role: l.role } : {}),
      }));
    description = {
      kind: 'relationship',
      name: node.label,
      isIdentifying: node.type === 'identifying_relationship',
      ends,
    };
  } else if (node.type === 'specialization') {
    const superLink = links.find(l => isNode(l.target) && !isNode(l.source));
    description = {
      kind: 'specialization',
      specType: node.meta === 'o' ? 'o' : 'd',
      superclass: superLink ? labelOf(superLink.source, nodes) : '',
      subclasses: links.filter(l => isNode(l.source)).map(l => labelOf(l.target, nodes)),
      definingAttribute: node.definingAttribute ?? '',
      isTotal: !node.isPartial,
    };
  } else {
    const categoryLink = links.find(l => isNode(l.source));
    description = {
      kind: 'union',
      name: node.label,
      superclasses: links.filter(l => isNode(l.target)).map(l => labelOf(l.source, nodes)),
      category: categoryLink ? labelOf(categoryLink.target, nodes) : '',
    };
  }

  return description;
}

/**
 * Código DSL de un elemento descrito por el formulario, en la posición indicada. Lo usan tanto
 * la creación (posición del clic) como la edición (posición actual del nodo).
 */
export function generateElementCode(element: ElementEdit, x: number, y: number): string {
  let code: string;
  if (element.kind === 'entity') {
    code = generateEntityCode({ name: element.name, x, y, isWeak: element.isWeak });
  } else if (element.kind === 'attribute') {
    code = generateAttributeCode({
      name: element.name,
      entity: element.owner,
      x,
      y,
      type: element.attrType,
      isUnique: element.isUnique ?? false,
    });
  } else if (element.kind === 'relationship') {
    code = generateRelationshipCode({
      name: element.name,
      x: Math.round(x),
      y: Math.round(y),
      isIdentifying: element.isIdentifying,
      ends: element.ends,
    });
  } else if (element.kind === 'specialization') {
    code = generateSpecializationCode({
      type: element.specType,
      superclass: element.superclass,
      subclasses: element.subclasses,
      definingAttribute: element.definingAttribute,
      isTotal: element.isTotal,
      x,
      y,
    });
  } else {
    code = generateUnionCode({ name: element.name, superclasses: element.superclasses, category: element.category, x, y });
  }
  return code;
}

/**
 * Aplica al DSL la edición de un nodo existente y devuelve el código nuevo.
 * Conserva las coordenadas actuales del nodo (las escribe si el nodo no las tenía).
 */
export function applyElementEdit(
  code: string,
  node: NodeData,
  nodes: readonly NodeData[],
  links: readonly LinkData[],
  edit: ElementEdit
): string {
  const oldLabel = node.label;
  const newLabel = edit.kind === 'specialization' ? edit.specType : edit.name;
  // Una entidad (o una relación aún sin participantes) solo reescribe su declaración.
  const onlyDeclaration = edit.kind === 'entity' || (edit.kind === 'relationship' && edit.ends.length === 0);
  const ownedLines = onlyDeclaration ? [node.lineIndex] : getOwnedLineIndices(node, nodes, links);
  const newCode = replaceElementBlock(code, ownedLines, generateElementCode(edit, node.x, node.y));

  // Especializaciones y uniones regeneran dentro del bloque todas las líneas que las nombran.
  // Un atributo no tiene nombre único (varias entidades pueden tener `Nombre`): renombrar sus
  // referencias globalmente arrastraría a los homónimos, así que solo se hace si es único.
  const renameGlobally =
    edit.kind === 'entity' ||
    edit.kind === 'relationship' ||
    (edit.kind === 'attribute' && nodes.filter(n => n.label === oldLabel).length === 1);

  return renameGlobally && newLabel !== oldLabel ? renameReferences(newCode, oldLabel, newLabel) : newCode;
}
