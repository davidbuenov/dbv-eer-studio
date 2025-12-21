import React, { useRef, useEffect } from 'react';

interface ResizableDividerProps {
  onResize: (newLeftWidth: number) => void;
  minLeftWidth?: number;
  minRightWidth?: number;
}

export function ResizableDivider({ onResize, minLeftWidth = 200, minRightWidth = 300 }: ResizableDividerProps) {
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const divider = dividerRef.current;
    if (!divider) return;

    let isResizing = false;

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLeftWidth = e.clientX - rect.left;

      // Aplicar límites mínimos
      const maxLeftWidth = rect.width - minRightWidth;
      if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
        onResize(newLeftWidth);
      }
    };

    // Event listeners en window para que funcione aunque el mouse salga del divider
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Event listener en el divider para iniciar resize
    divider.addEventListener('mousedown', handleMouseDown as any);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      divider.removeEventListener('mousedown', handleMouseDown as any);
    };
  }, [onResize, minLeftWidth, minRightWidth]);

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <div
        ref={dividerRef}
        className="w-1 bg-slate-300 hover:bg-indigo-500 cursor-col-resize transition-colors hover:shadow-md flex-shrink-0"
        style={{ userSelect: 'none' }}
      />
    </div>
  );
}
