import type { AttributeKind } from '../types';

/**
 * Utilidades para generar código DSL desde la interfaz visual
 */

interface EntityCodeProps {
  name: string;
  x: number;
  y: number;
  isWeak?: boolean;
}

interface AttributeCodeProps {
  name: string;
  entity: string;
  x: number;
  y: number;
  type: AttributeKind;
  /** Clave alternativa (solo con `type: 'key'`). */
  isUnique?: boolean;
}

export interface RelationshipParticipant {
  entity: string;
  cardinality: string;
  isTotal?: boolean;
  role?: string;
}

interface RelationshipCodeProps {
  name: string;
  x: number;
  y: number;
  isIdentifying?: boolean;
  /** Participantes, en orden: dos para una binaria, tres o más para una n-aria (§3.11 I). */
  ends: readonly RelationshipParticipant[];
}

interface SpecializationCodeProps {
  type: 'd' | 'o';
  superclass: string;
  subclasses: string[];
  /** Atributo definidor (especialización definida por atributo). Vacío = definida por el usuario. */
  definingAttribute?: string;
  /** Participación total (por defecto). `false` escribe `partial`. */
  isTotal?: boolean;
  x?: number;
  y?: number;
}

interface UnionCodeProps {
  name: string;
  superclasses: string[];
  category: string;
  x?: number;
  y?: number;
}

/** Sufijo de coordenadas; se omite si no se conocen (el compilador coloca el nodo en espiral). */
function coordSuffix(x?: number, y?: number): string {
  return x === undefined || y === undefined ? '' : ` (${Math.round(x)}, ${Math.round(y)})`;
}

/**
 * Genera código para una entidad
 */
export function generateEntityCode({ name, x, y, isWeak = false }: EntityCodeProps): string {
  const prefix = isWeak ? 'weak_ent' : 'ent';
  return `${prefix} ${name} (${x}, ${y})`;
}

/**
 * Genera código para un atributo
 */
export function generateAttributeCode({ name, entity, x, y, type, isUnique = false }: AttributeCodeProps): string {
  const prefixMap: Record<AttributeKind, string> = {
    simple: 'att',
    key: 'key_att',
    partial_key: 'partial_key_att',
    derived: 'derived_att',
    multivalued: 'multivalued_att',
  };

  const prefix = prefixMap[type];
  // `unique` solo tiene sentido en una clave: la convierte en clave alternativa (§3.11 L4).
  const uniqueSuffix = isUnique && type === 'key' ? ' unique' : '';
  return `${prefix} ${name} -> ${entity}${uniqueSuffix} (${x}, ${y})`;
}

/**
 * Genera código para una relación
 */
export function generateRelationshipCode({ name, x, y, isIdentifying = false, ends }: RelationshipCodeProps): string {
  const prefix = isIdentifying ? 'ident_rel' : 'rel';
  const linkLines = ends.map(
    end =>
      `link ${end.entity} ${name} "${end.cardinality}"${end.role ? ` role:${end.role}` : ''}${end.isTotal ? ' [total]' : ''}`
  );

  const code = [`${prefix} ${name} (${x}, ${y})`, ...linkLines].join('\n');
  return code;
}

/**
 * Genera código para una especialización/generalización
 */
export function generateSpecializationCode({ type, superclass, subclasses, definingAttribute, isTotal = true, x, y }: SpecializationCodeProps): string {
  const defining = definingAttribute?.trim() ? ` [${definingAttribute.trim()}]` : '';
  // Solo se escribe `partial`: una especialización total se queda como en la v1.7.0.
  const participation = isTotal ? '' : ' partial';
  let code = `spec ${type} -> ${superclass}${defining}${participation}${coordSuffix(x, y)}\n`;
  
  subclasses.forEach((subclass, index) => {
    code += `link ${type} ${subclass}`;
    if (index < subclasses.length - 1) {
      code += '\n';
    }
  });
  
  return code;
}

/**
 * Genera código para una unión/categoría
 */
export function generateUnionCode({ name, superclasses, category, x, y }: UnionCodeProps): string {
  let code = `union ${name}${coordSuffix(x, y)}\n`;
  
  superclasses.forEach(superclass => {
    code += `link ${superclass} ${name}\n`;
  });
  
  code += `link ${name} ${category}`;
  
  return code;
}
