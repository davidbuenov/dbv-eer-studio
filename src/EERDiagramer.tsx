// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { BookOpen, Share2, HelpCircle, Database, Layers, FileText, Pin, PinOff, Maximize2, Minimize2 } from 'lucide-react';
import type { EERDiagramerHandle } from './types';
import { runningInTauri } from './utils/platform';
import { SAMPLE_CODE } from './constants';
import { deleteNodesFromCode } from './utils/deleteNode';
import { getOwnedLineIndices, suggestedAttributeOwner } from './utils/dslEditing';
import { useEERParser } from './hooks/useEERParser';
import { useCodeHistory } from './hooks/useCodeHistory';
import { useFullscreen } from './hooks/useFullscreen';
import { historyShortcut } from './utils/codeHistory';
import { useFileOperations } from './hooks/useFileOperations';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useToolbar } from './hooks/useToolbar';
import { useModalState } from './hooks/useModalState';
import { usePropertiesForm } from './hooks/usePropertiesForm';
import { HelpCenter } from './components/help/HelpCenter';
import { useHelpCenter } from './hooks/useHelpCenter';
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
import { compileRelationalDSL } from './utils/relational/relationalCompiler';
import {
  applyTypeOverrides,
  extractTypeOverrides,
  parseTypeOverrideLine,
  serializeTypeOverrides,
  type TypeOverrides,
} from './utils/relational/typeOverrides';
import { RelationalViewer } from './components/relational/RelationalViewer';
import { SQLPreviewModal } from './components/sql/SQLPreviewModal';
import type { RelationalSchema } from './types/relational';
import type { Diagnostic } from './types/compiler';
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
  // Con historial de deshacer/rehacer (§3.11 H): `setCode` = un paso; el tecleo se agrupa.
  const { code, setCode, setCodeFromTyping, undo, redo, canUndo, canRedo } = useCodeHistory(SAMPLE_CODE);
  const toolbarHistory = useMemo(() => ({ onUndo: undo, onRedo: redo, canUndo, canRedo }), [undo, redo, canUndo, canRedo]);
  const codeRef = useRef(code);

  // Estado del código Relacional DSL y Coordenadas Relacionales Persistidas
  const [relationalCode, setRelationalCode] = useState('');
  const [relationalPositions, setRelationalPositions] = useState<Record<string, { x: number; y: number }>>({});
  // Tipos elegidos por el alumno en el DSL relacional (§3.11 L3) y el esquema tal como lo infiere
  // el motor, contra el que se comparan. Refs: no deben provocar una regeneración por sí mismos.
  const typeOverridesRef = useRef<TypeOverrides>({});
  const inferredSchemaRef = useRef<RelationalSchema>({ tables: [], config: { inheritanceOptions: {}, oneToOneOptions: {} } });

  // Estado del esquema relacional y modales educativos
  const [relationalSchema, setRelationalSchema] = useState<RelationalSchema>({ tables: [], config: { inheritanceOptions: {}, oneToOneOptions: {} } });
  const [relationalDiagnostics, setRelationalDiagnostics] = useState<Diagnostic[]>([]);
  const [isRelationalValid, setIsRelationalValid] = useState<boolean>(true);
  const isRelationalValidRef = useRef<boolean>(true);
  const lastValidRelationalSchemaRef = useRef<RelationalSchema>({ tables: [], config: { inheritanceOptions: {}, oneToOneOptions: {} } });
  const [showSQLModal, setShowSQLModal] = useState(false);

  // Estado de eliminación (la selección vive en useCanvasInteraction)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estado del ancho del panel de código
  const [codePanelWidth, setCodePanelWidth] = useState(400);

  // Actualizar codeRef cuando cambia el código EER
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Parser hook - compila el código EER y genera nodos y enlaces con tolerancia a fallos
  const { nodes, links, setNodes, diagnostics, isValid, compiledCode } = useEERParser(code);

  const elementCount = useMemo(() => ({
    entities: nodes.filter(n => n.type === 'entity' || n.type === 'weak_entity').length,
    relations: nodes.filter(n => n.type === 'relationship' || n.type === 'identifying_relationship').length,
  }), [nodes]);

  const relationalCountSummary = useMemo(() => {
    const totalFKs = relationalSchema.tables.reduce((acc, t) => acc + t.foreignKeys.length, 0);
    return t('compiler.tablesAndFKs', {
      tables: relationalSchema.tables.length,
      fks: totalFKs,
    });
  }, [relationalSchema, t]);

  // Ref para controlar la regeneración reactiva solo cuando cambia el diagrama EER
  const lastEERCodeRef = useRef<string>('');

  // Actualización reactiva del Esquema Relacional cuando cambia el diagrama EER y el código es válido.
  // La clave es `compiledCode` (el texto del que salen `nodes`), no `code`: el parser compila con
  // retardo y, con `code`, el efecto se disparaba con los nodos anteriores y daba el texto por
  // procesado, así que el relacional iba siempre un cambio por detrás (al borrar una entidad su
  // tabla seguía ahí). Un EER vacío (Limpiar) también vacía el relacional (§3.11 L1).
  useEffect(() => {
    if (isValid && compiledCode !== null && compiledCode !== lastEERCodeRef.current) {
      lastEERCodeRef.current = compiledCode;
      try {
        const inferred = eerToRelational(nodes, links, undefined, relationalPositions);
        inferredSchemaRef.current = inferred;
        const derived = applyTypeOverrides(inferred, typeOverridesRef.current);
        setRelationalSchema(derived);
        setRelationalCode(generateRelationalDSL(derived));
        lastValidRelationalSchemaRef.current = derived;
        setRelationalDiagnostics([]);
        setIsRelationalValid(true);
        isRelationalValidRef.current = true;
      } catch (err) {
        console.error('[EERDiagramer] Error al convertir EER a Relacional:', err);
      }
    }
  }, [compiledCode, nodes, links, relationalPositions, isValid]);

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
    const typeLines = serializeTypeOverrides(typeOverridesRef.current);
    if (typeLines.length > 0) {
      fullText += `${posKeys.length > 0 ? '' : '\n\n'}// RELATIONAL TYPES\n${typeLines.join('\n')}\n`;
    }
    return fullText;
  }, [relationalPositions]);

  // Carga un archivo deserializando EER y Coordenadas Relacionales guardadas
  const handleLoadFileContent = useCallback((text: string) => {
    const lines = text.split('\n');
    const eerLines: string[] = [];
    const newPositions: Record<string, { x: number; y: number }> = {};
    const newOverrides: TypeOverrides = {};

    lines.forEach(line => {
      // Coordenadas negativas incluidas: una tabla arrastrada a la izquierda del origen se guardaba
      // como `(-40, 120)` pero no se leía, y volvía a su posición automática.
      const relMatch = line.match(/^relational\s+([A-Za-z0-9_]+)\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
      const typeOverride = parseTypeOverrideLine(line);
      if (typeOverride) {
        newOverrides[typeOverride.key] = typeOverride.type;
      } else if (relMatch && relMatch[1] && relMatch[2] && relMatch[3]) {
        newPositions[relMatch[1]] = {
          x: parseInt(relMatch[2], 10),
          y: parseInt(relMatch[3], 10)
        };
      } else {
        eerLines.push(line);
      }
    });

    typeOverridesRef.current = newOverrides;
    // Forzar la regeneración del relacional aunque el EER cargado sea idéntico al actual.
    lastEERCodeRef.current = '';
    setRelationalPositions(newPositions);
    setCode(eerLines.join('\n').trim());
  }, [setCode]);

  // Canvas interaction hook
  const {
    draggedNodeId,
    selectedNodeIds,
    primaryNodeId,
    selectOnly,
    scale,
    setScale,
    offset,
    setOffset,
    svgRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeClick,
    handleCanvasMouseDown,
    handleWheel,
    marquee,
    isPanning
  } = useCanvasInteraction({ nodes, setNodes, code, setCode });

  const selectedNodes = useMemo(
    () => nodes.filter(n => selectedNodeIds.includes(n.id)),
    [nodes, selectedNodeIds]
  );

  // Líneas del DSL del elemento seleccionado. Solo con código válido: con Stale-while-error
  // los nodos en pantalla pueden venir de un texto anterior y sus índices no corresponderían.
  const highlightedLines = useMemo(
    () => (isValid ? [...new Set(selectedNodes.flatMap(n => getOwnedLineIndices(n, nodes, links)))] : []),
    [isValid, selectedNodes, nodes, links]
  );
  const focusLine = isValid ? (nodes.find(n => n.id === primaryNodeId)?.lineIndex ?? null) : null;

  // Toolbar hook
  const {
    selectedTool,
    setSelectedTool,
    clickX,
    clickY,
    handleCanvasClick: toolbarCanvasClick,
    resetTool,
    setClickPosition
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
      lastValidRelationalSchemaRef.current = newSchema;
      if (isRelationalValidRef.current) {
        setRelationalCode(generateRelationalDSL(newSchema));
      }
      return newSchema;
    });
  }, []);

  // Manejador de la edición directa del código DSL Relacional por el usuario con tolerancia a fallos (Stale-while-error)
  const handleRelationalCodeChange = useCallback((newDSL: string) => {
    setRelationalCode(newDSL);
    const result = compileRelationalDSL(newDSL);
    setRelationalDiagnostics(result.diagnostics);
    setIsRelationalValid(result.isValid);
    isRelationalValidRef.current = result.isValid;

    if (result.isValid) {
      // Recordar los tipos que el alumno ha cambiado respecto a los inferidos (§3.11 L3).
      typeOverridesRef.current = extractTypeOverrides(result.schema, inferredSchemaRef.current);
      lastValidRelationalSchemaRef.current = result.schema;
      setRelationalSchema(result.schema);
      const newPositions: Record<string, { x: number; y: number }> = {};
      result.schema.tables.forEach(t => {
        newPositions[t.name] = { x: t.x, y: t.y };
      });
      setRelationalPositions(newPositions);
    } else {
      // Stale-while-error: si el alumno borra 'table ' o introduce sintaxis rota,
      // mantenemos el último esquema válido en el visor para evitar parpadeos y reinicios
      setRelationalSchema(lastValidRelationalSchemaRef.current);
    }
  }, []);

  // Modal state hook
  const modal = useModalState();
  const {
    showClearConfirm,
    setShowClearConfirm,
    showPropertiesModal,
    setShowPropertiesModal,
  } = modal;

  const clearSelection = useCallback(() => selectOnly(null), [selectOnly]);

  // Centro de Ayuda: uso del editor, sintaxis, 9 pasos, prompt IA y créditos
  const help = useHelpCenter();

  const {
    openCreate,
    openEdit,
    confirm: handleConfirmProperties,
    confirmAndContinue: handleConfirmAndContinue,
    formKey,
    isEditBlocked,
  } = usePropertiesForm({
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
    onEdited: clearSelection,
    contextOwner: suggestedAttributeOwner(nodes.find(n => n.id === primaryNodeId), nodes),
  });

  // `NodeRenderer` está memoizado sin comparar callbacks: el doble clic debe ser estable.
  const openEditRef = useRef(openEdit);
  useEffect(() => {
    openEditRef.current = openEdit;
  });
  const handleNodeDoubleClick = useCallback((id: string) => openEditRef.current(id), []);

  useImperativeHandle(ref, () => ({
    getCode: () => codeRef.current,
    setCode: (c: string) => setCode(c),
  }));

  // Atajos del canvas: Supr/Retroceso elimina la selección, F2/Enter edita el nodo principal,
  // Escape vacía la selección. Se ignoran mientras se escribe en un campo o hay un modal abierto.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      // F1 abre la ayuda en cualquier contexto (también escribiendo en el código), como en las
      // aplicaciones de escritorio; sin preventDefault el navegador abriría su propia ayuda.
      if (e.key === 'F1') {
        e.preventDefault();
        if (!showPropertiesModal && !showDeleteConfirm) help.openHelp();
        return;
      }
      if (isTyping || showPropertiesModal || showDeleteConfirm || help.isOpen || activeTab !== 'eer') return;

      // Deshacer/rehacer con el foco en el lienzo (en el panel de código lo gestiona CodePanel).
      const historyAction = historyShortcut(e);
      if (historyAction) {
        e.preventDefault();
        if (historyAction === 'undo') undo();
        else redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0 && isValid) {
        e.preventDefault();
        setShowDeleteConfirm(true);
      } else if ((e.key === 'F2' || e.key === 'Enter') && primaryNodeId) {
        e.preventDefault();
        openEdit(primaryNodeId);
      } else if (e.key === 'Escape') {
        selectOnly(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, primaryNodeId, showPropertiesModal, showDeleteConfirm, activeTab, isValid, openEdit, selectOnly, help, undo, redo]);

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

  // Pantalla completa (§3.11 F): Fullscreen API en el navegador, ventana nativa en escritorio.
  const fullscreen = useFullscreen(runningInTauri);
  const toggleFullscreen = fullscreen.toggle;
  const isFullscreen = fullscreen.isActive;

  // En escritorio la pantalla completa es de la ventana nativa: el navegador no aporta F11 ni Esc.
  useEffect(() => {
    if (!runningInTauri) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.key === 'Escape' && isFullscreen)) {
        e.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

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
    // Sin herramienta activa el clic en el fondo lo gestiona el rectángulo de selección
    // (un clic sin arrastrar vacía la selección al soltar).
    if (draggedNodeId || !selectedTool || e.button !== 0) return;
    const coords = toolbarCanvasClick(e);
    if (!coords) return;
    openCreate(selectedTool, coords);
  }, [selectedTool, draggedNodeId, toolbarCanvasClick, openCreate]);

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

  const handleDeleteNodes = useCallback(() => {
    if (selectedNodes.length === 0 || !isValid) return;
    setCode(deleteNodesFromCode(code, selectedNodes, nodes));
    selectOnly(null);
  }, [selectedNodes, isValid, code, nodes, selectOnly, setCode]);

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

          {/* Menú Archivo */}
          <div className="relative ml-2" onMouseDown={e => e.stopPropagation()}>
            <button onClick={() => setShowFileMenu(s => !s)} className="rounded-md px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200">
              {t('header.fileMenu.label')}
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

          {fullscreen.isSupported && (
            <button
              onClick={() => void toggleFullscreen()}
              title={`${fullscreen.isActive ? t('header.fullscreen.exit') : t('header.fullscreen')} — ${t(runningInTauri ? 'header.fullscreen.tooltipDesktop' : 'header.fullscreen.tooltipWeb')}`}
              aria-label={fullscreen.isActive ? t('header.fullscreen.exit') : t('header.fullscreen')}
              aria-pressed={fullscreen.isActive}
              className={`flex items-center justify-center rounded-md p-1.5 text-xs font-medium transition-colors ${
                fullscreen.isActive ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {fullscreen.isActive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}

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
            onClick={() => help.openHelp()}
            title={t('header.helpTooltip')}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
          >
            <HelpCircle className="h-4 w-4" />
            <span>{t('header.help')}</span>
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
          <Toolbar selectedTool={selectedTool} onToolSelect={setSelectedTool} history={toolbarHistory} />
          <div className="flex flex-1 overflow-hidden">
            <div style={{ width: `${codePanelWidth}px`, flexShrink: 0 }}>
              <CodePanel
                code={code}
                onCodeChange={setCodeFromTyping}
                onUndo={undo}
                onRedo={redo}
                onClear={() => setShowClearConfirm(true)}
                onEditStart={clearSelection}
                diagnostics={diagnostics}
                isValid={isValid}
                elementCount={elementCount}
                highlightedLines={highlightedLines}
                focusLine={focusLine}
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
                selectedNodeIds={selectedNodeIds}
                marquee={marquee}
                isPanning={isPanning}
                onWheel={handleWheel}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClickInternal}
                onMouseDown={(e) => handleCanvasMouseDown(e, !selectedTool)}
                onNodeMouseDown={handleMouseDown}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
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
              onClear={() => {
                setRelationalCode('');
                handleRelationalCodeChange('');
              }}
              onEditStart={() => {}}
              diagnostics={relationalDiagnostics}
              isValid={isRelationalValid}
              countSummary={relationalCountSummary}
              notice={t('codePanel.relationalNotice')}
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
              onSelectTableForInspection={table => help.openHelp('steps', table)}
            />
          </div>
        </div>
      )}

      {/* Modales */}
      <SQLPreviewModal
        isOpen={showSQLModal}
        onClose={() => setShowSQLModal(false)}
        schema={relationalSchema}
      />

      <HelpCenter
        isOpen={help.isOpen}
        tab={help.tab}
        onTabChange={help.setTab}
        onClose={help.close}
        inspectedTable={help.inspectedTable}
      />

      <ModalClearConfirm
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => setCode('')}
      />

      <ModalDeleteConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteNodes}
        nodes={selectedNodes}
      />

      <ModalProperties
        key={formKey}
        isOpen={showPropertiesModal}
        onClose={() => setShowPropertiesModal(false)}
        nodes={nodes}
        links={links}
        modalState={modal}
        isEditBlocked={isEditBlocked}
        setters={modal}
        onConfirm={handleConfirmProperties}
        onConfirmAndContinue={handleConfirmAndContinue}
      />
    </div>
  );
}

const EERDiagrammerWithRef = forwardRef(EERDiagrammer);
export default EERDiagrammerWithRef;