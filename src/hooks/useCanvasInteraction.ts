import { useState, useRef, useCallback, useEffect } from 'react';
import type { NodeData } from '../types';
import { updateNodePosition, screenToCanvasCoordinates } from '../utils/coordinates';
import { collectDragGroup, nodesInsideRect, type Rect } from '../utils/layout';

interface UseCanvasInteractionProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  code: string;
  setCode: (code: string) => void;
}

// Por debajo de este desplazamiento (en px de pantalla) un mousedown+mouseup es un clic, no un arrastre.
const DRAG_THRESHOLD = 3;
const MIN_SCALE = 0.2;
const MAX_SCALE = 2;
// Sensibilidad del zoom con Ctrl+rueda: exponencial para que ratón (saltos de ~100) y pellizco
// de touchpad (deltas pequeños y continuos) den un zoom proporcional y suave.
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const LEFT_BUTTON = 0;
const MIDDLE_BUTTON = 1;

const isToggleModifier = (e: { ctrlKey: boolean; metaKey: boolean }) => e.ctrlKey || e.metaKey;
const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/**
 * Hook para manejar interacciones con el canvas, con la convención de draw.io / Office:
 * - Izquierdo sobre un nodo: seleccionar y arrastrar (Ctrl/Cmd alterna en la selección; los
 *   atributos siguen a su propietario salvo con Alt).
 * - Izquierdo sobre el fondo: rectángulo de selección (Ctrl añade a la selección).
 * - Derecho o central: desplazar el lienzo. Rueda: desplazar. Ctrl + rueda / pellizco: zoom al cursor.
 */
