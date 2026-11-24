/**
 * Tipos de nodos soportados en el diagrama EER
 */
export type NodeType = 
  | 'entity' 
  | 'weak_entity' 
  | 'relationship' 
  | 'identifying_relationship' 
  | 'attribute' 
  | 'key_attribute' 
  | 'partial_key_attribute'
  | 'multivalued_attribute' 
  | 'derived_attribute' 
  | 'specialization' 
  | 'union';

/**
 * Tipos de nodo que son atributos. Lista única: antes estaba copiada en cinco módulos y
 * añadir un tipo nuevo exigía acordarse de todos.
 */
export const ATTRIBUTE_NODE_TYPES: readonly NodeType[] = [
  'attribute',
  'key_attribute',
  'partial_key_attribute',
  'derived_attribute',
  'multivalued_attribute',
];

export function isAttributeType(type: string): boolean {
  return (ATTRIBUTE_NODE_TYPES as readonly string[]).includes(type);
}

/** Tipo de atributo tal como lo eligen los formularios y lo escriben los generadores de código. */
export type AttributeKind = 'simple' | 'key' | 'partial_key' | 'derived' | 'multivalued';

/**
 * Representación de un nodo en el diagrama
 */
export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  meta?: string; // Para 'd', 'o', 'u' en especializaciones/uniones
  lineIndex: number; // Índice de línea en el código fuente
  parentEntity?: string; // ID de la entidad padre para atributos
  definingAttribute?: string; // Atributo definidor de una especialización: `spec d -> SUPER [ATTR]`
  /** Especialización parcial (`spec d -> SUPER partial`): línea simple. Ausente = total, como en la v1.7.0. */
  isPartial?: boolean;
  /** Clave alternativa (`key_att Email -> CLIENTE unique`): UNIQUE NOT NULL en lugar de PK. */
  isUnique?: boolean;
}

/**
 * Representación de un enlace entre nodos
 */
export interface LinkData {
  source: string;
  target: string;
  label?: string; // Cardinalidad o Rol
  style?: 'double' | 'solid'; // Para participación total
  /** Rol del participante (`link EMPLEADO SUPERVISA "1" role:Supervisor`); da nombre a su FK. */
  role?: string;
  lineIndex?: number; // Línea del DSL que declara el enlace (para resaltarla o reescribirla)
}

/**
 * Handle expuesto por el componente EERDiagramer
 */
export interface EERDiagramerHandle {
  getCode: () => string;
  setCode: (code: string) => void;
}
