// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { BookOpen, Code, Share2, HelpCircle, Info, Database, Layers, FileText, Pin, PinOff } from 'lucide-react';
import type { EERDiagramerHandle } from './types';
import { runningInTauri } from './utils/platform';
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
import { ResizableDivider } from './components/ResizableDivider';
import { eerToRelational } from './utils/relational/eerToRelational';
import { exportRelationalToSVG } from './utils/relational/exportRelationalSVG';
import { generateRelationalDSL } from './utils/relational/relationalCodeGenerator';
import { parseRelationalDSL } from './utils/relational/relationalParser';
import { RelationalViewer } from './components/relational/RelationalViewer';
import { StepInspectorModal } from './components/relational/StepInspectorModal';
import { SQLPreviewModal } from './components/sql/SQLPreviewModal';
import type { RelationalTable, RelationalSchema } from './types/relational';
import { useLanguage } from './i18n/language';
import { downloadTextFile } from './utils/download';

type ActiveViewTab = 'eer' | 'relational' | 'sql';

const SVG_MIME = 'image/svg+xml;charset=utf-8';

/**
 * Componente principal del editor de diagramas EER
 * 
 * Gestiona el estado global de la aplicación:
 * - Código DSL del diagrama
 * - Nodos y enlaces (parseados del código)
 * - Herramienta seleccionada en la toolbar
 * - Modales de propiedades y ayuda
 * - Transformaciones del canvas (zoom, pan)
 * 
 * Expone métodos imperativos vía ref para control externo (desktop mode).
 */