export function useCanvasInteraction({ nodes, setNodes, code, setCode }: UseCanvasInteractionProps) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  // Último nodo pulsado: es el que se edita con F2/Enter y cuya línea se centra en el editor.
  const [primaryNodeId, setPrimaryNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  // Rectángulo de selección en coordenadas del canvas (null si no se está dibujando).
  const [marquee, setMarquee] = useState<Rect | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const codeRef = useRef(code);
  const lastDragPosRef = useRef({ x: 0, y: 0 });
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const movingIdsRef = useRef<Set<string>>(new Set());
  // Distingue un clic de un arrastre: el `click` que llega tras soltar un arrastre no debe
  // alterar la selección (colapsaría un grupo recién movido a un solo nodo).
  const didDragRef = useRef(false);
  const marqueeAddsRef = useRef(false);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // `NodeRenderer` está memoizado y no compara sus callbacks, y la rueda llega por un listener
  // nativo: ambos deben leer el estado vigente de esta ref, o usarían una selección/zoom obsoletos.
  const latestRef = useRef({ selectedNodeIds, nodes, scale, offset });
  useEffect(() => {
    latestRef.current = { selectedNodeIds, nodes, scale, offset };
  });

  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const { scale, offset } = latestRef.current;
    return svg ? screenToCanvasCoordinates(clientX, clientY, svg, scale, offset) : { x: clientX, y: clientY };
  }, []);

  const movedPastThreshold = (e: React.MouseEvent) =>
    Math.abs(e.clientX - dragStartScreenRef.current.x) > DRAG_THRESHOLD ||
    Math.abs(e.clientY - dragStartScreenRef.current.y) > DRAG_THRESHOLD;

  const selectOnly = useCallback((id: string | null) => {
    setSelectedNodeIds(id ? [id] : []);
    setPrimaryNodeId(id);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    // Derecho/central sobre un nodo también desplazan el lienzo: se deja propagar al fondo.
    if (e.button !== LEFT_BUTTON) return;
    e.stopPropagation();
    const { selectedNodeIds, nodes } = latestRef.current;
    lastDragPosRef.current = toCanvas(e.clientX, e.clientY);
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;

    // Pulsar un nodo no seleccionado (sin Ctrl) lo convierte en la selección, para que el
    // arrastre inmediato mueva ese nodo y no el grupo anterior.
    let baseIds = selectedNodeIds;
    if (isToggleModifier(e)) {
      baseIds = selectedNodeIds.includes(id) ? selectedNodeIds : [...selectedNodeIds, id];
    } else if (!selectedNodeIds.includes(id)) {
      baseIds = [id];
      selectOnly(id);
    }

    movingIdsRef.current = collectDragGroup(baseIds, nodes, !e.altKey);
    setDraggedNodeId(id);
  }, [selectOnly, toCanvas]);

  /**
   * Pulsación sobre el fondo. `allowMarquee` es false cuando hay una herramienta de inserción
   * activa: entonces el clic izquierdo coloca un elemento en lugar de dibujar el rectángulo.
   */
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent, allowMarquee: boolean) => {
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;

    if (e.button === LEFT_BUTTON) {
      if (!allowMarquee) return;
      const start = toCanvas(e.clientX, e.clientY);
      marqueeAddsRef.current = isToggleModifier(e);
      setMarquee({ x1: start.x, y1: start.y, x2: start.x, y2: start.y });
    } else {
      // Evita el autoscroll del botón central de Windows y el arrastre nativo de imágenes.
      if (e.button === MIDDLE_BUTTON) e.preventDefault();
      setIsPanning(true);
    }
  }, [toCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNodeId) {
      if (movedPastThreshold(e)) didDragRef.current = true;
      if (!didDragRef.current) return;

      const { x, y } = toCanvas(e.clientX, e.clientY);
      const deltaX = x - lastDragPosRef.current.x;
      const deltaY = y - lastDragPosRef.current.y;
      const moving = movingIdsRef.current;

      setNodes(prev => prev.map(n => (moving.has(n.id) ? { ...n, x: n.x + deltaX, y: n.y + deltaY } : n)));
      lastDragPosRef.current = { x, y };
    } else if (marquee) {
      const { x, y } = toCanvas(e.clientX, e.clientY);
      setMarquee(prev => (prev ? { ...prev, x2: x, y2: y } : prev));
    } else if (isPanning) {
      setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  }, [draggedNodeId, marquee, isPanning, setNodes, toCanvas]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggedNodeId && didDragRef.current) {
      // Cada nodo movido reescribe solo su propia línea, así que el orden no importa.
      const newCode = nodes
        .filter(n => movingIdsRef.current.has(n.id))
        .reduce((acc, n) => updateNodePosition(acc, n, n.x, n.y), codeRef.current);
      setCode(newCode);
    }

    if (marquee) {
      // Un clic sin arrastrar en el fondo vacía la selección (salvo con Ctrl, que conserva).
      const inside = movedPastThreshold(e) ? nodesInsideRect(marquee, nodes) : [];
      const base = marqueeAddsRef.current ? latestRef.current.selectedNodeIds : [];
      const next = [...new Set([...base, ...inside])];
      setSelectedNodeIds(next);
      setPrimaryNodeId(next.length === 1 ? next[0]! : null);
      setMarquee(null);
    }

    setDraggedNodeId(null);
    setIsPanning(false);
  }, [draggedNodeId, marquee, nodes, setCode]);

  const handleNodeClick = useCallback((e: React.MouseEvent, id: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (isToggleModifier(e)) {
      const { selectedNodeIds } = latestRef.current;
      const isSelected = selectedNodeIds.includes(id);
      setSelectedNodeIds(isSelected ? selectedNodeIds.filter(s => s !== id) : [...selectedNodeIds, id]);
      setPrimaryNodeId(isSelected ? null : id);
    } else {
      selectOnly(id);
    }
  }, [selectOnly]);

  /**
   * Rueda sobre el canvas (listener nativo no pasivo: necesita `preventDefault` para que el
   * navegador o la WebView no hagan scroll de la página ni amplíen la ventana entera).
   * Ctrl + rueda (o pellizco de touchpad, que llega como Ctrl + rueda) = zoom manteniendo fijo
   * el punto bajo el cursor. Sin Ctrl = desplazar; Shift convierte la rueda vertical en horizontal.
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();

    const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? svg.clientHeight : 1;
    const { scale, offset } = latestRef.current;
    let nextScale = scale;
    let nextOffset = offset;

    if (e.ctrlKey || e.metaKey) {
      const rect = svg.getBoundingClientRect();
      const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      nextScale = clampScale(scale * Math.exp(-e.deltaY * unit * WHEEL_ZOOM_SENSITIVITY));
      const ratio = nextScale / scale;
      nextOffset = { x: cursor.x - (cursor.x - offset.x) * ratio, y: cursor.y - (cursor.y - offset.y) * ratio };
    } else {
      const horizontalFromShift = e.shiftKey && e.deltaX === 0;
      const dx = (horizontalFromShift ? e.deltaY : e.deltaX) * unit;
      const dy = (horizontalFromShift ? 0 : e.deltaY) * unit;
      nextOffset = { x: offset.x - dx, y: offset.y - dy };
    }

    // Se actualiza la ref al instante: varios eventos de rueda pueden llegar antes del siguiente
    // render y cada uno debe partir del resultado del anterior, no del último estado pintado.
    latestRef.current = { ...latestRef.current, scale: nextScale, offset: nextOffset };
    setScale(nextScale);
    setOffset(nextOffset);
  }, []);

  return {
    draggedNodeId,
    selectedNodeIds,
    primaryNodeId,
    selectOnly,
    marquee,
    isPanning,
    scale,
    setScale,
    offset,
    setOffset,
    svgRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeClick,
    handleCanvasMouseDown,
    handleWheel,
  };
}
