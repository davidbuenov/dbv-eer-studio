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
  type: 'simple' | 'key' | 'derived' | 'multivalued';
}

interface RelationshipCodeProps {
  name: string;
  x: number;
  y: number;
  isIdentifying?: boolean;
  entity1: string;
  entity2: string;
  cardinality1: string;
  cardinality2: string;
  isTotal1?: boolean;
  isTotal2?: boolean;
}

interface SpecializationCodeProps {
  type: 'd' | 'o';
  superclass: string;
  subclasses: string[];
}

interface UnionCodeProps {
  name: string;
  superclasses: string[];
  category: string;
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
export function generateAttributeCode({ name, entity, x, y, type }: AttributeCodeProps): string {
  const prefixMap = {
    simple: 'att',
    key: 'key_att',
    derived: 'derived_att',
    multivalued: 'multivalued_att'
  };
  
  const prefix = prefixMap[type];
  return `${prefix} ${name} -> ${entity} (${x}, ${y})`;
}

/**
 * Genera código para una relación
 */
export function generateRelationshipCode({
  name,
  x,
  y,
  isIdentifying = false,
  entity1,
  entity2,
  cardinality1,
  cardinality2,
  isTotal1 = false,
  isTotal2 = false
}: RelationshipCodeProps): string {
  const prefix = isIdentifying ? 'ident_rel' : 'rel';
  
  let code = `${prefix} ${name} (${x}, ${y})\n`;
  code += `link ${entity1} ${name} "${cardinality1}"${isTotal1 ? ' [total]' : ''}\n`;
  code += `link ${entity2} ${name} "${cardinality2}"${isTotal2 ? ' [total]' : ''}`;
  
  return code;
}

/**
 * Genera código para una especialización/generalización
 */
export function generateSpecializationCode({ type, superclass, subclasses }: SpecializationCodeProps): string {
  let code = `spec ${type} -> ${superclass}\n`;
  
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
export function generateUnionCode({ name, superclasses, category }: UnionCodeProps): string {
  let code = `union ${name}\n`;
  
  superclasses.forEach(superclass => {
    code += `link ${superclass} ${name}\n`;
  });
  
  code += `link ${name} ${category}`;
  
  return code;
}
