import { useState } from 'react';

/** Participante de una relación tal como lo edita el formulario (cardinalidad aún sin resolver). */
export interface ParticipantDraft {
  entity: string;
  /** '1' | 'N' | 'M' | 'custom' */
  cardinality: string;
  customCardinality: string;
  isTotal: boolean;
  role: string;
}

export const newParticipant = (cardinality = 'N'): ParticipantDraft => ({
  entity: '',
  cardinality,
  customCardinality: '',
  isTotal: false,
  role: '',
});

const defaultParticipants = (): ParticipantDraft[] => [newParticipant('1'), newParticipant('N')];

/**
 * Estados de los modales de la aplicación
 */
export interface ModalState {
  // Confirmación de borrado total
  showClearConfirm: boolean;

  // Modal de propiedades (inserción visual)
  showPropertiesModal: boolean;
  elementType: string | null;

  // Propiedades de entidades/atributos/relaciones
  elementName: string;
  elementType2: string; // Para atributos: simple, key, partial_key, derived, multivalued
  attrIsUnique: boolean; // Clave alternativa (solo con elementType2 === 'key')
  selectedEntity: string; // Para atributos
  participants: ParticipantDraft[]; // Para relaciones de cualquier grado (mínimo dos)

  // Propiedades de especialización
  specType: string; // 'd' o 'o'
  specSuperclass: string;
  specSubclasses: string[];
  specDefiningAttribute: string; // Vacío = especialización definida por el usuario
  specIsTotal: boolean; // Participación total (doble línea); false = parcial

  // Edición de un nodo existente (null = creación de uno nuevo)
  editingNodeId: string | null;

  // Propiedades de unión
  unionName: string;
  unionSuperclasses: string[];
  unionCategory: string;
}

/**
 * Hook para manejar el estado de todos los modales
 */
export function useModalState() {
  // Modales informativos
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Modal de propiedades
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [elementType, setElementType] = useState<string | null>(null);

  // Propiedades del elemento actual
  const [elementName, setElementName] = useState('');
  const [elementType2, setElementType2] = useState('simple');
  const [attrIsUnique, setAttrIsUnique] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [participants, setParticipants] = useState<ParticipantDraft[]>(defaultParticipants);

  // Especialización
  const [specType, setSpecType] = useState('d');
  const [specSuperclass, setSpecSuperclass] = useState('');
  const [specSubclasses, setSpecSubclasses] = useState<string[]>([]);
  const [specDefiningAttribute, setSpecDefiningAttribute] = useState('');
  const [specIsTotal, setSpecIsTotal] = useState(true);

  // Edición
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Unión
  const [unionName, setUnionName] = useState('');
  const [unionSuperclasses, setUnionSuperclasses] = useState<string[]>([]);
  const [unionCategory, setUnionCategory] = useState('');

  const resetPropertiesModal = () => {
    setElementName('');
    setElementType2('simple');
    setAttrIsUnique(false);
    setSelectedEntity('');
    setParticipants(defaultParticipants());
    setSpecType('d');
    setSpecSuperclass('');
    setSpecSubclasses([]);
    setSpecDefiningAttribute('');
    setSpecIsTotal(true);
    setEditingNodeId(null);
    setUnionName('');
    setUnionSuperclasses([]);
    setUnionCategory('');
  };

  return {
    // Modales informativos
    showClearConfirm,
    setShowClearConfirm,

    // Modal de propiedades
    showPropertiesModal,
    setShowPropertiesModal,
    elementType,
    setElementType,

    // Propiedades
    elementName,
    setElementName,
    elementType2,
    setElementType2,
    attrIsUnique,
    setAttrIsUnique,
    selectedEntity,
    setSelectedEntity,
    participants,
    setParticipants,

    // Especialización
    specType,
    setSpecType,
    specSuperclass,
    setSpecSuperclass,
    specSubclasses,
    setSpecSubclasses,
    specDefiningAttribute,
    setSpecDefiningAttribute,
    specIsTotal,
    setSpecIsTotal,

    // Edición
    editingNodeId,
    setEditingNodeId,

    // Unión
    unionName,
    setUnionName,
    unionSuperclasses,
    setUnionSuperclasses,
    unionCategory,
    setUnionCategory,

    // Utilidades
    resetPropertiesModal
  };
}
