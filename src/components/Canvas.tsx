import type { NodeData, LinkData } from '../types';
import { NodeRenderer } from './NodeRenderer';
import { LinkRenderer } from './LinkRenderer';

interface CanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  nodes: NodeData[];
  links: LinkData[];
  scale: number;
  offset: { x: number; y: number };
  selectedTool: string | null;
  draggedNodeId: string | null;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: () => void;
  onNodeMouseDown: (e: React.MouseEvent, id: string) => void;
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
  onMouseMove,
  onMouseUp,
  onClick,
  onMouseDown,
  onNodeMouseDown
}: CanvasProps) {
  return (
    <div 
      className={`relative flex-1 bg-slate-50 overflow-hidden ${selectedTool ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={onClick}
    >
      <svg
        ref={svgRef}
        viewBox="-3000 -3000 6000 6000"
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
              onMouseDown={onNodeMouseDown}
            />
          ))}
        </g>
      </svg>

      {/* Controles de zoom y pan */}
      <div className="absolute bottom-4 right-4 flex gap-2 rounded-lg bg-white p-1 shadow-lg border border-slate-200 z-20" onMouseDown={e => e.stopPropagation()}>
        <ZoomControls scale={scale} />
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
}

function ZoomControls({ scale }: ZoomControlsProps) {
  // Los handlers se pasan a través del padre para mantener control centralizado
  return (
    <>
      <span className="flex items-center px-2 text-xs font-medium text-slate-500 min-w-[3rem] justify-center">
        {Math.round(scale * 100)}%
      </span>
    </>
  );
}
