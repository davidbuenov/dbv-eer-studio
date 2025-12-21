/**
 * EER Studio - Enhanced Entity-Relationship Diagram Editor
 * Copyright (c) 2025 David Bueno Vallejo
 * 
 * Developed with the assistance of Gemini and GitHub Copilot AI
 * 
 * This software is provided as-is, without warranty of any kind.
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { BookOpen, Code, Share2, HelpCircle, Info, Square, SquareDashed, Diamond, Zap, Circle, Trash2, GitBranch, Layers } from 'lucide-react';
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

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">Insertar:</span>
        <button
          onClick={() => setSelectedTool(selectedTool === 'entity' ? null : 'entity')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'entity'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Entidad fuerte (click en canvas)"
        >
          <Square className="h-4 w-4" /> Entidad
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'weak_entity' ? null : 'weak_entity')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'weak_entity'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Entidad débil (click en canvas)"
        >
          <SquareDashed className="h-4 w-4" /> Entidad Débil
        </button>
        <div className="w-px bg-slate-200 mx-1 h-6"></div>
        <button
          onClick={() => setSelectedTool(selectedTool === 'relationship' ? null : 'relationship')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'relationship'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Relación fuerte (click en canvas)"
        >
          <Diamond className="h-4 w-4" /> Relación
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'ident_rel' ? null : 'ident_rel')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'ident_rel'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Relación identificativa (click en canvas)"
        >
          <Zap className="h-4 w-4" /> Rel. Identif.
        </button>
        <div className="w-px bg-slate-200 mx-1 h-6"></div>
        <button
          onClick={() => setSelectedTool(selectedTool === 'attribute' ? null : 'attribute')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'attribute'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Atributo simple (click en canvas)"
        >
          <Circle className="h-4 w-4" /> Atributo
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'key_attr' ? null : 'key_attr')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'key_attr'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Atributo clave (click en canvas)"
        >
          <Zap className="h-4 w-4" /> Atrib. Clave
        </button>
        <div className="w-px bg-slate-200 mx-1 h-6"></div>
        <button
          onClick={() => setSelectedTool(selectedTool === 'specialization' ? null : 'specialization')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'specialization'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Especialización/Generalización"
        >
          <GitBranch className="h-4 w-4" /> Especialización
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'union' ? null : 'union')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'union'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Unión/Categoría"
        >
          <Layers className="h-4 w-4" /> Unión
        </button>
        {selectedTool && (
          <div className="ml-auto text-xs text-indigo-600 font-medium">
            Herramienta activa: {selectedTool === 'entity' ? 'Entidad' : selectedTool === 'weak_entity' ? 'Entidad Débil' : selectedTool === 'relationship' ? 'Relación' : selectedTool === 'ident_rel' ? 'Rel. Identificativa' : selectedTool === 'attribute' ? 'Atributo' : selectedTool === 'key_attr' ? 'Atrib. Clave' : selectedTool === 'specialization' ? 'Especialización' : 'Unión'} - Click en canvas
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        <div className="flex w-1/3 min-w-[300px] flex-col border-r border-slate-200 bg-white shadow-lg z-20">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 bg-slate-50">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Code className="h-3 w-3" /> Definición
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!code.trim()) {
                    setCode('');
                  } else {
                    setShowClearConfirm(true);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Limpiar todo el código"
              >
                <Trash2 className="h-3 w-3" /> Limpiar
              </button>
              <div className="text-[10px] text-slate-400">Las coordenadas se actualizan al mover nodos</div>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 resize-none bg-slate-50 p-4 font-mono text-xs md:text-sm leading-relaxed text-slate-700 focus:outline-none selection:bg-indigo-100"
            spellCheck={false}
          />
        </div>

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