function EERDiagrammer(_: unknown, ref: React.Ref<EERDiagramerHandle>) {
  const { t, lang, setLang } = useLanguage();

  // ==========================================
  // ESTADO DEL COMPONENTE Y PESTAÑAS
  // ==========================================
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('eer');
  
  // Estado del código EER DSL
  const [code, setCode] = useState(SAMPLE_CODE);
  const codeRef = useRef(code);

  // Estado del código Relacional DSL y Coordenadas Relacionales Persistidas
  const [relationalCode, setRelationalCode] = useState('');
  const [relationalPositions, setRelationalPositions] = useState<Record<string, { x: number; y: number }>>({});
  
  // Estado del esquema relacional y modales educativos
  const [relationalSchema, setRelationalSchema] = useState<RelationalSchema>({ tables: [], config: { inheritanceOptions: {}, oneToOneOptions: {} } });
  const [showStepInspector, setShowStepInspector] = useState(false);
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [inspectedTable, setInspectedTable] = useState<RelationalTable | null>(null);
  
  // Estado de selección y eliminación
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estado del ancho del panel de código
  const [codePanelWidth, setCodePanelWidth] = useState(400);
  
  // Actualizar codeRef cuando cambia el código EER
  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  
  // Parser hook - compila el código EER y genera nodos y enlaces con tolerancia a fallos
  const { nodes, links, setNodes, diagnostics, isValid } = useEERParser(code);

  const elementCount = useMemo(() => ({
    entities: nodes.filter(n => n.type === 'entity' || n.type === 'weak_entity').length,
    relations: nodes.filter(n => n.type === 'relationship' || n.type === 'identifying_relationship').length,
  }), [nodes]);

  // Ref para controlar la regeneración reactiva solo cuando cambia el diagrama EER
  const lastEERCodeRef = useRef<string>('');

  // Actualización reactiva del Esquema Relacional solo cuando cambia el diagrama EER y el código es válido
  useEffect(() => {
    if (isValid && nodes.length > 0 && code !== lastEERCodeRef.current) {
      lastEERCodeRef.current = code;
      try {
        const derived = eerToRelational(nodes, links, undefined, relationalPositions);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRelationalSchema(derived);
        setRelationalCode(generateRelationalDSL(derived));
      } catch (err) {
        console.error('[EERDiagramer] Error al convertir EER a Relacional:', err);
      }
    }
  }, [code, nodes, links, relationalPositions, isValid]);
  
  // File operations hook
  const {
    showFileMenu,
    setShowFileMenu,
    handleOpenFile,
    handleSaveFile,
    handleSaveAsFile
  } = useFileOperations();

  // Serializa el proyecto completo (EER + Coordenadas Relacionales) para guardar en archivo .eer
  const getSaveContent = useCallback(() => {
    let fullText = codeRef.current.trim();
    const posKeys = Object.keys(relationalPositions);
    if (posKeys.length > 0) {
      fullText += '\n\n// ==========================================\n// RELATIONAL LAYOUT\n// ==========================================\n';
      posKeys.forEach(tableName => {
        const pos = relationalPositions[tableName];
        if (pos) {
          fullText += `relational ${tableName} (${pos.x}, ${pos.y})\n`;
        }
      });
    }
    return fullText;
  }, [relationalPositions]);

  // Carga un archivo deserializando EER y Coordenadas Relacionales guardadas
  const handleLoadFileContent = useCallback((text: string) => {
    const lines = text.split('\n');
    const eerLines: string[] = [];
    const newPositions: Record<string, { x: number; y: number }> = {};

    lines.forEach(line => {
      const relMatch = line.match(/^relational\s+([A-Za-z0-9_]+)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (relMatch && relMatch[1] && relMatch[2] && relMatch[3]) {
        newPositions[relMatch[1]] = {
          x: parseInt(relMatch[2], 10),
          y: parseInt(relMatch[3], 10)
        };
      } else {
        eerLines.push(line);
      }
    });

    setRelationalPositions(newPositions);
    setCode(eerLines.join('\n').trim());
  }, [setCode]);
  
  // Canvas interaction hook
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
  
  // Toolbar hook
  const {
    selectedTool,
    setSelectedTool,
    clickX,
    clickY,
    handleCanvasClick: toolbarCanvasClick,
    resetTool
  } = useToolbar(svgRef, scale, offset, draggedNodeId);

  // Manejador del arrastre de posicionamiento de tablas en el Canvas Relacional
  const handleRelationalTableMove = useCallback((tableId: string, newX: number, newY: number) => {
    setRelationalSchema(prev => {
      const targetTable = prev.tables.find(t => t.id === tableId);
      if (targetTable) {
        setRelationalPositions(pos => ({
          ...pos,
          [targetTable.name]: { x: newX, y: newY }
        }));
      }
      const updatedTables = prev.tables.map(t => (t.id === tableId ? { ...t, x: newX, y: newY } : t));
      const newSchema = { ...prev, tables: updatedTables };
      setRelationalCode(generateRelationalDSL(newSchema));
      return newSchema;
    });
  }, []);

  // Manejador de la edición directa del código DSL Relacional por el usuario
  const handleRelationalCodeChange = useCallback((newDSL: string) => {
    setRelationalCode(newDSL);
    const parsed = parseRelationalDSL(newDSL);
    setRelationalSchema(parsed);
    const newPositions: Record<string, { x: number; y: number }> = {};
    parsed.tables.forEach(t => {
      newPositions[t.name] = { x: t.x, y: t.y };
    });
    setRelationalPositions(newPositions);
  }, []);

  // Modal state hook
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

  // Puente entre el menú nativo de macOS (Abrir/Guardar/Guardar como, ver
  // src-tauri/src/lib.rs `macos_menu`) y el mismo flujo que ya usan los
  // botones del menú "File" propio de la app — sin lógica nueva.
  // Se suscribe una sola vez (no en cada tecleo) y llama siempre a la última
  // versión de los handlers vía ref, para no guardar contenido obsoleto.
  const menuHandlersRef = useRef({ handleOpenFile, handleSaveFile, handleSaveAsFile, handleLoadFileContent, getSaveContent });
  useEffect(() => {
    menuHandlersRef.current = { handleOpenFile, handleSaveFile, handleSaveAsFile, handleLoadFileContent, getSaveContent };
  });

  useEffect(() => {
    if (!runningInTauri) return;
    let unlistenFns: (() => void)[] = [];
    import('@tauri-apps/api/event').then(({ listen }) => {
      Promise.all([
        listen('menu-open-file', () => {
          const h = menuHandlersRef.current;
          h.handleOpenFile(h.handleLoadFileContent);
        }),
        listen('menu-save', () => {
          const h = menuHandlersRef.current;
          h.handleSaveFile(h.getSaveContent());
        }),
        listen('menu-save-as', () => {
          const h = menuHandlersRef.current;
          h.handleSaveAsFile(h.getSaveContent());
        }),
      ]).then(unlisteners => {
        unlistenFns = unlisteners;
      });
    });
    return () => unlistenFns.forEach(fn => fn());
  }, []);

  // Chincheta "Fijar ventana encima" (Always on Top) — API multiplataforma de
  // Tauri, sin código condicional por SO. Por ventana, sin persistir.
  const [isPinned, setIsPinned] = useState(false);
  const handleToggleAlwaysOnTop = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();
    const next = !(await win.isAlwaysOnTop());
    await win.setAlwaysOnTop(next);
    setIsPinned(next);
  }, []);

  const handleCanvasClickInternal = useCallback((e: React.MouseEvent) => {
    if (!selectedTool || draggedNodeId) return;
    const coords = toolbarCanvasClick(e);
    if (!coords) return;

    const timestamp = Date.now() % 1000;

    if (['entity', 'weak_entity'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(selectedTool === 'entity' ? `ENTIDAD_${timestamp}` : `ENTIDAD_DEBIL_${timestamp}`);
      setShowPropertiesModal(true);
      return;
    }

    if (['relationship', 'ident_rel'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(selectedTool === 'relationship' ? `RELACION_${timestamp}` : `RELACION_IDENT_${timestamp}`);
      resetPropertiesModal();
      setShowPropertiesModal(true);
      return;
    }

    if (['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(`Atributo_${timestamp}`);
      setElementType2(selectedTool === 'key_attr' ? 'key' : selectedTool === 'derived_attr' ? 'derived' : selectedTool === 'multivalued_attr' ? 'multivalued' : 'simple');
      setSelectedEntity('');
      setShowPropertiesModal(true);
      return;
    }

    if (selectedTool === 'specialization') {
      setElementType('specialization');
      setSpecType('d');
      setSpecSuperclass('');
      setSpecSubclasses([]);
      setShowPropertiesModal(true);
      return;
    }

    if (selectedTool === 'union') {
      setElementType('union');
      setUnionName('u');
      setUnionSuperclasses([]);
      setUnionCategory('');
      setShowPropertiesModal(true);
      return;
    }
  }, [selectedTool, draggedNodeId, toolbarCanvasClick, setElementType, setElementName, setShowPropertiesModal, resetPropertiesModal, setElementType2, setSelectedEntity, setSpecType, setSpecSuperclass, setSpecSubclasses, setUnionName, setUnionSuperclasses, setUnionCategory]);

  const handleConfirmProperties = useCallback(() => {
    if (!elementType) return;

    let newLines = '';

    if (['entity', 'weak_entity'].includes(elementType)) {
      if (!elementName) return;
      newLines = generateEntityCode({
        name: elementName,
        x: clickX,
        y: clickY,
        isWeak: elementType === 'weak_entity'
      });
    }

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

    if (elementType === 'specialization') {
      if (!specSuperclass || specSubclasses.length === 0) return;
      newLines = generateSpecializationCode({
        type: specType as 'd' | 'o',
        superclass: specSuperclass,
        subclasses: specSubclasses
      });
    }

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

  // Exporta a SVG la pestaña activa: el canvas EER se serializa desde el DOM (ya es SVG
  // nativo); el Modelo Relacional se reconstruye, porque en pantalla son tarjetas HTML.
  const handleExportSVG = useCallback(() => {
    if (activeTab === 'relational') {
      downloadTextFile(exportRelationalToSVG(relationalSchema, lang), 'relational-model.svg', SVG_MIME);
      return;
    }
    if (svgRef.current) {
      const data = new XMLSerializer().serializeToString(svgRef.current);
      downloadTextFile(data, 'eer-diagram.svg', SVG_MIME);
    }
  }, [activeTab, relationalSchema, lang, svgRef]);

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
    const contentWidth = maxX - minX + 200;
    const contentHeight = maxY - minY + 200;
    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = svgRect.width / contentWidth;
    const scaleY = svgRect.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setScale(newScale);
    setOffset({
      x: svgRect.width / 2 - centerX * newScale,
      y: svgRect.height / 2 - centerY * newScale
    });
  }, [nodes, svgRef, setScale, setOffset]);

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Cabecera Principal con Selector de Pestañas Docentes */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2.5 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">EER Studio</h1>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {t('header.subtitle')}
          </span>

          {/* Menú Archivo */}
          <div className="relative ml-2" onMouseDown={e => e.stopPropagation()}>
            <button onClick={() => setShowFileMenu(s => !s)} className="rounded-md px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200">
              File
            </button>
            {showFileMenu && (
              <div className="absolute left-0 mt-1 w-40 rounded-md border border-slate-200 bg-white shadow-lg z-40">
                <button onClick={() => handleOpenFile(handleLoadFileContent)} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-100">{t('header.fileMenu.open')}</button>
                <button onClick={() => handleSaveFile(getSaveContent())} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-100">{t('header.fileMenu.save')}</button>
                <button onClick={() => handleSaveAsFile(getSaveContent())} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-100">{t('header.fileMenu.saveAs')}</button>
              </div>
            )}
          </div>
        </div>

        {/* Selector de Pestañas Principales (EER | Relacional | SQL) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('eer')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'eer'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('header.tabs.eer')}</span>
          </button>

          <button
            onClick={() => setActiveTab('relational')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'relational'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t('header.tabs.relational')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sql');
              setShowSQLModal(true);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'sql'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('header.tabs.sql')}</span>
          </button>
        </div>

        {/* Botones de Ayuda y Exportación */}
        <div className="flex items-center gap-2">
          {/* Selector de Idioma ES/EN */}
          <div className="flex items-center gap-0.5 rounded-md border border-slate-200 p-0.5 mr-1">
            {(['es', 'en'] as const).map(code => (
              <button
                key={code}
                onClick={() => setLang(code)}
                title={t(`header.language.${code}`)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  lang === code ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          {runningInTauri && (
            <button
              onClick={handleToggleAlwaysOnTop}
              title={isPinned ? t('header.pinTooltip.pinned') : t('header.pinTooltip.unpinned')}
              className={`flex items-center justify-center rounded-md p-1.5 text-xs font-medium transition-colors ${
                isPinned ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </button>
          )}

          <button
            onClick={() => setShowStepInspector(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('header.stepGuide')}</span>
          </button>

          <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <HelpCircle className="h-4 w-4" /> {t('header.syntax')}
          </button>

          <button onClick={() => setShowAIPrompt(true)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <Code className="h-4 w-4" /> {t('header.aiPrompt')}
          </button>

          <button onClick={() => setShowCredits(true)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <Info className="h-4 w-4" /> {t('header.credits')}
          </button>

          {activeTab !== 'sql' && (
            <button onClick={handleExportSVG} className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors">
              <Share2 className="h-4 w-4" /> {t('header.exportSVG')}
            </button>
          )}

          <button onClick={() => setShowSQLModal(true)} className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors">
            <Database className="h-4 w-4" /> {t('header.exportSQL')}
          </button>
        </div>

      </header>

      {/* Contenido según la pestaña activa */}
      {activeTab === 'eer' && (
        <>
          <Toolbar selectedTool={selectedTool} onToolSelect={setSelectedTool} />
          <div className="flex flex-1 overflow-hidden">
            <div style={{ width: `${codePanelWidth}px`, flexShrink: 0 }}>
              <CodePanel
                code={code}
                onCodeChange={setCode}
                onClear={() => setShowClearConfirm(true)}
                onEditStart={() => setSelectedNodeId(null)}
                diagnostics={diagnostics}
                isValid={isValid}
                elementCount={elementCount}
              />
            </div>

            <ResizableDivider 
              onResize={setCodePanelWidth}
              minLeftWidth={200}
              minRightWidth={300}
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
        </>
      )}

      {activeTab === 'relational' && (
        <div className="flex flex-1 overflow-hidden">
          <div style={{ width: `${codePanelWidth}px`, flexShrink: 0 }}>
            <CodePanel
              code={relationalCode}
              onCodeChange={handleRelationalCodeChange}
              onClear={() => setRelationalCode('')}
              onEditStart={() => {}}
            />
          </div>

          <ResizableDivider 
            onResize={setCodePanelWidth}
            minLeftWidth={200}
            minRightWidth={300}
          />

          <div className="flex-1 overflow-hidden h-full">
            <RelationalViewer
              schema={relationalSchema}
              onTablePositionChange={handleRelationalTableMove}
              onSelectTableForInspection={table => {
                setInspectedTable(table);
                setShowStepInspector(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Modales */}
      <StepInspectorModal
        isOpen={showStepInspector}
        onClose={() => {
          setShowStepInspector(false);
          setInspectedTable(null);
        }}
        selectedTable={inspectedTable}
      />

      <SQLPreviewModal
        isOpen={showSQLModal}
        onClose={() => setShowSQLModal(false)}
        schema={relationalSchema}
      />

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