import { useState } from 'react';

/**
 * Estados de los modales de la aplicación
 */
export interface ModalState {
  // Modales informativos
  showHelp: boolean;
  showCredits: boolean;
  showAIPrompt: boolean;
  showClearConfirm: boolean;
  
  // Modal de propiedades (inserción visual)
  showPropertiesModal: boolean;
  elementType: string | null;
  
  // Propiedades de entidades/atributos/relaciones
  elementName: string;
  elementType2: string; // Para atributos: simple, key, derived, multivalued
  selectedEntity: string; // Para atributos
  selectedEntity1: string; // Para relaciones
  selectedEntity2: string; // Para relaciones
  cardinalityE1: string;
  cardinalityE2: string;
  customCard1: string;
  customCard2: string;
  totalE1: boolean;
  totalE2: boolean;
  
  // Propiedades de especialización
  specType: string; // 'd' o 'o'
  specSuperclass: string;
  specSubclasses: string[];
  
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
  const [showHelp, setShowHelp] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Modal de propiedades
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [elementType, setElementType] = useState<string | null>(null);
  
  // Propiedades del elemento actual
  const [elementName, setElementName] = useState('');
  const [elementType2, setElementType2] = useState('simple');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedEntity1, setSelectedEntity1] = useState('');
  const [selectedEntity2, setSelectedEntity2] = useState('');
  const [cardinalityE1, setCardinalityE1] = useState('1');
  const [cardinalityE2, setCardinalityE2] = useState('N');
  const [customCard1, setCustomCard1] = useState('');
  const [customCard2, setCustomCard2] = useState('');
  const [totalE1, setTotalE1] = useState(false);
  const [totalE2, setTotalE2] = useState(false);
  
  // Especialización
  const [specType, setSpecType] = useState('d');
  const [specSuperclass, setSpecSuperclass] = useState('');
  const [specSubclasses, setSpecSubclasses] = useState<string[]>([]);
  
  // Unión
  const [unionName, setUnionName] = useState('');
  const [unionSuperclasses, setUnionSuperclasses] = useState<string[]>([]);
  const [unionCategory, setUnionCategory] = useState('');

  const resetPropertiesModal = () => {
    setElementName('');
    setElementType2('simple');
    setSelectedEntity('');
    setSelectedEntity1('');
    setSelectedEntity2('');
    setCardinalityE1('1');
    setCardinalityE2('N');
    setCustomCard1('');
    setCustomCard2('');
    setTotalE1(false);
    setTotalE2(false);
    setSpecType('d');
    setSpecSuperclass('');
    setSpecSubclasses([]);
    setUnionName('');
    setUnionSuperclasses([]);
    setUnionCategory('');
  };

  return {
    // Modales informativos
    showHelp,
    setShowHelp,
    showCredits,
    setShowCredits,
    showAIPrompt,
    setShowAIPrompt,
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
    selectedEntity,
    setSelectedEntity,
    selectedEntity1,
    setSelectedEntity1,
    selectedEntity2,
    setSelectedEntity2,
    cardinalityE1,
    setCardinalityE1,
    cardinalityE2,
    setCardinalityE2,
    customCard1,
    setCustomCard1,
    customCard2,
    setCustomCard2,
    totalE1,
    setTotalE1,
    totalE2,
    setTotalE2,
    
    // Especialización
    specType,
    setSpecType,
    specSuperclass,
    setSpecSuperclass,
    specSubclasses,
    setSpecSubclasses,
    
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
