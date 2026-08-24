import type { NodeData, LinkData } from '../types';
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
  selectedNodeId: string | null;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: () => void;
  onNodeMouseDown: (e: React.MouseEvent, id: string) => void;
  onNodeClick: (id: string) => void;
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
  selectedNodeId,
  onMouseMove,
  onMouseUp,
  onClick,
  onMouseDown,
  onNodeMouseDown,
  onNodeClick,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent
}: CanvasProps) {
  return (
    <div 
      className={`relative h-full w-full bg-slate-50 overflow-hidden ${selectedTool ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={onClick}
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
              isSelected={selectedNodeId === node.id}
              onMouseDown={onNodeMouseDown}
              onClick={onNodeClick}
            />
          ))}
        </g>
      </svg>

      {/* Controles de zoom y pan */}
      <div className="absolute bottom-4 right-4 flex gap-2 rounded-lg bg-white p-1 shadow-lg border border-slate-200 z-20" onMouseDown={e => e.stopPropagation()}>
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
