// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteNodesFromCode } from '../utils/deleteNode';
import { getOwnedLineIndices } from '../utils/dslEditing';
import { downloadTextFile } from '../utils/download';
import { useEERParser } from '../hooks/useEERParser';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useToolbar } from '../hooks/useToolbar';
import { useModalState } from '../hooks/useModalState';
import { usePropertiesForm } from '../hooks/usePropertiesForm';
import { useHelpCenter } from '../hooks/useHelpCenter';
import { HelpCenter } from '../components/help/HelpCenter';
import { ModalClearConfirm } from '../components/ModalClearConfirm';
import { ModalDeleteConfirm } from '../components/ModalDeleteConfirm';
import { ModalProperties } from '../components/ModalProperties';
import { Canvas } from '../components/Canvas';
import { Toolbar } from '../components/Toolbar';
import { CodePanel } from '../components/CodePanel';
import { ResizableDivider } from '../components/ResizableDivider';
import { useLanguage } from '../i18n/language';
import type { ExamConfig } from './examConfig';
import { useExamSession, type ExamStatus } from './useExamSession';
import { decodeSubmission, encodeSubmission, submissionHeader, toPlainText } from './submission';
import { copyText } from './clipboard';
import { ExamActionsBar } from './components/ExamActionsBar';
import { ConfirmModal, CopyFallbackModal, LoadSubmissionModal } from './components/SubmissionModals';

const fileSlug = (title: string) =>
  title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/**
 * Edición Moodle de EER Studio (SPECIFICATIONS.md §3.10): solo el editor EER, con autoguardado y
 * entrega por bloque copiado al texto en línea de una Tarea. No importa `EERDiagramer` para que
 * el modelo relacional, el SQL y Tauri queden fuera del paquete y la edición completa no cambie.
 */
