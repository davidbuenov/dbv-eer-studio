import { useRef, useEffect } from 'react';

interface ResizableDividerProps {
  onResize: (newWidth: number) => void;
  minLeftWidth?: number;
  minRightWidth?: number;
}

/**
 * Componente ResizableDivider - Línea divisoria redimensionable
 * 
 * Permite ajustar dinámicamente el ancho del panel izquierdo arrastrando
 * la línea divisoria. Respeta límites mínimos para ambos paneles.
 */
export function ResizableDivider({ 
  onResize, 
  minLeftWidth = 200, 
  minRightWidth = 300 
}: ResizableDividerProps) {
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const divider = dividerRef.current;
    if (!divider) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      
      const startX = e.clientX;
      const container = divider.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const startWidth = parseInt(container.children[0].getBoundingClientRect().width.toString());

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = startWidth + delta;
        const maxWidth = containerRect.width - minRightWidth;

        if (newWidth >= minLeftWidth && newWidth <= maxWidth) {
          onResize(newWidth);
        }
      };

      const handleMouseUp = () => {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    divider.addEventListener('mousedown', handleMouseDown);

    return () => {
      divider.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onResize, minLeftWidth, minRightWidth]);

  return (
    <div
      ref={dividerRef}
      className="w-1 bg-slate-300 hover:bg-indigo-500 cursor-col-resize transition-colors hover:shadow-md flex-shrink-0"
      style={{ userSelect: 'none' }}
    />
  );
}
