// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useCallback, useRef, useState } from 'react';
import type { NodeData, LinkData } from '../types';
import type { ParticipantDraft, useModalState } from './useModalState';
import {
  applyElementEdit,
  describeNodeForEdit,
  generateElementCode,
  toDslIdentifier,
  type AttributeKind,
  type ElementEdit,
} from '../utils/dslEditing';
import { findFreePosition, ATTRIBUTE_STEP_X, type Point } from '../utils/layout';

type ModalStateApi = ReturnType<typeof useModalState>;

interface UsePropertiesFormProps {
  modal: ModalStateApi;
  nodes: NodeData[];
  links: LinkData[];
  code: string;
  setCode: (code: string) => void;
  /** El DSL compila: condición para editar (los lineIndex solo son fiables en código válido). */
  isValid: boolean;
  clickX: number;
  clickY: number;
  setClickPosition: (point: Point) => void;
  resetTool: () => void;
  /** Tras guardar una edición: los ids pueden cambiar (renombrado), así que se vacía la selección. */
  onEdited: () => void;
  /**
   * Etiqueta del elemento seleccionado que puede tener atributos (entidad, relación o atributo,
   * este último para crear un componente de un compuesto). Si existe, un atributo nuevo nace
   * con ese propietario ya elegido en «Pertenece a».
   */
  contextOwner?: string;
}

const ENTITY_TOOLS = ['entity', 'weak_entity'];
const RELATIONSHIP_TOOLS = ['relationship', 'ident_rel'];
const ATTRIBUTE_TOOLS = ['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'];
const STANDARD_CARDINALITIES = ['1', 'N', 'M'];

const ATTRIBUTE_KIND_BY_TOOL: Record<string, AttributeKind> = {
  attribute: 'simple',
  key_attr: 'key',
  derived_attr: 'derived',
  multivalued_attr: 'multivalued',
};

const newAttributeName = () => `Atributo_${Date.now() % 1000}`;

/** Cardinalidad del DSL → pareja (opción del desplegable, texto personalizado). */
function toFormCardinality(cardinality: string): { option: string; custom: string } {
  const upper = cardinality.toUpperCase();
  return STANDARD_CARDINALITIES.includes(upper) ? { option: upper, custom: '' } : { option: 'custom', custom: cardinality };
}

/** Participante del formulario → extremo del DSL (cardinalidad resuelta, rol normalizado). */
function toRelationshipEnd(p: ParticipantDraft) {
  // El compilador exige que un rol empiece por letra o `_` (`role:2` sería un error bloqueante).
  const identifier = toDslIdentifier(p.role);
  const role = /^\p{N}/u.test(identifier) ? `_${identifier}` : identifier;
  return {
    entity: p.entity,
    cardinality: p.cardinality === 'custom' ? p.customCardinality : p.cardinality,
    isTotal: p.isTotal,
    ...(role ? { role } : {}),
  };
}

/**
 * Orquesta el formulario de propiedades: abrirlo para crear (desde la toolbar) o editar (doble
 * clic / F2), traducir su estado a un `ElementEdit` y escribir el resultado en el DSL.
 */
