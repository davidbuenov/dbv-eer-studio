// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useState, useRef, useCallback } from 'react';
import { Key, Link, BookOpen, Database, Plus, Minus, RotateCcw, Maximize2, LayoutGrid } from 'lucide-react';

import type { RelationalSchema, RelationalTable } from '../../types/relational';

interface RelationalViewerProps {
  schema: RelationalSchema;
  onTablePositionChange: (tableId: string, x: number, y: number) => void;
  onSelectTableForInspection: (table: RelationalTable) => void;
}

type Side = 'top' | 'bottom' | 'left' | 'right';

export const RelationalViewer: React.FC<RelationalViewerProps> = ({
  schema,
  onTablePositionChange,
  onSelectTableForInspection,
}) => {
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

  // Constantes de dimensiones de tarjetas de tablas
  const CARD_WIDTH = 288; // 18rem (w-72)
  const HEADER_HEIGHT = 41;
  const ROW_HEIGHT = 33;
  const FOOTER_HEIGHT = 26;

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
    const maxY = Math.max(...schema.tables.map(t => t.y + HEADER_HEIGHT + t.columns.length * ROW_HEIGHT + FOOTER_HEIGHT));

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
  }, [schema.tables, onTablePositionChange, CARD_WIDTH]);

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

  /**
   * Calcula la altura total estimada de una tarjeta de tabla
   */
  const getTableHeight = (table: RelationalTable): number => {
    return HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + FOOTER_HEIGHT;
  };

  /**
   * Calcula las coordenadas exactas de un puerto de anclaje (3 puertos por lado: 25%, 50%, 75%)
   */
  const getAnchorPortPosition = (
    table: RelationalTable,
    side: Side,
    slotIndex: number = 1
  ): { x: number; y: number; normalX: number; normalY: number } => {
    const height = getTableHeight(table);
    const slots = [0.25, 0.5, 0.75];
    const ratio = slots[slotIndex % 3] ?? 0.5;

    switch (side) {
      case 'top':
        return {
          x: table.x + CARD_WIDTH * ratio,
          y: table.y,
          normalX: 0,
          normalY: -1,
        };
      case 'bottom':
        return {
          x: table.x + CARD_WIDTH * ratio,
          y: table.y + height,
          normalX: 0,
          normalY: 1,
        };
      case 'left':
        return {
          x: table.x,
          y: table.y + height * ratio,
          normalX: -1,
          normalY: 0,
        };
      case 'right':
      default:
        return {
          x: table.x + CARD_WIDTH,
          y: table.y + height * ratio,
          normalX: 1,
          normalY: 0,
        };
    }
  };

  /**
   * Determina los lados de conexión óptimos (Top, Bottom, Left, Right) entre dos tablas
   */
  const getOptimalSides = (
    sourceTable: RelationalTable,
    targetTable: RelationalTable
  ): { sourceSide: Side; targetSide: Side } => {
    const sourceHeight = getTableHeight(sourceTable);
    const targetHeight = getTableHeight(targetTable);

    const sourceCenterX = sourceTable.x + CARD_WIDTH / 2;
    const sourceCenterY = sourceTable.y + sourceHeight / 2;

    const targetCenterX = targetTable.x + CARD_WIDTH / 2;
    const targetCenterY = targetTable.y + targetHeight / 2;

    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;

    if (Math.abs(dy) > Math.abs(dx) * 1.1) {
      if (dy > 0) {
        return { sourceSide: 'bottom', targetSide: 'top' };
      } else {
        return { sourceSide: 'top', targetSide: 'bottom' };
      }
    } else {
      if (dx > 0) {
        return { sourceSide: 'right', targetSide: 'left' };
      } else {
        return { sourceSide: 'left', targetSide: 'right' };
      }
    }
  };

  // Tamaño total del canvas SVG interno
  const maxX = Math.max(3000, ...schema.tables.map(t => t.x + 800));
  const maxY = Math.max(2400, ...schema.tables.map(t => t.y + 800));

  // Contador global de puertos utilizados
  const sidePortUsage: Record<string, number> = {};

  const getNextPortIndex = (tableId: string, side: Side): number => {
    const key = `${tableId}_${side}`;
    const count = sidePortUsage[key] ?? 0;
    sidePortUsage[key] = count + 1;
    return count;
  };

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
          <p className="text-sm font-medium">No hay tablas relacionales generadas aún.</p>
          <p className="text-xs text-slate-600">
            Diseña un diagrama en la pestaña EER para convertirlo automáticamente.
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
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
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
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#818cf8" />
                </marker>
              </defs>

              {schema.tables.flatMap(sourceTableRaw => {
                const sourceTable = { ...sourceTableRaw, ...getEffectivePos(sourceTableRaw) };
                return sourceTableRaw.foreignKeys.map(fk => {
                  const targetTableRaw = schema.tables.find(
                    t => t.name.toUpperCase() === fk.targetTableName.toUpperCase()
                  );

                  if (!targetTableRaw) return null;
                  const targetTable = { ...targetTableRaw, ...getEffectivePos(targetTableRaw) };

                  const fkColName = fk.sourceColumnNames[0] || 'FK';
                  const fkColumnObj = sourceTable.columns.find(
                    c => c.name.toUpperCase() === fkColName.toUpperCase()
                  );

                  const { sourceSide, targetSide } = getOptimalSides(sourceTable, targetTable);
                  const sourceSlot = getNextPortIndex(sourceTable.id, sourceSide);
                  const targetSlot = getNextPortIndex(targetTable.id, targetSide);

                  const sourceAnchor = getAnchorPortPosition(sourceTable, sourceSide, sourceSlot);
                  const targetAnchor = getAnchorPortPosition(targetTable, targetSide, targetSlot);

                  const isIdentifying = fkColumnObj ? fkColumnObj.isPrimaryKey : false;
                  const lineColor = isIdentifying ? '#818cf8' : '#38bdf8';
                  const markerId = isIdentifying ? 'url(#fk-arrow-solid)' : 'url(#fk-arrow-dashed)';
                  const dashArray = isIdentifying ? undefined : '6,4';

                  const dist = Math.hypot(
                    targetAnchor.x - sourceAnchor.x,
                    targetAnchor.y - sourceAnchor.y
                  );
                  const curvature = Math.min(160, Math.max(50, dist * 0.4));

                  const ctrlX1 = sourceAnchor.x + sourceAnchor.normalX * curvature;
                  const ctrlY1 = sourceAnchor.y + sourceAnchor.normalY * curvature;
                  const ctrlX2 = targetAnchor.x + targetAnchor.normalX * curvature;
                  const ctrlY2 = targetAnchor.y + targetAnchor.normalY * curvature;

                  const pathData = `M ${sourceAnchor.x} ${sourceAnchor.y} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${targetAnchor.x} ${targetAnchor.y}`;
                  const midX = (sourceAnchor.x + targetAnchor.x) / 2;
                  const midY = (sourceAnchor.y + targetAnchor.y) / 2;
                  const labelText = `${fkColName} ➔ ${targetTable.name}`;
                  const textWidth = Math.max(80, Math.round(labelText.length * 6.5 + 20));
                  const rectX = -textWidth / 2;




                  const isConnectedToHover =
                    hoveredTableId === sourceTable.id || hoveredTableId === targetTable.id;
                  const isHoverActive = hoveredTableId !== null;
                  const strokeOpacity = isHoverActive ? (isConnectedToHover ? 1 : 0.15) : 0.85;
                  const strokeWidth = isConnectedToHover ? 3.5 : 2;

                  return (
                    <g key={`${sourceTable.id}_${fk.id}`} className="transition-opacity duration-200" style={{ opacity: strokeOpacity }}>
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth={strokeWidth + 2}
                        strokeOpacity="0.25"
                      />
                      <path
                        d={pathData}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                        markerEnd={markerId}
                      />
                      <circle cx={sourceAnchor.x} cy={sourceAnchor.y} r={isConnectedToHover ? 4.5 : 3} fill={lineColor} />
                      <circle cx={targetAnchor.x} cy={targetAnchor.y} r={isConnectedToHover ? 4.5 : 3} fill={lineColor} />

                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={rectX}
                          y="-12"
                          width={textWidth}
                          height="24"
                          rx="12"
                          fill="#090d16"
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
                          {labelText}
                        </text>
                      </g>
                    </g>
                  );
                });
              })}
            </svg>

            {/* Tarjetas Visuales de las Tablas */}
            {schema.tables.map(table => (
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
                  left: `${getEffectivePos(table).x}px`,
                  top: `${getEffectivePos(table).y}px`,
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
                    title="Ver explicación del paso formal"
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
                          <span title="Primary Key (PK - Subrayado)">
                            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        {col.isForeignKey && !col.isPrimaryKey && (
                          <span title="Foreign Key (FK - Referencia)">
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
                  <span>{table.stepTrace.stepTitle}</span>
                  <span className="font-mono text-indigo-400">Paso {table.stepTrace.stepNumber}</span>
                </div>
              </div>
            ))}
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
              title="Alejar Zoom"
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
              title="Acercar Zoom"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleResetZoom}
              title="Reiniciar Zoom (100%)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleFitToContent}
              title="Ajustar al contenido"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              onClick={handleAutoLayout}
              title="Reorganizar tablas en cuadrícula"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>

          </div>
        </>
      )}
    </div>
  );
};
