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
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const codeRef = useRef(code);
  const lastDragPosRef = useRef({ x: 0, y: 0 });

  // Mantener codeRef actualizado
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Detectar si Shift está pulsado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (svg) {
      const { x, y } = screenToCanvasCoordinates(
        e.clientX,
        e.clientY,
        svg,
        scale,
        offset
      );
      lastDragPosRef.current = { x, y };
    }
    setDraggedNodeId(id);
  }, [scale, offset]);

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

      // Calcular desplazamiento
      const deltaX = x - lastDragPosRef.current.x;
      const deltaY = y - lastDragPosRef.current.y;

      setNodes(prev => prev.map(n => {
        if (n.id === draggedNodeId) {
          // Mover el nodo seleccionado
          return { ...n, x, y };
        } else if (
          isShiftPressed && 
          ['attribute', 'key_attribute', 'derived_attribute', 'multivalued_attribute'].includes(n.type) && 
          n.parentEntity === draggedNodeId
        ) {
          // Si Shift está pulsado, mover también los atributos asociados
          return { ...n, x: n.x + deltaX, y: n.y + deltaY };
        }
        return n;
      }));

      lastDragPosRef.current = { x, y };
    } else if (isDraggingCanvas) {
      setOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  }, [draggedNodeId, isDraggingCanvas, scale, offset, setNodes, isShiftPressed]);

  const handleMouseUp = useCallback(() => {
    if (draggedNodeId) {
      const draggedNode = nodes.find(n => n.id === draggedNodeId);
      if (draggedNode) {
        let newCode = updateNodePosition(codeRef.current, draggedNode, draggedNode.x, draggedNode.y);
        
        // Si Shift estaba pulsado, también actualizar posiciones de atributos
        if (isShiftPressed) {
          const attributesOfNode = nodes.filter(
            n => ['attribute', 'key_attribute', 'derived_attribute', 'multivalued_attribute'].includes(n.type) && 
                 n.parentEntity === draggedNodeId
          );
          
          for (const attr of attributesOfNode) {
            newCode = updateNodePosition(newCode, attr, attr.x, attr.y);
          }
        }
        
        setCode(newCode);
      }
      setDraggedNodeId(null);
    }
    setIsDraggingCanvas(false);
  }, [draggedNodeId, nodes, setCode, isShiftPressed]);

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
    handleCanvasMouseDown,
    isShiftPressed
  };
}
