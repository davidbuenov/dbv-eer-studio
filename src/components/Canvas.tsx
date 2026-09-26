import { useEffect, useRef } from 'react';
import type { NodeData, LinkData } from '../types';
import type { Rect } from '../utils/layout';
import { NodeRenderer } from './NodeRenderer';
import { LinkRenderer } from './LinkRenderer';
import { Plus, Minus, RotateCcw, Maximize2 } from 'lucide-react';
import { useLanguage } from '../i18n/language';

interface CanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  nodes: NodeData[];
  links: LinkData[];
  scale: number;
  offset: { x: number; y: number };
  selectedTool: string | null;
  draggedNodeId: string | null;
  selectedNodeIds: readonly string[];
  /** Rectángulo de selección en curso, en coordenadas del canvas. */
  marquee: Rect | null;
  isPanning: boolean;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onWheel: (e: WheelEvent) => void;
  onNodeMouseDown: (e: React.MouseEvent, id: string) => void;
  onNodeClick: (e: React.MouseEvent, id: string) => void;
  onNodeDoubleClick: (id: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
}

/**
 * Componente Canvas que encapsula el renderizado SVG del diagrama
 *
 * Responsabilidades:
 * - Renderizar todos los nodos con NodeRenderer
 * - Renderizar todos los enlaces con LinkRenderer
 * - Manejar eventos de mouse en el canvas
 * - Aplicar transformaciones de zoom y pan
 *
 * Este componente permite separar la lógica de rendering de la lógica de estado,
 * facilitando futuras exportaciones a otros formatos (PNG, PDF, etc.)
 */
export function Canvas({
  svgRef,
  nodes,
  links,
  scale,
  offset,
  selectedTool,
  draggedNodeId,
  selectedNodeIds,
  marquee,
  isPanning,
  onMouseMove,
  onMouseUp,
  onClick,
  onMouseDown,
  onWheel,
  onNodeMouseDown,
  onNodeClick,
  onNodeDoubleClick,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent
}: CanvasProps) {
  // React registra `onWheel` como pasivo y no permite `preventDefault`: sin él, Ctrl + rueda
  // ampliaría toda la ventana en lugar del diagrama. Se usa un listener nativo no pasivo, que se
  // vuelve a registrar si el SVG se remonta (al volver de otra pestaña).
  const onWheelRef = useRef(onWheel);
  useEffect(() => {
    onWheelRef.current = onWheel;
  });
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const listener = (e: WheelEvent) => onWheelRef.current(e);
    svg.addEventListener('wheel', listener, { passive: false });
    return () => svg.removeEventListener('wheel', listener);
  }, [svgRef]);

  const cursorClass = isPanning ? 'cursor-grabbing' : selectedTool ? 'cursor-crosshair' : 'cursor-default';

  return (
    <div
      className={`relative h-full w-full bg-slate-50 overflow-hidden select-none ${cursorClass}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={onClick}
      // El botón derecho desplaza el lienzo: su menú contextual aparecería al soltar.
      onContextMenu={e => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        className="h-full w-full"
      >
        {/* Aplicar transformación de zoom y pan */}
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {/* Renderizar todos los enlaces primero (detrás de los nodos) */}
          {links.map((link) => (
            <LinkRenderer key={`${link.source}-${link.target}`} link={link} nodes={nodes} />
          ))}

          {/* Renderizar todos los nodos */}
          {nodes.map((node) => (
            <NodeRenderer
              key={node.id}
              node={node}
              isDragged={draggedNodeId === node.id}
              isSelected={selectedNodeIds.includes(node.id)}
              onMouseDown={onNodeMouseDown}
              onClick={onNodeClick}
              onDoubleClick={onNodeDoubleClick}
            />
          ))}

          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(99, 102, 241, 0.08)"
              stroke="#6366f1"
              strokeWidth={1}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {/* Controles de zoom y pan */}
      <div className="absolute bottom-4 right-4 flex gap-2 rounded-lg bg-white p-1 shadow-lg border border-slate-200 z-20" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <ZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetZoom={onResetZoom}
          onFitToContent={onFitToContent}
        />
      </div>
    </div>
  );
}

/**
 * Componente de controles de zoom que se muestran en el canvas
 * Los callbacks reales se pasan desde el padre
 */
interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
}

function ZoomControls({ scale, onZoomIn, onZoomOut, onResetZoom, onFitToContent }: ZoomControlsProps) {
  const { t } = useLanguage();
  // Los handlers se pasan a través del padre para mantener control centralizado
  return (
    <>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        onClick={onZoomOut}
        title={t('canvas.zoomOut')}
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="flex items-center px-2 text-xs font-medium text-slate-500 min-w-[3rem] justify-center">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        onClick={onZoomIn}
        title={t('canvas.zoomIn')}
      >
        <Plus className="h-3 w-3" />
      </button>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        onClick={onResetZoom}
        title={t('canvas.resetZoom')}
      >
        <RotateCcw className="h-3 w-3" />
      </button>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        onClick={onFitToContent}
        title={t('canvas.fitContent')}
      >
        <Maximize2 className="h-3 w-3" />
      </button>
    </>
  );
}