export function usePropertiesForm({
  modal,
  nodes,
  links,
  code,
  setCode,
  isValid,
  clickX,
  clickY,
  setClickPosition,
  resetTool,
  onEdited,
  contextOwner,
}: UsePropertiesFormProps) {
  // Posiciones de atributos ya añadidos con "crear otro" que aún no han llegado a `nodes`
  // (el parser va con debounce): sin ellas el siguiente caería encima del anterior.
  const pendingPositionsRef = useRef<Point[]>([]);
  // Cambiarla remonta el formulario para devolver el foco al nombre tras "crear otro".
  const [formKey, setFormKey] = useState(0);

  const openCreate = useCallback((tool: string, click: Point) => {
    const suffix = Date.now() % 1000;
    modal.resetPropertiesModal();
    modal.setElementType(tool);

    if (ENTITY_TOOLS.includes(tool)) {
      modal.setElementName(tool === 'entity' ? `ENTIDAD_${suffix}` : `ENTIDAD_DEBIL_${suffix}`);
    } else if (RELATIONSHIP_TOOLS.includes(tool)) {
      modal.setElementName(tool === 'relationship' ? `RELACION_${suffix}` : `RELACION_IDENT_${suffix}`);
    } else if (ATTRIBUTE_TOOLS.includes(tool)) {
      modal.setElementName(newAttributeName());
      modal.setElementType2(ATTRIBUTE_KIND_BY_TOOL[tool] ?? 'simple');
      modal.setSelectedEntity(contextOwner ?? '');
      pendingPositionsRef.current = [];
      setClickPosition(findFreePosition(click, nodes));
    } else if (tool === 'union') {
      modal.setUnionName('u');
    }

    modal.setShowPropertiesModal(true);
  }, [modal, nodes, setClickPosition, contextOwner]);

  const openEdit = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const element = describeNodeForEdit(node, nodes, links);

    modal.resetPropertiesModal();
    modal.setEditingNodeId(node.id);

    if (element.kind === 'entity') {
      modal.setElementType(element.isWeak ? 'weak_entity' : 'entity');
      modal.setElementName(element.name);
    } else if (element.kind === 'attribute') {
      modal.setElementType('attribute');
      modal.setElementName(element.name);
      modal.setElementType2(element.attrType);
      modal.setAttrIsUnique(element.isUnique ?? false);
      modal.setSelectedEntity(element.owner);
    } else if (element.kind === 'relationship') {
      modal.setElementType(element.isIdentifying ? 'ident_rel' : 'relationship');
      modal.setElementName(element.name);
      if (element.ends.length > 0) {
        modal.setParticipants(
          element.ends.map(end => {
            const card = toFormCardinality(end.cardinality);
            return {
              entity: end.entity,
              cardinality: card.option,
              customCardinality: card.custom,
              isTotal: end.isTotal,
              role: end.role ?? '',
            };
          })
        );
      }
    } else if (element.kind === 'specialization') {
      modal.setElementType('specialization');
      modal.setSpecType(element.specType);
      modal.setSpecSuperclass(element.superclass);
      modal.setSpecSubclasses(element.subclasses);
      modal.setSpecDefiningAttribute(element.definingAttribute);
      modal.setSpecIsTotal(element.isTotal);
    } else {
      modal.setElementType('union');
      modal.setUnionName(element.name);
      modal.setUnionSuperclasses(element.superclasses);
      modal.setUnionCategory(element.category);
    }

    modal.setShowPropertiesModal(true);
  }, [modal, nodes, links]);

  /** Estado del formulario → elemento del DSL, o `null` si falta algún dato obligatorio. */
  const buildFormElement = useCallback((): ElementEdit | null => {
    const type = modal.elementType ?? '';
    const name = toDslIdentifier(modal.elementName);
    const attrType = modal.elementType2 as AttributeKind;
    // Participantes con entidad elegida; una relación necesita al menos dos (§3.11 I).
    const ends = modal.participants.filter(p => p.entity).map(toRelationshipEnd);
    // Al editar una relación que ya tenía menos de dos participantes (DSL escrito a mano), se
    // puede guardar sin completarla (renombrarla, p. ej.), pero no quitarle los que tenía.
    const editingNode = modal.editingNodeId ? nodes.find(n => n.id === modal.editingNodeId) : undefined;
    const original = editingNode ? describeNodeForEdit(editingNode, nodes, links) : undefined;
    const originalEnds = original?.kind === 'relationship' ? original.ends.length : 2;
    const minEnds = Math.min(2, originalEnds);
    let element: ElementEdit | null = null;

    if (ENTITY_TOOLS.includes(type) && name) {
      element = { kind: 'entity', name, isWeak: type === 'weak_entity' };
    } else if (ATTRIBUTE_TOOLS.includes(type) && name && modal.selectedEntity) {
      element = {
        kind: 'attribute',
        name,
        attrType,
        owner: modal.selectedEntity,
        isUnique: attrType === 'key' && modal.attrIsUnique,
      };
    } else if (RELATIONSHIP_TOOLS.includes(type) && name && ends.length >= minEnds) {
      element = { kind: 'relationship', name, isIdentifying: type === 'ident_rel', ends };
    } else if (type === 'specialization' && modal.specSuperclass && modal.specSubclasses.length > 0) {
      element = {
        kind: 'specialization',
        specType: modal.specType === 'o' ? 'o' : 'd',
        superclass: modal.specSuperclass,
        subclasses: modal.specSubclasses,
        definingAttribute: toDslIdentifier(modal.specDefiningAttribute),
        isTotal: modal.specIsTotal,
      };
    } else if (type === 'union' && modal.unionName && modal.unionSuperclasses.length > 0 && modal.unionCategory) {
      element = {
        kind: 'union',
        name: toDslIdentifier(modal.unionName),
        superclasses: modal.unionSuperclasses,
        category: modal.unionCategory,
      };
    }

    return element;
  }, [modal, nodes, links]);

  const confirm = useCallback(() => {
    const element = buildFormElement();
    const editingNode = modal.editingNodeId ? nodes.find(n => n.id === modal.editingNodeId) : undefined;
    if (!element || (modal.editingNodeId && (!editingNode || !isValid))) return;

    if (editingNode) {
      setCode(applyElementEdit(code, editingNode, nodes, links, element));
      onEdited();
    } else {
      setCode(`${code}\n${generateElementCode(element, clickX, clickY)}`);
    }

    modal.setShowPropertiesModal(false);
    resetTool();
    modal.resetPropertiesModal();
  }, [buildFormElement, modal, nodes, links, code, setCode, isValid, clickX, clickY, resetTool, onEdited]);

  const confirmAndContinue = useCallback(() => {
    const element = buildFormElement();
    if (element?.kind !== 'attribute') return;

    setCode(`${code}\n${generateElementCode(element, clickX, clickY)}`);
    pendingPositionsRef.current = [...pendingPositionsRef.current, { x: clickX, y: clickY }];
    setClickPosition(
      findFreePosition({ x: clickX + ATTRIBUTE_STEP_X, y: clickY }, [...nodes, ...pendingPositionsRef.current])
    );
    modal.setElementName(newAttributeName());
    setFormKey(k => k + 1);
  }, [buildFormElement, code, setCode, clickX, clickY, setClickPosition, nodes, modal]);

  return {
    openCreate,
    openEdit,
    confirm,
    confirmAndContinue,
    formKey,
    isEditBlocked: modal.editingNodeId !== null && !isValid,
  };
}
