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
  | 'multivalued_attribute' 
  | 'derived_attribute' 
  | 'specialization' 
  | 'union';

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
}

/**
 * Representación de un enlace entre nodos
 */
export interface LinkData {
  source: string;
  target: string;
  label?: string; // Cardinalidad o Rol
  style?: 'double' | 'solid'; // Para participación total
}

/**
 * Handle expuesto por el componente EERDiagramer
 */
export interface EERDiagramerHandle {
  getCode: () => string;
  setCode: (code: string) => void;
}
