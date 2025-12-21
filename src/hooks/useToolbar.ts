import { useState, useCallback } from 'react';
import { screenToCanvasCoordinates } from '../utils/coordinates';

/**
 * Hook para manejar el estado de la barra de herramientas
 */
export function useToolbar(
  svgRef: React.RefObject<SVGSVGElement | null>,
  scale: number,
  offset: { x: number; y: number },
  draggedNodeId: string | null
) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [clickX, setClickX] = useState(0);
  const [clickY, setClickY] = useState(0);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!selectedTool || draggedNodeId) return;
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const { x, y } = screenToCanvasCoordinates(
      e.clientX,
      e.clientY,
      svg,
      scale,
      offset
    );

    setClickX(Math.round(x));
    setClickY(Math.round(y));
    
    return { x: Math.round(x), y: Math.round(y) };
  }, [selectedTool, draggedNodeId, svgRef, scale, offset]);

  const resetTool = useCallback(() => {
    setSelectedTool(null);
  }, []);

  return {
    selectedTool,
    setSelectedTool,
    clickX,
    clickY,
    handleCanvasClick,
    resetTool
  };
}