export function MoodleExamApp({ config }: { config: ExamConfig }) {
  const { t } = useLanguage();
  const { code, setCode, status, setStatus, reset, markSubmitted } = useExamSession(config);

  const [codePanelWidth, setCodePanelWidth] = useState(400);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopyErrors, setShowCopyErrors] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  const { nodes, links, setNodes, diagnostics, isValid } = useEERParser(code);
  const errorCount = diagnostics.filter(d => d.severity === 'error').length;

  const elementCount = useMemo(() => ({
    entities: nodes.filter(n => n.type === 'entity' || n.type === 'weak_entity').length,
    relations: nodes.filter(n => n.type === 'relationship' || n.type === 'identifying_relationship').length,
  }), [nodes]);

  const {
    draggedNodeId, selectedNodeIds, primaryNodeId, selectOnly, scale, setScale, offset, setOffset, svgRef,
    handleMouseDown, handleMouseMove, handleMouseUp, handleNodeClick, handleCanvasMouseDown, handleWheel, marquee, isPanning,
  } = useCanvasInteraction({ nodes, setNodes, code, setCode });

  const selectedNodes = useMemo(() => nodes.filter(n => selectedNodeIds.includes(n.id)), [nodes, selectedNodeIds]);

  // Igual que en la edición completa: con Stale-while-error los índices de línea no son fiables.
  const highlightedLines = useMemo(
    () => (isValid ? [...new Set(selectedNodes.flatMap(n => getOwnedLineIndices(n, nodes, links)))] : []),
    [isValid, selectedNodes, nodes, links],
  );
  const focusLine = isValid ? (nodes.find(n => n.id === primaryNodeId)?.lineIndex ?? null) : null;

  const { selectedTool, setSelectedTool, clickX, clickY, handleCanvasClick: toolbarCanvasClick, resetTool, setClickPosition } =
    useToolbar(svgRef, scale, offset, draggedNodeId);

  const modal = useModalState();
  const { showClearConfirm, setShowClearConfirm, showPropertiesModal, setShowPropertiesModal } = modal;
  const clearSelection = useCallback(() => selectOnly(null), [selectOnly]);
  const help = useHelpCenter();

  const { openCreate, openEdit, confirm: handleConfirmProperties, confirmAndContinue: handleConfirmAndContinue, formKey, isEditBlocked } =
    usePropertiesForm({ modal, nodes, links, code, setCode, isValid, clickX, clickY, setClickPosition, resetTool, onEdited: clearSelection });

  const openEditRef = useRef(openEdit);
  useEffect(() => {
    openEditRef.current = openEdit;
  });
  const handleNodeDoubleClick = useCallback((id: string) => openEditRef.current(id), []);

  const anyExamModalOpen = showCopyErrors || showLoad || showReset || fallbackText !== null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (e.key === 'F1') {
        e.preventDefault();
        if (!showPropertiesModal && !showDeleteConfirm && !anyExamModalOpen) help.openHelp();
        return;
      }
      if (isTyping || showPropertiesModal || showDeleteConfirm || help.isOpen || anyExamModalOpen) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0 && isValid) {
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
  }, [selectedNodeIds, primaryNodeId, showPropertiesModal, showDeleteConfirm, anyExamModalOpen, isValid, openEdit, selectOnly, help]);

  const handleCanvasClickInternal = useCallback((e: React.MouseEvent) => {
    if (draggedNodeId || !selectedTool || e.button !== 0) return;
    const coords = toolbarCanvasClick(e);
    if (coords) openCreate(selectedTool, coords);
  }, [selectedTool, draggedNodeId, toolbarCanvasClick, openCreate]);

  const handleZoomIn = useCallback(() => setScale(s => Math.min(2, Math.round((s + 0.1) * 100) / 100)), [setScale]);
  const handleZoomOut = useCallback(() => setScale(s => Math.max(0.2, Math.round((s - 0.1) * 100) / 100)), [setScale]);
  const handleResetZoom = useCallback(() => {
    setScale(0.8);
    setOffset({ x: 0, y: 0 });
  }, [setScale, setOffset]);

  const handleFitToContent = useCallback(() => {
    if (nodes.length === 0 || !svgRef.current) return;
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const rect = svgRef.current.getBoundingClientRect();
    const newScale = Math.min(rect.width / (maxX - minX + 200), rect.height / (maxY - minY + 200), 2);
    setScale(newScale);
    setOffset({ x: rect.width / 2 - ((minX + maxX) / 2) * newScale, y: rect.height / 2 - ((minY + maxY) / 2) * newScale });
  }, [nodes, svgRef, setScale, setOffset]);

  const handleDeleteNodes = useCallback(() => {
    if (selectedNodes.length === 0 || !isValid) return;
    setCode(deleteNodesFromCode(code, selectedNodes, nodes));
    selectOnly(null);
  }, [selectedNodes, isValid, code, nodes, selectOnly, setCode]);

  // ---------- Entrega ----------
  const submissionMeta = () => ({ appVersion: __APP_VERSION__, examId: config.examId, date: new Date().toISOString() });

  const copySubmission = async () => {
    const block = encodeSubmission(code, submissionMeta());
    const method = await copyText(block);
    markSubmitted();
    if (method === 'failed') setFallbackText(block);
    else setStatus({ key: 'moodle.status.copied', tone: 'success' });
  };

  const handleCopyRequest = () => {
    if (errorCount > 0) setShowCopyErrors(true);
    else void copySubmission();
  };

  const handleDownload = () => {
    const content = `${submissionHeader(code, submissionMeta())}\n${code.trim()}\n`;
    downloadTextFile(content, `${fileSlug(config.title) || 'examen-eer'}.eer`, 'text/plain;charset=utf-8');
  };

  const handleLoadSubmission = (text: string): string | null => {
    const result = decodeSubmission(text);
    if (!result.ok && result.reason === 'unterminated') return t('moodle.paste.unterminated');

    let next: ExamStatus;
    if (!result.ok) {
      setCode(toPlainText(text).trim());
      next = { key: 'moodle.status.loadedPlain', tone: 'warning' };
    } else {
      setCode(result.dsl);
      if (result.checksumValid === false) next = { key: 'moodle.status.loadedTampered', tone: 'warning' };
      else if (result.multipleBlocks) next = { key: 'moodle.status.loadedMultiple', tone: 'warning' };
      else if (result.checksumValid === null) next = { key: 'moodle.status.loadedNoChecksum', tone: 'info' };
      else next = { key: 'moodle.status.loaded', tone: 'success' };
    }
    selectOnly(null);
    setStatus(next);
    return null;
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <ExamActionsBar
        title={config.title}
        status={status}
        onCopy={handleCopyRequest}
        onDownload={handleDownload}
        onLoad={() => setShowLoad(true)}
        onReset={() => setShowReset(true)}
        onHelp={() => help.openHelp()}
      />

      <Toolbar selectedTool={selectedTool} onToolSelect={setSelectedTool} />
      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: `${codePanelWidth}px`, flexShrink: 0 }}>
          <CodePanel
            code={code}
            onCodeChange={setCode}
            onClear={() => setShowClearConfirm(true)}
            onEditStart={clearSelection}
            diagnostics={diagnostics}
            isValid={isValid}
            elementCount={elementCount}
            highlightedLines={highlightedLines}
            focusLine={focusLine}
          />
        </div>
        <ResizableDivider onResize={setCodePanelWidth} minLeftWidth={200} minRightWidth={300} />
        <div className="h-full flex-1 overflow-hidden">
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
            onMouseDown={e => handleCanvasMouseDown(e, !selectedTool)}
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

      <HelpCenter isOpen={help.isOpen} tab={help.tab} onTabChange={help.setTab} onClose={help.close} inspectedTable={null} variant="exam" />

      <ConfirmModal
        isOpen={showCopyErrors}
        title={t('moodle.copyErrors.title')}
        message={t('moodle.copyErrors.message', { n: errorCount })}
        confirmLabel={t('moodle.copyErrors.confirm')}
        onClose={() => setShowCopyErrors(false)}
        onConfirm={() => void copySubmission()}
      />
      <ConfirmModal
        isOpen={showReset}
        title={t('moodle.reset.title')}
        message={t('moodle.reset.message')}
        confirmLabel={t('moodle.reset')}
        danger
        onClose={() => setShowReset(false)}
        onConfirm={() => {
          reset();
          selectOnly(null);
        }}
      />
      <LoadSubmissionModal isOpen={showLoad} onClose={() => setShowLoad(false)} onLoad={handleLoadSubmission} />
      <CopyFallbackModal text={fallbackText} onClose={() => setFallbackText(null)} />

      <ModalClearConfirm isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={() => setCode('')} />
      <ModalDeleteConfirm isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteNodes} nodes={selectedNodes} />
      <ModalProperties
        key={formKey}
        isOpen={showPropertiesModal}
        onClose={() => setShowPropertiesModal(false)}
        nodes={nodes}
        modalState={modal}
        isEditBlocked={isEditBlocked}
        setters={modal}
        onConfirm={handleConfirmProperties}
        onConfirmAndContinue={handleConfirmAndContinue}
      />
    </div>
  );
}
