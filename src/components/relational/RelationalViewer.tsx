// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Key, Link, BookOpen, Database, Plus, Minus, RotateCcw, Maximize2, LayoutGrid } from 'lucide-react';

import type { RelationalSchema, RelationalTable } from '../../types/relational';
import { useLanguage } from '../../i18n/language';
import { translateStepTitle } from '../../i18n/steps';
import { CARD_WIDTH, getTableHeight, computeFKEdges } from '../../utils/relational/relationalGeometry';
import { RELATIONAL_COLORS as C } from '../../utils/relational/relationalColors';

interface RelationalViewerProps {
  schema: RelationalSchema;
  onTablePositionChange: (tableId: string, x: number, y: number) => void;
  onSelectTableForInspection: (table: RelationalTable) => void;
}

export const RelationalViewer: React.FC<RelationalViewerProps> = ({
  schema,
  onTablePositionChange,
  onSelectTableForInspection,
}) => {
  const { lang, t } = useLanguage();

  // Estado de Zoom y Panning (Arrastre del Canvas)
  const [scale, setScale] = useState<number>(0.85);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 40, y: 40 });

  // Estado de Arrastre, Hover y Pan
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tableStartPos, setTableStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Posición "en vivo" de la tabla que se está arrastrando (estado local, no sube al padre
  // hasta soltar el ratón). Evita regenerar el DSL relacional completo en cada mousemove,
  // que es lo que causaba el arrastre lento en el ejecutable nativo (WebView2).
  const [liveDragPos, setLiveDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Manejadores de Zoom
  const handleZoomIn = useCallback(() => {
    setScale(s => Math.min(2.0, Math.round((s + 0.1) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(s => Math.max(0.2, Math.round((s - 0.1) * 100) / 100));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(0.85);
    setOffset({ x: 40, y: 40 });
  }, []);

  const handleFitToContent = useCallback(() => {
    if (schema.tables.length === 0 || !containerRef.current) return;
    const minX = Math.min(...schema.tables.map(t => t.x));
    const maxX = Math.max(...schema.tables.map(t => t.x + CARD_WIDTH));
    const minY = Math.min(...schema.tables.map(t => t.y));
    const maxY = Math.max(...schema.tables.map(t => t.y + getTableHeight(t)));

    const contentWidth = maxX - minX + 160;
    const contentHeight = maxY - minY + 160;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1.5);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setScale(Math.max(0.3, Math.round(newScale * 100) / 100));
    setOffset({
      x: rect.width / 2 - centerX * newScale,
      y: rect.height / 2 - centerY * newScale,
    });
  }, [schema.tables]);

  // Reorganización automática inteligente en cuadrícula
  const handleAutoLayout = useCallback(() => {
    if (schema.tables.length === 0) return;
    const GAP_X = 80;
    const GAP_Y = 120;
    const MARGIN_X = 60;
    const MARGIN_Y = 60;
    const cols = Math.min(3, Math.ceil(Math.sqrt(schema.tables.length)));

    schema.tables.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const newX = MARGIN_X + col * (CARD_WIDTH + GAP_X);
      const newY = MARGIN_Y + row * (180 + GAP_Y);
      onTablePositionChange(table.id, newX, newY);
    });
  }, [schema.tables, onTablePositionChange]);

  /**
   * Posición efectiva de una tabla: la de arrastre en vivo si es la que se está
   * moviendo, o la posición confirmada del schema en caso contrario.
   */
  const getEffectivePos = useCallback(
    (table: RelationalTable): { x: number; y: number } =>
      liveDragPos && liveDragPos.id === table.id
        ? { x: liveDragPos.x, y: liveDragPos.y }
        : { x: table.x, y: table.y },
    [liveDragPos]
  );

  // Manejo de Rueda de Ratón para Zoom

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(2.0, Math.max(0.2, Math.round(scale * zoomFactor * 100) / 100));
    setScale(newScale);
  };

  // Inicio de arrastre de una Tabla
  const handleTableMouseDown = (table: RelationalTable, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingTableId(table.id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setTableStartPos({ x: table.x, y: table.y });
  };

  // Inicio de arrastre del Canvas (Panning)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Solo clic izquierdo
    setIsPanning(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  // Movimiento global del Ratón
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTableId) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      const newX = Math.max(10, Math.round(tableStartPos.x + dx));
      const newY = Math.max(10, Math.round(tableStartPos.y + dy));
      // Solo estado local mientras se arrastra: nada de regenerar el DSL en cada
      // frame (eso es lo que hacía lento el arrastre, sobre todo en el ejecutable nativo).
      setLiveDragPos({ id: draggingTableId, x: newX, y: newY });
    } else if (isPanning) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingTableId && liveDragPos && liveDragPos.id === draggingTableId) {
      // Al soltar el ratón es cuando se confirma la posición al padre y se regenera el DSL.
      onTablePositionChange(draggingTableId, liveDragPos.x, liveDragPos.y);
    }
    setLiveDragPos(null);
    setDraggingTableId(null);
    setIsPanning(false);
  };

  // Tamaño total del canvas SVG interno
  const maxX = Math.max(3000, ...schema.tables.map(t => t.x + 800));
  const maxY = Math.max(2400, ...schema.tables.map(t => t.y + 800));

  // Trazado de las flechas FK: misma función que usa el exportador a SVG.
  const fkEdges = computeFKEdges(schema, getEffectivePos);

  // El pie de cada tarjeta se traduce fuera del render de la tarjeta: este componente se
  // re-renderiza en cada `mousemove` del arrastre, y `schema.tables` no cambia durante él.
  const stepLabels = useMemo(
    () =>
      new Map(
        schema.tables.map(table => [
          table.id,
          {
            title: translateStepTitle(lang, table.stepTrace.stepKey, table.stepTrace.params),
            step: t('common.step', { n: table.stepTrace.stepNumber }),
          },
        ])
      ),
    [lang, schema.tables, t]
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-full bg-slate-950 overflow-hidden select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    >
      {schema.tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
          <Database className="w-12 h-12 stroke-[1.5]" />
          <p className="text-sm font-medium">{t('relationalViewer.empty.title')}</p>
          <p className="text-xs text-slate-600">
            {t('relationalViewer.empty.subtitle')}
          </p>
        </div>
      ) : (
        <>
          {/* Contenedor Transformable para Zoom y Panning (Misma experiencia que el EER Canvas) */}
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: `${maxX}px`,
              height: `${maxY}px`,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {/* Capa SVG de Flechas de Integridad Referencial */}
            <svg
              className="absolute inset-0 pointer-events-none z-0"
              style={{ width: `${maxX}px`, height: `${maxY}px` }}
            >
              <defs>
                <marker
                  id="fk-arrow-dashed"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={C.arrowRegular} />
                </marker>

                <marker
                  id="fk-arrow-solid"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={C.arrowIdentifying} />
                </marker>
              </defs>

              {fkEdges.map(edge => {
                const lineColor = edge.isIdentifying ? C.arrowIdentifying : C.arrowRegular;
                const markerId = edge.isIdentifying ? 'url(#fk-arrow-solid)' : 'url(#fk-arrow-dashed)';
                const dashArray = edge.isIdentifying ? undefined : '6,4';
                const rectX = -edge.textWidth / 2;

                const isConnectedToHover =
                  hoveredTableId === edge.sourceTableId || hoveredTableId === edge.targetTableId;
                const isHoverActive = hoveredTableId !== null;
                const strokeOpacity = isHoverActive ? (isConnectedToHover ? 1 : 0.15) : 0.85;
                const strokeWidth = isConnectedToHover ? 3.5 : 2;

                return (
                  <g key={edge.key} className="transition-opacity duration-200" style={{ opacity: strokeOpacity }}>
                    <path
                      d={edge.pathData}
                      fill="none"
                      stroke={C.arrowHalo}
                      strokeWidth={strokeWidth + 2}
                      strokeOpacity="0.25"
                    />
                    <path
                      d={edge.pathData}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dashArray}
                      markerEnd={markerId}
                    />
                    <circle cx={edge.sourceAnchor.x} cy={edge.sourceAnchor.y} r={isConnectedToHover ? 4.5 : 3} fill={lineColor} />
                    <circle cx={edge.targetAnchor.x} cy={edge.targetAnchor.y} r={isConnectedToHover ? 4.5 : 3} fill={lineColor} />

                    <g transform={`translate(${edge.midX}, ${edge.midY})`}>
                      <rect
                        x={rectX}
                        y="-12"
                        width={edge.textWidth}
                        height="24"
                        rx="12"
                        fill={C.labelBg}
                        stroke={lineColor}
                        strokeWidth={isConnectedToHover ? 2 : 1.5}
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill={lineColor}
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {edge.labelText}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Tarjetas Visuales de las Tablas */}
            {schema.tables.map(table => {
              const pos = getEffectivePos(table);
              const stepLabel = stepLabels.get(table.id);
              return (
              <div
                key={table.id}
                onMouseDown={e => handleTableMouseDown(table, e)}
                onMouseEnter={() => setHoveredTableId(table.id)}
                onMouseLeave={() => setHoveredTableId(null)}
                className={`absolute w-72 bg-slate-900 border rounded-xl shadow-xl overflow-hidden ${
                  draggingTableId === table.id ? '' : 'transition-all duration-200'
                } ${
                  hoveredTableId === table.id
                    ? 'border-indigo-400 ring-2 ring-indigo-500/50 shadow-2xl scale-[1.02] z-40'
                    : draggingTableId === table.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-2xl z-30 cursor-grabbing'
                    : 'border-slate-800 hover:border-slate-700 cursor-grab z-10'
                }`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                }}
              >

                {/* Cabecera de la Tabla */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-slate-100 uppercase tracking-wide">
                      {table.name}
                    </span>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectTableForInspection(table);
                    }}
                    title={t('relationalViewer.viewStepTooltip')}
                    className="p-1 rounded text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de Columnas */}
                <div className="divide-y divide-slate-800/60 bg-slate-900/90 text-xs">
                  {table.columns.map(col => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-2">
                        {col.isPrimaryKey && (
                          <span title={t('relationalViewer.pkTooltip')}>
                            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        {col.isForeignKey && !col.isPrimaryKey && (
                          <span title={t('relationalViewer.fkTooltip')}>
                            <Link className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          </span>
                        )}
                        <span
                          className={`font-mono text-xs ${
                            col.isPrimaryKey
                              ? 'text-amber-300 font-bold underline decoration-amber-400 underline-offset-2'
                              : col.isForeignKey
                              ? 'text-cyan-300 font-medium'
                              : 'text-slate-300 font-medium'
                          }`}
                        >
                          {col.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {col.dataType}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pie con indicador de Regla del Algoritmo */}
                <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>{stepLabel?.title}</span>
                  <span className="font-mono text-indigo-400">{stepLabel?.step}</span>
                </div>
              </div>
              );
            })}
          </div>

          {/* Barra Flotante de Controles de Zoom y Pan (Idéntica a la Pestaña EER) */}
          <div
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-slate-900/90 backdrop-blur-sm p-1.5 shadow-2xl border border-slate-800 z-50 text-slate-300"
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleZoomOut}
              title={t('relationalViewer.zoomOut')}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex items-center px-2 text-xs font-mono font-medium text-indigo-400 min-w-[3.2rem] justify-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleZoomIn}
              title={t('relationalViewer.zoomIn')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleResetZoom}
              title={t('relationalViewer.resetZoom')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleFitToContent}
              title={t('relationalViewer.fitContent')}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleAutoLayout}
              title={t('relationalViewer.autoLayout')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>

          </div>
        </>
      )}
    </div>
  );
};
