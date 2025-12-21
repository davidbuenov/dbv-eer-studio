/**
 * EER Studio - Enhanced Entity-Relationship Diagram Editor
 * Copyright (c) 2025 David Bueno Vallejo
 * 
 * Developed with the assistance of Gemini and GitHub Copilot AI
 * 
 * This software is provided as-is, without warranty of any kind.
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
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
import { deleteNodeFromCode } from './utils/deleteNode';
import { useEERParser } from './hooks/useEERParser';
import { useFileOperations } from './hooks/useFileOperations';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useToolbar } from './hooks/useToolbar';
import { useModalState } from './hooks/useModalState';
import { ModalAIPrompt } from './components/ModalAIPrompt';
import { ModalCredits } from './components/ModalCredits';
import { ModalHelp } from './components/ModalHelp';
import { ModalClearConfirm } from './components/ModalClearConfirm';
import { ModalDeleteConfirm } from './components/ModalDeleteConfirm';
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
  
  // Estado de selección y eliminación
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estado del ancho del panel de código
  const [codePanelWidth, setCodePanelWidth] = useState(400);
  
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
    setScale,
    offset,
    setOffset,
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

  // Manejar tecla Delete para eliminar nodo seleccionado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && !showPropertiesModal) {
        setShowDeleteConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, showPropertiesModal]);

  // Memoizar handleCanvasClickInternal para evitar recrearla en cada render
  const handleCanvasClickInternal = useCallback((e: React.MouseEvent) => {
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
  }, [selectedTool, draggedNodeId, toolbarCanvasClick, setElementType, setElementName, setShowPropertiesModal, resetPropertiesModal, setElementType2, setSelectedEntity, setSpecType, setSpecSuperclass, setSpecSubclasses, setUnionName, setUnionSuperclasses, setUnionCategory]);

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
  const handleConfirmProperties = useCallback(() => {
    if (!elementType) return;

    let newLines = '';

    // Para entidades
    if (['entity', 'weak_entity'].includes(elementType)) {
      if (!elementName) return;
      
      newLines = generateEntityCode({
        name: elementName,
        x: clickX,
        y: clickY,
        isWeak: elementType === 'weak_entity'
      });
    }

    // Para atributos
    if (['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(elementType)) {
      if (!elementName || !selectedEntity) return;
      
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
      if (!elementName || !selectedEntity1 || !selectedEntity2) return;
      
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
      if (!specSuperclass || specSubclasses.length === 0) return;
      
      newLines = generateSpecializationCode({
        type: specType as 'd' | 'o',
        superclass: specSuperclass,
        subclasses: specSubclasses
      });
    }

    // Para uniones
    if (elementType === 'union') {
      if (!unionName || unionSuperclasses.length === 0 || !unionCategory) return;
      
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
  }, [elementType, elementName, selectedEntity1, selectedEntity2, cardinalityE1, cardinalityE2, customCard1, customCard2, totalE1, totalE2, elementType2, selectedEntity, specType, specSuperclass, specSubclasses, unionName, unionSuperclasses, unionCategory, code, setCode, resetTool, resetPropertiesModal, clickX, clickY, setShowPropertiesModal]);

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

  // Controles de zoom
  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(2, Math.round((s + 0.1) * 100) / 100));
  }, [setScale]);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(0.2, Math.round((s - 0.1) * 100) / 100));
  }, [setScale]);

  const handleResetZoom = useCallback(() => {
    setScale(0.8);
    setOffset({ x: 0, y: 0 });
  }, [setScale, setOffset]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    
    const nodeToDelete = nodes.find(n => n.id === selectedNodeId);
    if (!nodeToDelete) return;

    const newCode = deleteNodeFromCode(code, nodeToDelete.label);
    setCode(newCode);
    setSelectedNodeId(null);
  }, [selectedNodeId, nodes, code]);

  const handleFitToContent = useCallback(() => {
    if (!nodes || nodes.length === 0 || !svgRef.current) return;

    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));

    const contentWidth = maxX - minX + 200; // Add padding
    const contentHeight = maxY - minY + 200;

    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = svgRect.width / contentWidth;
    const scaleY = svgRect.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2); // Cap at 2x

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Center content in viewport
    setScale(newScale);
    setOffset({
      x: svgRect.width / 2 - centerX * newScale,
      y: svgRect.height / 2 - centerY * newScale
    });
  }, [nodes, svgRef, setScale, setOffset]);

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
        
        <div style={{ width: `${codePanelWidth}px`, flexShrink: 0 }}>
          <CodePanel 
            code={code}
            onCodeChange={setCode}
            onClear={() => setShowClearConfirm(true)}
          />
        </div>

        <div 
          className="w-1 bg-slate-300 hover:bg-indigo-500 cursor-col-resize transition-colors hover:shadow-md flex-shrink-0"
          style={{ userSelect: 'none' }}
          onMouseDown={(e) => {
            e.preventDefault();
            let isResizing = true;
            const startX = e.clientX;
            const startWidth = codePanelWidth;
            const container = (e.currentTarget.parentElement) as HTMLDivElement;
            const containerRect = container.getBoundingClientRect();

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const handleMouseMove = (moveEvent: MouseEvent) => {
              if (!isResizing) return;
              
              const delta = moveEvent.clientX - startX;
              const newWidth = Math.max(200, Math.min(startWidth + delta, containerRect.width - 300));
              setCodePanelWidth(newWidth);
            };

            const handleMouseUp = () => {
              isResizing = false;
              document.body.style.cursor = 'default';
              document.body.style.userSelect = 'auto';
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        <div className="flex-1 overflow-hidden h-full">
          <Canvas
            svgRef={svgRef}
            nodes={nodes}
            links={links}
            scale={scale}
            offset={offset}
            selectedTool={selectedTool}
            draggedNodeId={draggedNodeId}
            selectedNodeId={selectedNodeId}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClickInternal}
            onMouseDown={handleCanvasMouseDown}
            onNodeMouseDown={handleMouseDown}
            onNodeClick={(id) => setSelectedNodeId(id)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onFitToContent={handleFitToContent}
          />
        </div>
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
      
      <ModalDeleteConfirm 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteNode}
        node={nodes.find(n => n.id === selectedNodeId) || null}
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