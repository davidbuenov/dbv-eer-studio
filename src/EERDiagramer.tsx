/**
 * EER Studio - Enhanced Entity-Relationship Diagram Editor
 * Copyright (c) 2025 David Bueno Vallejo
 * 
 * Developed with the assistance of Gemini and GitHub Copilot AI
 * 
 * This software is provided as-is, without warranty of any kind.
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { BookOpen, Code, Share2, HelpCircle, Info } from 'lucide-react';
import type { EERDiagramerHandle } from './types';
import { SAMPLE_CODE } from './constants';
import { 
  generateEntityCode, 
  generateAttributeCode, 
  generateRelationshipCode, 
  generateSpecializationCode, 
  generateUnionCode 
} from './utils/codeGenerator';
import { useEERParser } from './hooks/useEERParser';
import { useFileOperations } from './hooks/useFileOperations';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useToolbar } from './hooks/useToolbar';
import { useModalState } from './hooks/useModalState';
import { ModalAIPrompt } from './components/ModalAIPrompt';
import { ModalCredits } from './components/ModalCredits';
import { ModalHelp } from './components/ModalHelp';
import { ModalClearConfirm } from './components/ModalClearConfirm';
import { ModalProperties } from './components/ModalProperties';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { CodePanel } from './components/CodePanel';

function EERDiagrammer(_: unknown, ref: React.Ref<EERDiagramerHandle>) {
  // ==========================================
  // ESTADO DEL COMPONENTE
  // ==========================================
  
  // Estado del código
  const [code, setCode] = useState(SAMPLE_CODE);
  const codeRef = useRef(code);
  
  // Actualizar codeRef cuando cambia el código
  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  
  // Parser hook - parsea el código y genera nodos y enlaces
  const { nodes, links, setNodes } = useEERParser(code);
  
  // File operations hook - maneja open, save, save as
  const {
    showFileMenu,
    setShowFileMenu,
    handleOpenFile,
    handleSaveFile,
    handleSaveAsFile
  } = useFileOperations();
  
  // Canvas interaction hook - maneja drag & drop, zoom, pan
  const {
    draggedNodeId,
    scale,
    offset,
    svgRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasMouseDown
  } = useCanvasInteraction({ nodes, setNodes, code, setCode });
  
  // Toolbar hook - maneja el estado de la barra de herramientas
  const {
    selectedTool,
    setSelectedTool,
    clickX,
    clickY,
    handleCanvasClick: toolbarCanvasClick,
    resetTool
  } = useToolbar(svgRef, scale, offset, draggedNodeId);
  
  // Modal state hook - maneja todos los estados de modales
  const {
    showHelp,
    setShowHelp,
    showCredits,
    setShowCredits,
    showAIPrompt,
    setShowAIPrompt,
    showClearConfirm,
    setShowClearConfirm,
    showPropertiesModal,
    setShowPropertiesModal,
    elementType,
    setElementType,
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
    specType,
    setSpecType,
    specSuperclass,
    setSpecSuperclass,
    specSubclasses,
    setSpecSubclasses,
    unionName,
    setUnionName,
    unionSuperclasses,
    setUnionSuperclasses,
    unionCategory,
    setUnionCategory,
    resetPropertiesModal
  } = useModalState();

  useImperativeHandle(ref, () => ({
    getCode: () => codeRef.current,
    setCode: (c: string) => setCode(c),
  }));

  /**
   * Maneja clicks en el canvas cuando hay una herramienta seleccionada
   * 
   * @description
   * Flujo de inserción de elementos:
   * 1. Convierte coordenadas de pantalla a coordenadas del canvas (considerando zoom/pan)
   * 2. Guarda las coordenadas para uso posterior
   * 3. Prepara los estados iniciales según el tipo de herramienta
   * 4. Abre el modal apropiado para configurar propiedades
   * 
   * Cada tipo de elemento tiene su propio flujo de configuración.
   */
  const handleCanvasClickInternal = (e: React.MouseEvent) => {
    if (!selectedTool || draggedNodeId) return;
    
    // Usar el hook para obtener coordenadas
    const coords = toolbarCanvasClick(e);
    if (!coords) return;

    const timestamp = Date.now() % 1000;

    // Para entidades, mostrar modal para pedir nombre
    if (['entity', 'weak_entity'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(selectedTool === 'entity' ? `ENTIDAD_${timestamp}` : `ENTIDAD_DEBIL_${timestamp}`);
      setShowPropertiesModal(true);
      return;
    }

    // Para relaciones, mostrar modal para configurar entidades y cardinalidades
    if (['relationship', 'ident_rel'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(selectedTool === 'relationship' ? `RELACION_${timestamp}` : `RELACION_IDENT_${timestamp}`);
      resetPropertiesModal();
      setShowPropertiesModal(true);
      return;
    }

    // Para atributos, mostrar modal
    if (['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(`Atributo_${timestamp}`);
      setElementType2(selectedTool === 'key_attr' ? 'key' : selectedTool === 'derived_attr' ? 'derived' : selectedTool === 'multivalued_attr' ? 'multivalued' : 'simple');
      setSelectedEntity('');
      setShowPropertiesModal(true);
      return;
    }

    // Para especializaciones
    if (selectedTool === 'specialization') {
      setElementType('specialization');
      setSpecType('d');
      setSpecSuperclass('');
      setSpecSubclasses([]);
      setShowPropertiesModal(true);
      return;
    }

    // Para uniones
    if (selectedTool === 'union') {
      setElementType('union');
      setUnionName('u');
      setUnionSuperclasses([]);
      setUnionCategory('');
      setShowPropertiesModal(true);
      return;
    }
  };

  /**
   * Genera código DSL a partir de las propiedades configuradas en el modal
   * 
   * @description
   * Función de generación de código que convierte la configuración visual en texto DSL:
   * 
   * - Entidades: `ent NOMBRE (x, y)` o `weak_ent NOMBRE (x, y)`
   * - Atributos: `att NOMBRE -> ENTIDAD (x, y)` con prefijos según tipo
   * - Relaciones: `rel NOMBRE (x, y)` + múltiples `link` para cardinalidades
   * - Especializaciones: `spec tipo -> SUPERCLASE` + `link tipo SUBCLASE`
   * - Uniones: `union nombre` + múltiples `link` para superclases y categoría
   * 
   * Valida que todos los campos requeridos estén completos antes de generar.
   */
  const handleConfirmProperties = () => {
    if (!elementType) return;

    let newLines = '';

    // Para entidades
    if (['entity', 'weak_entity'].includes(elementType)) {
      if (!elementName) {
        alert('Por favor, introduce el nombre de la entidad');
        return;
      }
      newLines = generateEntityCode({
        name: elementName,
        x: clickX,
        y: clickY,
        isWeak: elementType === 'weak_entity'
      });
    }

    // Para atributos
    if (['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(elementType)) {
      if (!elementName || !selectedEntity) {
        alert('Por favor, completa el nombre y selecciona una entidad');
        return;
      }
      newLines = generateAttributeCode({
        name: elementName,
        entity: selectedEntity,
        x: clickX,
        y: clickY,
        type: elementType2 as 'simple' | 'key' | 'derived' | 'multivalued'
      });
    }

    // Para relaciones
    if (['relationship', 'ident_rel'].includes(elementType)) {
      if (!elementName || !selectedEntity1 || !selectedEntity2) {
        alert('Por favor, completa el nombre y selecciona ambas entidades');
        return;
      }
      
      const card1 = cardinalityE1 === 'custom' ? customCard1 : cardinalityE1;
      const card2 = cardinalityE2 === 'custom' ? customCard2 : cardinalityE2;
      
      newLines = generateRelationshipCode({
        name: elementName,
        x: clickX,
        y: clickY,
        isIdentifying: elementType === 'ident_rel',
        entity1: selectedEntity1,
        entity2: selectedEntity2,
        cardinality1: card1,
        cardinality2: card2,
        isTotal1: totalE1,
        isTotal2: totalE2
      });
    }

    // Para especializaciones
    if (elementType === 'specialization') {
      if (!specSuperclass || specSubclasses.length === 0) {
        alert('Por favor, selecciona una superclase y al menos una subclase');
        return;
      }
      
      newLines = generateSpecializationCode({
        type: specType as 'd' | 'o',
        superclass: specSuperclass,
        subclasses: specSubclasses
      });
    }

    // Para uniones
    if (elementType === 'union') {
      if (!unionName || unionSuperclasses.length === 0 || !unionCategory) {
        alert('Por favor, completa el nombre de la unión, selecciona superclases y una categoría');
        return;
      }
      
      newLines = generateUnionCode({
        name: unionName,
        superclasses: unionSuperclasses,
        category: unionCategory
      });
    }

    if (newLines) {
      const newCode = code + '\n' + newLines;
      setCode(newCode);
    }

    setShowPropertiesModal(false);
    resetTool();
    resetPropertiesModal();
  };

  const handleExport = () => {
    if (svgRef.current) {
      const data = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'eer-diagram.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // File menu actions (Open, Save, Save As) - Ahora manejadas por useFileOperations hook

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm z-30">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">EER Studio</h1>
          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Edición Bidireccional</span>
          <div className="relative ml-4" onMouseDown={e => e.stopPropagation()}>
            <button onClick={() => setShowFileMenu(s => !s)} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200">File</button>
            {showFileMenu && (
              <div className="absolute left-0 mt-1 w-40 rounded-md border border-slate-200 bg-white shadow-lg z-40">
                <button onClick={() => handleOpenFile(setCode)} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100">Open</button>
                <button onClick={() => handleSaveFile(codeRef.current)} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100">Save</button>
                <button onClick={() => handleSaveAsFile(codeRef.current)} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100">Save as</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <HelpCircle className="h-4 w-4" /> Sintaxis
          </button>
          <button onClick={() => setShowAIPrompt(true)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <Code className="h-4 w-4" /> Prompt para tu IA
          </button>
          <button onClick={() => setShowCredits(true)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <Info className="h-4 w-4" /> Créditos
          </button>
          <button onClick={handleExport} className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors">
            <Share2 className="h-4 w-4" /> Exportar SVG
          </button>
        </div>
      </header>

      <Toolbar selectedTool={selectedTool} onToolSelect={setSelectedTool} />

      <div className="flex flex-1 overflow-hidden">
        
        <CodePanel 
          code={code}
          onCodeChange={setCode}
          onClear={() => setShowClearConfirm(true)}
          showClearConfirm={showClearConfirm}
        />

        <Canvas
          svgRef={svgRef}
          nodes={nodes}
          links={links}
          scale={scale}
          offset={offset}
          selectedTool={selectedTool}
          draggedNodeId={draggedNodeId}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClickInternal}
          onMouseDown={handleCanvasMouseDown}
          onNodeMouseDown={handleMouseDown}
        />
      </div>

      {/* Modales */}
      <ModalAIPrompt 
        isOpen={showAIPrompt} 
        onClose={() => setShowAIPrompt(false)} 
      />
      
      <ModalCredits 
        isOpen={showCredits} 
        onClose={() => setShowCredits(false)} 
      />
      
      <ModalHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      
      <ModalClearConfirm 
        isOpen={showClearConfirm} 
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => setCode('')}
      />
      
      <ModalProperties
        isOpen={showPropertiesModal}
        onClose={() => setShowPropertiesModal(false)}
        nodes={nodes}
        modalState={{
          elementType,
          elementName,
          elementType2,
          selectedEntity,
          selectedEntity1,
          selectedEntity2,
          cardinalityE1,
          cardinalityE2,
          customCard1,
          customCard2,
          totalE1,
          totalE2,
          specType,
          specSuperclass,
          specSubclasses,
          unionName,
          unionSuperclasses,
          unionCategory,
          showHelp: false,
          showCredits: false,
          showAIPrompt: false,
          showClearConfirm: false,
          showPropertiesModal: false
        }}
        setters={{
          setElementName,
          setElementType2,
          setSelectedEntity,
          setSelectedEntity1,
          setSelectedEntity2,
          setCardinalityE1,
          setCardinalityE2,
          setCustomCard1,
          setCustomCard2,
          setTotalE1,
          setTotalE2,
          setSpecType,
          setSpecSuperclass,
          setSpecSubclasses,
          setUnionName,
          setUnionSuperclasses,
          setUnionCategory
        }}
        onConfirm={handleConfirmProperties}
      />
    </div>
  );
}

const EERDiagrammerWithRef = forwardRef(EERDiagrammer);
export default EERDiagrammerWithRef;