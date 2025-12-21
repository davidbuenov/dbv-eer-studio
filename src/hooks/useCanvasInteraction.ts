import { useState, useRef, useCallback, useEffect } from 'react';
import type { NodeData } from '../types';
import { updateNodePosition, screenToCanvasCoordinates } from '../utils/coordinates';

interface UseCanvasInteractionProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  code: string;
  setCode: (code: string) => void;
}

/**
 * Hook para manejar interacciones con el canvas (drag & drop, zoom, pan)
 */
export function useCanvasInteraction({ nodes, setNodes, code, setCode }: UseCanvasInteractionProps) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const codeRef = useRef(code);

  // Mantener codeRef actualizado
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggedNodeId(id);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNodeId) {
      const svg = svgRef.current;
      if (!svg) return;
      
      const { x, y } = screenToCanvasCoordinates(
        e.clientX,
        e.clientY,
        svg,
        scale,
        offset
      );

      setNodes(prev => prev.map(n => 
        n.id === draggedNodeId ? { ...n, x, y } : n
      ));
    } else if (isDraggingCanvas) {
      setOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  }, [draggedNodeId, isDraggingCanvas, scale, offset, setNodes]);

  const handleMouseUp = useCallback(() => {
    if (draggedNodeId) {
      const node = nodes.find(n => n.id === draggedNodeId);
      if (node) {
        const newCode = updateNodePosition(codeRef.current, node, node.x, node.y);
        setCode(newCode);
      }
      setDraggedNodeId(null);
    }
    setIsDraggingCanvas(false);
  }, [draggedNodeId, nodes, setCode]);

  const handleCanvasMouseDown = useCallback(() => {
    setIsDraggingCanvas(true);
  }, []);

  return {
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
  };
}
