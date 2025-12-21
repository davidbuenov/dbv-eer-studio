/**
 * EER Studio - Enhanced Entity-Relationship Diagram Editor
 * Copyright (c) 2025 David Bueno Vallejo
 * 
 * Developed with the assistance of Gemini and GitHub Copilot AI
 * 
 * This software is provided as-is, without warranty of any kind.
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { BookOpen, Code, Share2, HelpCircle, X, Maximize2, ZoomIn, ZoomOut, Info, Square, SquareDashed, Diamond, Zap, Circle, Trash2, GitBranch, Layers } from 'lucide-react';
import type { NodeData, LinkData, EERDiagramerHandle, NodeType } from './types';
import { SAMPLE_CODE, COORD_REGEX, CANVAS_CONFIG, NODE_STYLES } from './constants';

/**
 * PARSER: Convierte el código DSL en estructuras de datos visuales
 * 
 * @description
 * Analiza el código línea por línea y extrae:
 * - Nodos (entidades, relaciones, atributos, especializaciones, uniones)
 * - Enlaces (conexiones entre nodos con cardinalidad y participación)
 * - Coordenadas (x, y) opcionales para posicionamiento manual
 * 
 * Si no hay coordenadas, usa un algoritmo de espiral para distribución automática.
 * Mantiene el índice de línea original para permitir actualización bidireccional.
 * 
 * @param code - Código DSL del diagrama EER
 * @returns Objeto con arrays de nodos y enlaces
 * 
 * @example
 * parseCode("ent EMPLEADO (100, 200)\natt Nombre -> EMPLEADO")
 * // Returns: { nodes: [...], links: [...] }
 */
const parseCode = (code: string) => {
  const lines = code.split('\n');
  const newNodes: NodeData[] = [];
  const newLinks: LinkData[] = [];
  const existingIds = new Set<string>(); // Para rastrear IDs y evitar duplicados
  
  let angle = 0;
  const { CENTER_X, CENTER_Y, SPIRAL_RADIUS, SPIRAL_INCREMENT, SPIRAL_GROWTH } = CANVAS_CONFIG;

  // Helper para posición por defecto (espiral) si no hay coords
  const getDefaultPos = () => {
    angle += SPIRAL_INCREMENT;
    const r = SPIRAL_RADIUS + (angle * SPIRAL_GROWTH);
    return {
      x: Math.round(CENTER_X + Math.cos(angle) * r),
      y: Math.round(CENTER_Y + Math.sin(angle) * r)
    };
  };

  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('//')) return;

    // Extraer coordenadas si existen
    let x: number | null = null;
    let y: number | null = null;
    const coordMatch = cleanLine.match(COORD_REGEX);
    if (coordMatch) {
      x = parseInt(coordMatch[1], 10);
      y = parseInt(coordMatch[2], 10);
    }

    // Quitar coordenadas para procesar el comando limpio
    const lineWithoutCoords = cleanLine.replace(COORD_REGEX, '').trim();
    const parts = lineWithoutCoords.split(/\s+/);
    const command = parts[0].toLowerCase();

    // Comandos de Nodos
    if (['ent', 'weak_ent', 'rel', 'ident_rel', 'att', 'key_att', 'derived_att', 'multivalued_attribute'].includes(command)) {
      const label = parts[1];
      
      // Generar ID único. 
      const isAttribute = ['att', 'key_att', 'derived_att', 'multivalued_attribute'].includes(command);
      let id = label;
      
      if (isAttribute || existingIds.has(id)) {
        id = `${label}_${index}`;
      }
      existingIds.add(id);
      
      let finalX = x;
      let finalY = y;
      
      if (finalX === null || finalY === null) {
        const def = getDefaultPos();
        finalX = def.x;
        finalY = def.y;
      }

      let type: NodeType = 'entity';
      if (command === 'weak_ent') type = 'weak_entity';
      if (command === 'rel') type = 'relationship';
      if (command === 'ident_rel') type = 'identifying_relationship';
      if (command === 'att') type = 'attribute';
      if (command === 'key_att') type = 'key_attribute';
      if (command === 'derived_att') type = 'derived_attribute';
      if (command === 'multivalued_attribute') type = 'multivalued_attribute';

      newNodes.push({ id, type, label, x: finalX, y: finalY, lineIndex: index });

      // Atajo para atributo: att Nombre -> Entidad
      if (parts[2] === '->' && parts[3]) {
        newLinks.push({ source: parts[3], target: id, label: '', style: 'solid' });
      }
    }
    // Especialización / Unión
    else if (['spec', 'union'].includes(command)) {
      const meta = parts[1] || (command === 'union' ? 'u' : 'd'); 
      
      let id = parts[1] || `spec_${index}`;
      if (existingIds.has(id)) {
        id = `${id}_${index}`;
      }
      existingIds.add(id);

      let finalX = x;
      let finalY = y;

      if (finalX === null || finalY === null) {
        const def = getDefaultPos();
        finalX = def.x;
        finalY = def.y;
      }

      newNodes.push({ 
        id, 
        type: command === 'union' ? 'union' : 'specialization', 
        label: meta, 
        x: finalX, 
        y: finalY, 
        meta,
        lineIndex: index
      });

      if (parts[2] === '->' && parts[3]) {
        // Conexión doble a la superclase
        newLinks.push({ source: parts[3], target: id, label: '', style: 'double' });
      }
    }
    // Conexiones
    else if (command === 'link') {
      const source = parts[1];
      const target = parts[2];
      let label = '';
      let style: 'solid' | 'double' = 'solid';

      const labelMatch = lineWithoutCoords.match(/"([^"]+)"/);
      if (labelMatch) label = labelMatch[1];

      if (lineWithoutCoords.includes('[total]') || lineWithoutCoords.includes('[double]')) {
        style = 'double';
      }

      if (source && target) {
        newLinks.push({ source, target, label, style });
      }
    }
  });

  return { nodes: newNodes, links: newLinks };
};

function EERDiagrammer(_: unknown, ref: React.Ref<EERDiagramerHandle>) {
  // ==========================================
  // ESTADO DEL COMPONENTE
  // ==========================================
  
  // Estado del código y diagrama
  const [code, setCode] = useState(SAMPLE_CODE);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Estados de UI y modales
  const [showHelp, setShowHelp] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastFileHandle, setLastFileHandle] = useState<unknown | null>(null);
  
  // Estados de la barra de herramientas
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  
  // Propiedades del elemento actual (modal)
  const [elementType, setElementType] = useState<string | null>(null);
  const [elementName, setElementName] = useState('');
  const [elementType2, setElementType2] = useState('simple'); // Para atributos: simple, key, derived, multivalued
  const [selectedEntity, setSelectedEntity] = useState(''); // Para atributos
  const [selectedEntity1, setSelectedEntity1] = useState(''); // Para relaciones
  const [selectedEntity2, setSelectedEntity2] = useState(''); // Para relaciones
  const [cardinalityE1, setCardinalityE1] = useState('1'); // Cardinalidad entidad 1
  const [cardinalityE2, setCardinalityE2] = useState('N'); // Cardinalidad entidad 2
  const [customCard1, setCustomCard1] = useState(''); // Cardinalidad personalizada E1
  const [customCard2, setCustomCard2] = useState(''); // Cardinalidad personalizada E2
  const [totalE1, setTotalE1] = useState(false); // Participación total entidad 1
  const [totalE2, setTotalE2] = useState(false); // Participación total entidad 2
  const [clickX, setClickX] = useState(0); // Coordenada X del último click
  const [clickY, setClickY] = useState(0); // Coordenada Y del último click
  const [specType, setSpecType] = useState('d'); // Tipo de especialización: d (disjunta) o o (solapada)
  const [specSuperclass, setSpecSuperclass] = useState(''); // Superclase para especialización
  const [specSubclasses, setSpecSubclasses] = useState<string[]>([]); // Subclases para especialización
  const [unionName, setUnionName] = useState(''); // Nombre de la unión
  const [unionSuperclasses, setUnionSuperclasses] = useState<string[]>([]); // Superclases para unión
  const [unionCategory, setUnionCategory] = useState(''); // Categoría para unión
  
  const svgRef = useRef<SVGSVGElement>(null);
  const codeRef = useRef(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useImperativeHandle(ref, () => ({
    getCode: () => codeRef.current,
    setCode: (c: string) => setCode(c),
  }));


  useEffect(() => {
    const timer = setTimeout(() => {
      const { nodes: parsedNodes, links: parsedLinks } = parseCode(code);
      setNodes(parsedNodes);
      setLinks(parsedLinks);
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  /**
   * Actualiza las coordenadas de un nodo en el código fuente
   * 
   * @description
   * Función clave para la edición bidireccional:
   * 1. Localiza el nodo por ID
   * 2. Encuentra su línea original en el código
   * 3. Actualiza o añade las coordenadas (x, y)
   * 4. Regenera el código completo
   * 
   * Esto permite que mover nodos visualmente actualice el código automáticamente.
   */
  const updateCodePosition = (nodeId: string, newX: number, newY: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const lines = codeRef.current.split('\n');
    const lineIndex = node.lineIndex;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      let line = lines[lineIndex];
      if (COORD_REGEX.test(line)) {
        line = line.replace(COORD_REGEX, '');
      }
      line = line.trimEnd();
      const newLine = `${line} (${Math.round(newX)}, ${Math.round(newY)})`;
      
      lines[lineIndex] = newLine;
      const newCode = lines.join('\n');
      
      setCode(newCode);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggedNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const svg = svgRef.current;
      if (!svg) return;
      const CTM = svg.getScreenCTM();
      if (!CTM) return;
      
      const x = (e.clientX - CTM.e) / CTM.a / scale - offset.x / scale;
      const y = (e.clientY - CTM.f) / CTM.d / scale - offset.y / scale;

      setNodes(prev => prev.map(n => 
        n.id === draggedNodeId ? { ...n, x, y } : n
      ));
    } else if (isDraggingCanvas) {
      setOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeId) {
      const node = nodes.find(n => n.id === draggedNodeId);
      if (node) {
        updateCodePosition(node.id, node.x, node.y);
      }
      setDraggedNodeId(null);
    }
    setIsDraggingCanvas(false);
  };

  /**
   * Maneja clicks en el canvas cuando hay una herramienta seleccionada
   * 
   * @description
   * Flujo de inserción de elementos:
   * 1. Convierte coordenadas de pantalla a coordenadas del canvas (considerando zoom/pan)
   * 2. Guarda las coordenadas para uso posterior
   * 3. Prepara los estados iniciales según el tipo de herramienta
   * 4. Abre el modal apropiado para configurar propiedades
   * 
   * Cada tipo de elemento tiene su propio flujo de configuración.
   */
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!selectedTool || draggedNodeId) return;
    
    const svg = svgRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;
    
    const x = (e.clientX - CTM.e) / CTM.a / scale - offset.x / scale;
    const y = (e.clientY - CTM.f) / CTM.d / scale - offset.y / scale;

    // Guardar coordenadas para usarlas en el modal si es necesario
    setClickX(Math.round(x));
    setClickY(Math.round(y));

    const timestamp = Date.now() % 1000;

    // Para entidades, mostrar modal para pedir nombre
    if (['entity', 'weak_entity'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(selectedTool === 'entity' ? `ENTIDAD_${timestamp}` : `ENTIDAD_DEBIL_${timestamp}`);
      setShowPropertiesModal(true);
      return;
    }

    // Para relaciones, mostrar modal para configurar entidades y cardinalidades
    if (['relationship', 'ident_rel'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(selectedTool === 'relationship' ? `RELACION_${timestamp}` : `RELACION_IDENT_${timestamp}`);
      setSelectedEntity1('');
      setSelectedEntity2('');
      setCardinalityE1('1');
      setCardinalityE2('N');
      setCustomCard1('');
      setCustomCard2('');
      setTotalE1(false);
      setTotalE2(false);
      setShowPropertiesModal(true);
      return;
    }

    // Para atributos, mostrar modal
    if (['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(selectedTool!)) {
      setElementType(selectedTool);
      setElementName(`Atributo_${timestamp}`);
      setElementType2(selectedTool === 'key_attr' ? 'key' : selectedTool === 'derived_attr' ? 'derived' : selectedTool === 'multivalued_attr' ? 'multivalued' : 'simple');
      setSelectedEntity('');
      setShowPropertiesModal(true);
      return;
    }

    // Para especializaciones
    if (selectedTool === 'specialization') {
      setElementType('specialization');
      setSpecType('d');
      setSpecSuperclass('');
      setSpecSubclasses([]);
      setShowPropertiesModal(true);
      return;
    }

    // Para uniones
    if (selectedTool === 'union') {
      setElementType('union');
      setUnionName('u');
      setUnionSuperclasses([]);
      setUnionCategory('');
      setShowPropertiesModal(true);
      return;
    }
  };

  /**
   * Genera código DSL a partir de las propiedades configuradas en el modal
   * 
   * @description
   * Función de generación de código que convierte la configuración visual en texto DSL:
   * 
   * - Entidades: `ent NOMBRE (x, y)` o `weak_ent NOMBRE (x, y)`
   * - Atributos: `att NOMBRE -> ENTIDAD (x, y)` con prefijos según tipo
   * - Relaciones: `rel NOMBRE (x, y)` + múltiples `link` para cardinalidades
   * - Especializaciones: `spec tipo -> SUPERCLASE` + `link tipo SUBCLASE`
   * - Uniones: `union nombre` + múltiples `link` para superclases y categoría
   * 
   * Valida que todos los campos requeridos estén completos antes de generar.
   */
  const handleConfirmProperties = () => {
    if (!elementType) return;

    let newLines = '';

    // Para entidades
    if (['entity', 'weak_entity'].includes(elementType)) {
      if (!elementName) {
        alert('Por favor, introduce el nombre de la entidad');
        return;
      }
      const prefix = elementType === 'entity' ? 'ent' : 'weak_ent';
      newLines = `${prefix} ${elementName} (${clickX}, ${clickY})`;
    }

    // Para atributos
    if (['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(elementType)) {
      if (!elementName || !selectedEntity) {
        alert('Por favor, completa el nombre y selecciona una entidad');
        return;
      }
      const prefix = elementType === 'key_attr' ? 'key_att' : elementType === 'derived_attr' ? 'derived_att' : elementType === 'multivalued_attr' ? 'multivalued_att' : 'att';
      // Añadir coordenadas al atributo para posicionarlo donde se hizo click
      newLines = `${prefix} ${elementName} -> ${selectedEntity} (${clickX}, ${clickY})`;
    }

    // Para relaciones
    if (['relationship', 'ident_rel'].includes(elementType)) {
      if (!elementName || !selectedEntity1 || !selectedEntity2) {
        alert('Por favor, completa el nombre y selecciona ambas entidades');
        return;
      }
      
      const prefix = elementType === 'relationship' ? 'rel' : 'ident_rel';
      const card1 = cardinalityE1 === 'custom' ? customCard1 : cardinalityE1;
      const card2 = cardinalityE2 === 'custom' ? customCard2 : cardinalityE2;
      
      // Línea de la relación con coordenadas
      newLines = `${prefix} ${elementName} (${clickX}, ${clickY})\n`;
      // Link entidad 1
      newLines += `link ${selectedEntity1} ${elementName} "${card1}"${totalE1 ? ' [total]' : ''}\n`;
      // Link entidad 2
      newLines += `link ${selectedEntity2} ${elementName} "${card2}"${totalE2 ? ' [total]' : ''}`;
    }

    // Para especializaciones
    if (elementType === 'specialization') {
      if (!specSuperclass || specSubclasses.length === 0) {
        alert('Por favor, selecciona una superclase y al menos una subclase');
        return;
      }
      
      // Línea de la especialización
      newLines = `spec ${specType} -> ${specSuperclass}\n`;
      // Links para cada subclase
      specSubclasses.forEach((subclass, index) => {
        newLines += `link ${specType} ${subclass}${index < specSubclasses.length - 1 ? '\n' : ''}`;
      });
    }

    // Para uniones
    if (elementType === 'union') {
      if (!unionName || unionSuperclasses.length === 0 || !unionCategory) {
        alert('Por favor, completa el nombre de la unión, selecciona superclases y una categoría');
        return;
      }
      
      // Línea de la unión
      newLines = `union ${unionName}\n`;
      // Links para cada superclase
      unionSuperclasses.forEach(superclass => {
        newLines += `link ${superclass} ${unionName}\n`;
      });
      // Link a la categoría
      newLines += `link ${unionName} ${unionCategory}`;
    }

    if (newLines) {
      const newCode = code + '\n' + newLines;
      setCode(newCode);
    }

    setShowPropertiesModal(false);
    setSelectedTool(null);
    setElementName('');
    setSelectedEntity('');
  };

  /**
   * Renderiza la forma SVG apropiada para cada tipo de nodo
   * 
   * @description
   * Mapeo de tipos de nodo a representaciones visuales según notación EER:
   * - entity: Rectángulo simple
   * - weak_entity: Rectángulo doble
   * - relationship: Rombo (diamante)
   * - identifying_relationship: Rombo doble
   * - attribute: Elipse
   * - key_attribute: Elipse con texto subrayado
   * - derived_attribute: Elipse con borde discontinuo
   * - multivalued_attribute: Elipse doble
   * - specialization/union: Círculo con letra (d, o, u)
   */
  const renderNodeShape = (node: NodeData) => {
    const { STROKE_COLOR, STROKE_WIDTH, FILL_COLOR, TEXT_COLOR } = NODE_STYLES;

    switch (node.type) {
      case 'entity':
        return (
          <g>
            <rect x="-50" y="-25" width="100" height="50" fill={FILL_COLOR} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} rx="2" className="drop-shadow-sm" />
            <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="12" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
          </g>
        );
      case 'weak_entity':
        return (
          <g>
            <rect x="-50" y="-25" width="100" height="50" fill={FILL_COLOR} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} rx="2" className="drop-shadow-sm"/>
            <rect x="-44" y="-19" width="88" height="38" fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} rx="1" />
            <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="12" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
          </g>
        );
      case 'relationship':
        return (
          <g>
            <polygon points="0,-40 60,0 0,40 -60,0" fill="#f8fafc" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} className="drop-shadow-sm"/>
            <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="11" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
          </g>
        );
      case 'identifying_relationship':
        return (
          <g>
            <polygon points="0,-40 60,0 0,40 -60,0" fill="#f8fafc" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} className="drop-shadow-sm"/>
            <polygon points="0,-32 48,0 0,32 -48,0" fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
            <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="11" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
          </g>
        );
      case 'attribute':
      case 'key_attribute':
      case 'multivalued_attribute':
      case 'derived_attribute':
      {
        const isKey = node.type === 'key_attribute';
        const isMulti = node.type === 'multivalued_attribute';
        const isDerived = node.type === 'derived_attribute';
        return (
          <g>
            <ellipse cx="0" cy="0" rx="45" ry="25" fill="#f1f5f9" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeDasharray={isDerived ? "4" : "0"} className="drop-shadow-sm"/>
            {isMulti && <ellipse cx="0" cy="0" rx="38" ry="18" fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />}
            <text x="0" y="4" textAnchor="middle" fill={TEXT_COLOR} fontSize="11" textDecoration={isKey ? "underline" : "none"} style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
          </g>
        );
      }
      case 'specialization':
      case 'union':
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#fff" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} className="drop-shadow-sm"/>
            <text x="0" y="5" textAnchor="middle" fontWeight="bold" fontSize="14" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
          </g>
        );
      default:
        return null;
    }
  };

  /**
   * Renderiza todas las conexiones entre nodos
   * 
   * @description
   * Características de los enlaces:
   * - Línea simple para participación parcial
   * - Línea doble para participación total ([total])
   * - Símbolo de subconjunto (⊂) para jerarquías especialización/unión
   * - Etiquetas centradas con cardinalidades (1, N, M, etc.)
   * 
   * El símbolo de subconjunto se orienta hacia el nodo padre (especialización/unión).
   */
  const renderLinks = () => {
    return links.map((link, i) => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return null;

      // CORRECCIÓN FINAL:
      // 1. Detectar si el origen es una especialización/unión y el destino es una entidad (subclase/categoría).
      // 2. El símbolo de subconjunto debe abrirse hacia el ORIGEN (la especialización).
      
      const isSourceSpec = sourceNode.type === 'specialization' || sourceNode.type === 'union';
      const isTargetEntity = targetNode.type === 'entity' || targetNode.type === 'weak_entity';
      const showSubsetSymbol = isSourceSpec && isTargetEntity;
      
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;
      
      // Calcular ángulo para rotar el símbolo correctamente
      const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x) * 180 / Math.PI;

      return (
        <g key={i}>
          <line
            x1={sourceNode.x}
            y1={sourceNode.y}
            x2={targetNode.x}
            y2={targetNode.y}
            stroke="#64748b"
            strokeWidth={link.style === 'double' ? 4 : 1.5}
            strokeLinecap="round"
          />
          {link.style === 'double' && (
             <line
             x1={sourceNode.x}
             y1={sourceNode.y}
             x2={targetNode.x}
             y2={targetNode.y}
             stroke="#ffffff"
             strokeWidth={2}
             strokeLinecap="round"
           />
          )}

          {showSubsetSymbol && (
            <path 
              d={`M ${midX-8} ${midY-5} Q ${midX} ${midY+8} ${midX+8} ${midY-5}`}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              // Rotación ajustada: angle - 90 asegura que la copa se abra hacia el nodo Origen (la especialización)
              transform={`rotate(${angle - 90}, ${midX}, ${midY})`}
            />
          )}

          {link.label && (
            <g transform={`translate(${midX}, ${midY})`}>
              <rect x="-10" y="-10" width="20" height="20" fill="white" opacity="0.9" rx="4" />
              <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0f172a" style={{ pointerEvents: 'none', userSelect: 'none' }}>{link.label}</text>
            </g>
          )}
        </g>
      );
    });
  };

  const handleExport = () => {
    if (svgRef.current) {
      const data = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'eer-diagram.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // File menu actions (Open, Save, Save As)
  const handleOpenFile = async () => {
    try {
      const picker = (window as unknown as { showOpenFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker;
      const handles = picker ? await picker({
        types: [{ description: 'EER Files', accept: { 'text/plain': ['.eer'] } }],
        multiple: false,
      }) : [];
      const handle = handles && handles[0];
      if (handle) {
        const file = await (handle as unknown as { getFile: () => Promise<File> }).getFile();
        const text = await file.text();
        setCode(text);
        setLastFileHandle(handle);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.eer,text/plain';
        input.onchange = async () => {
          const f = (input.files && input.files[0]) || null;
          if (!f) return;
          const text = await f.text();
          setCode(text);
        };
        input.click();
      }
    } finally {
      setShowFileMenu(false);
    }
  };

  const saveToHandle = async (handle: unknown, content: string) => {
    const writable = await (handle as unknown as { createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void>; }> }).createWritable();
    await writable.write(content);
    await writable.close();
  };

  const handleSaveFile = async () => {
    try {
      if (lastFileHandle) {
        await saveToHandle(lastFileHandle, codeRef.current);
      } else {
        const savePicker = (window as unknown as { showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
        if (savePicker) {
          const fileHandle = await savePicker({
            types: [{ description: 'EER Files', accept: { 'text/plain': ['.eer'] } }],
            suggestedName: 'diagram.eer',
          });
          await saveToHandle(fileHandle, codeRef.current);
          setLastFileHandle(fileHandle);
        } else {
          const blob = new Blob([codeRef.current], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'diagram.eer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } finally {
      setShowFileMenu(false);
    }
  };

  const handleSaveAsFile = async () => {
    try {
      const savePicker = (window as unknown as { showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
      if (savePicker) {
        const fileHandle = await savePicker({
          types: [{ description: 'EER Files', accept: { 'text/plain': ['.eer'] } }],
          suggestedName: 'diagram.eer',
        });
        await saveToHandle(fileHandle, codeRef.current);
        setLastFileHandle(fileHandle);
      } else {
        const blob = new Blob([codeRef.current], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.eer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setShowFileMenu(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm z-30">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">EER Studio</h1>
          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Edición Bidireccional</span>
          <div className="relative ml-4" onMouseDown={e => e.stopPropagation()}>
            <button onClick={() => setShowFileMenu(s => !s)} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200">File</button>
            {showFileMenu && (
              <div className="absolute left-0 mt-1 w-40 rounded-md border border-slate-200 bg-white shadow-lg z-40">
                <button onClick={handleOpenFile} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100">Open</button>
                <button onClick={handleSaveFile} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100">Save</button>
                <button onClick={handleSaveAsFile} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100">Save as</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <HelpCircle className="h-4 w-4" /> Sintaxis
          </button>
          <button onClick={() => setShowAIPrompt(true)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <Code className="h-4 w-4" /> Prompt para tu IA
          </button>
          <button onClick={() => setShowCredits(true)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <Info className="h-4 w-4" /> Créditos
          </button>
          <button onClick={handleExport} className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors">
            <Share2 className="h-4 w-4" /> Exportar SVG
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">Insertar:</span>
        <button
          onClick={() => setSelectedTool(selectedTool === 'entity' ? null : 'entity')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'entity'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Entidad fuerte (click en canvas)"
        >
          <Square className="h-4 w-4" /> Entidad
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'weak_entity' ? null : 'weak_entity')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'weak_entity'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Entidad débil (click en canvas)"
        >
          <SquareDashed className="h-4 w-4" /> Entidad Débil
        </button>
        <div className="w-px bg-slate-200 mx-1 h-6"></div>
        <button
          onClick={() => setSelectedTool(selectedTool === 'relationship' ? null : 'relationship')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'relationship'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Relación fuerte (click en canvas)"
        >
          <Diamond className="h-4 w-4" /> Relación
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'ident_rel' ? null : 'ident_rel')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'ident_rel'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Relación identificativa (click en canvas)"
        >
          <Zap className="h-4 w-4" /> Rel. Identif.
        </button>
        <div className="w-px bg-slate-200 mx-1 h-6"></div>
        <button
          onClick={() => setSelectedTool(selectedTool === 'attribute' ? null : 'attribute')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'attribute'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Atributo simple (click en canvas)"
        >
          <Circle className="h-4 w-4" /> Atributo
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'key_attr' ? null : 'key_attr')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'key_attr'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Atributo clave (click en canvas)"
        >
          <Zap className="h-4 w-4" /> Atrib. Clave
        </button>
        <div className="w-px bg-slate-200 mx-1 h-6"></div>
        <button
          onClick={() => setSelectedTool(selectedTool === 'specialization' ? null : 'specialization')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'specialization'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Especialización/Generalización"
        >
          <GitBranch className="h-4 w-4" /> Especialización
        </button>
        <button
          onClick={() => setSelectedTool(selectedTool === 'union' ? null : 'union')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTool === 'union'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Unión/Categoría"
        >
          <Layers className="h-4 w-4" /> Unión
        </button>
        {selectedTool && (
          <div className="ml-auto text-xs text-indigo-600 font-medium">
            Herramienta activa: {selectedTool === 'entity' ? 'Entidad' : selectedTool === 'weak_entity' ? 'Entidad Débil' : selectedTool === 'relationship' ? 'Relación' : selectedTool === 'ident_rel' ? 'Rel. Identificativa' : selectedTool === 'attribute' ? 'Atributo' : selectedTool === 'key_attr' ? 'Atrib. Clave' : selectedTool === 'specialization' ? 'Especialización' : 'Unión'} - Click en canvas
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        <div className="flex w-1/3 min-w-[300px] flex-col border-r border-slate-200 bg-white shadow-lg z-20">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 bg-slate-50">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Code className="h-3 w-3" /> Definición
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!code.trim()) {
                    setCode('');
                  } else {
                    setShowClearConfirm(true);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Limpiar todo el código"
              >
                <Trash2 className="h-3 w-3" /> Limpiar
              </button>
              <div className="text-[10px] text-slate-400">Las coordenadas se actualizan al mover nodos</div>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 resize-none bg-slate-50 p-4 font-mono text-xs md:text-sm leading-relaxed text-slate-700 focus:outline-none selection:bg-indigo-100"
            spellCheck={false}
          />
        </div>

        <div className={`relative flex-1 bg-slate-50 overflow-hidden ${selectedTool ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
             onMouseDown={() => setIsDraggingCanvas(true)}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             onClick={handleCanvasClick}
        >
          <div className="absolute bottom-4 right-4 flex gap-2 rounded-lg bg-white p-1 shadow-lg border border-slate-200 z-20" onMouseDown={e => e.stopPropagation()}>
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomOut className="h-5 w-5" /></button>
            <span className="flex items-center px-2 text-xs font-medium text-slate-500 min-w-[3rem] justify-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomIn className="h-5 w-5" /></button>
            <div className="w-px bg-slate-200 my-1 mx-1"></div>
            <button onClick={() => { setOffset({x:0, y:0}); setScale(0.8); }} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Maximize2 className="h-5 w-5" /></button>
          </div>

          <svg 
            ref={svgRef}
            className="h-full w-full touch-none"
          >
            <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect x={-50000} y={-50000} width={100000} height={100000} fill="url(#grid)" />

              {renderLinks()}
              {nodes.map(node => (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  style={{ cursor: 'grab' }}
                >
                  {renderNodeShape(node)}
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>

      {showAIPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800">🤖 Prompt para tu IA</h2>
              <button onClick={() => setShowAIPrompt(false)} className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto p-4 text-sm text-slate-700 space-y-4">
              <p className="text-slate-600">
                Usa este prompt con <strong>ChatGPT, Claude, Gemini</strong> u otra IA para generar código EER automáticamente.
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Copiar este prompt</span>
                  <button 
                    onClick={() => {
                      const promptText = `Actúa como un experto en diseño de bases de datos y generador de código para la herramienta "EER Studio". Tu tarea es analizar una descripción en lenguaje natural de un problema de requisitos de datos y convertirla en el código DSL (Domain Specific Language) específico que utiliza EER Studio para generar diagramas.

### Reglas de Sintaxis de EER Studio:

1. **Entidades:**
   - Fuertes: \`ent NOMBRE_ENTIDAD\`
   - Débiles: \`weak_ent NOMBRE_ENTIDAD\`
   - (Opcional) Puedes añadir coordenadas: \`ent USUARIO (100, 200)\`

2. **Atributos:**
   - Simple: \`att NombreAtributo -> ENTIDAD\`
   - Clave (identificador): \`key_att NombreAtributo -> ENTIDAD\`
   - Derivado: \`derived_att NombreAtributo -> ENTIDAD\`
   - Multivaluado: \`multivalued_att NombreAtributo -> ENTIDAD\`

3. **Relaciones:**
   - Normal: \`rel NOMBRE_RELACION\`
   - Identificativa (para entidades débiles): \`ident_rel NOMBRE_RELACION\`

4. **Conexiones (Links) y Cardinalidad:**
   - Sintaxis: \`link ENTIDAD RELACION "CARDINALIDAD"\`
   - Cardinalidades: "1", "N", "M"
   - Participación Total: \`link EMPLEADO TRABAJA_EN "N" [total]\`

5. **Jerarquías (Especialización/Generalización):**
   - Definir especialización: \`spec TIPO -> SUPERCLASE\`
     - TIPO: 'd' (disjunta) o 'o' (solapada)
   - Conectar subclases: \`link TIPO SUBCLASE\`
   - Ejemplo:
     \`\`\`
     spec d -> EMPLEADO
     link d SECRETARIA
     link d INGENIERO
     \`\`\`

6. **Uniones (Categorías):**
   - Definir unión: \`union u\`
   - Conectar superclases: \`link SUPERCLASE u\`
   - Conectar categoría: \`link u CATEGORIA\`

### Ejemplo:

**Input:** "Un empleado trabaja en un departamento. El empleado tiene DNI (clave) y Nombre. El departamento tiene un Nombre."

**Output:**
\`\`\`
// Entidades
ent EMPLEADO
ent DEPARTAMENTO

// Atributos
key_att DNI -> EMPLEADO
att Nombre -> EMPLEADO
att Nombre -> DEPARTAMENTO

// Relaciones
rel TRABAJA_EN
link EMPLEADO TRABAJA_EN "N" [total]
link DEPARTAMENTO TRABAJA_EN "1"
\`\`\`

### Tu Tarea:

Genera el código EER Studio para el siguiente problema. Identifica correctamente claves, cardinalidades, jerarquías y entidades débiles. Puedes sugerir coordenadas aproximadas para evitar superposiciones.

**Problema a modelar:**
[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]`;
                      navigator.clipboard.writeText(promptText);
                    }}
                    className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                  >
                    Copiar
                  </button>
                </div>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-200 max-h-96">
{`Actúa como un experto en diseño de bases de datos y generador de código para la herramienta "EER Studio". Tu tarea es analizar una descripción en lenguaje natural de un problema de requisitos de datos y convertirla en el código DSL (Domain Specific Language) específico que utiliza EER Studio para generar diagramas.

### Reglas de Sintaxis de EER Studio:

1. **Entidades:**
   - Fuertes: \`ent NOMBRE_ENTIDAD\`
   - Débiles: \`weak_ent NOMBRE_ENTIDAD\`
   - (Opcional) Puedes añadir coordenadas: \`ent USUARIO (100, 200)\`

2. **Atributos:**
   - Simple: \`att NombreAtributo -> ENTIDAD\`
   - Clave (identificador): \`key_att NombreAtributo -> ENTIDAD\`
   - Derivado: \`derived_att NombreAtributo -> ENTIDAD\`
   - Multivaluado: \`multivalued_att NombreAtributo -> ENTIDAD\`

3. **Relaciones:**
   - Normal: \`rel NOMBRE_RELACION\`
   - Identificativa (para entidades débiles): \`ident_rel NOMBRE_RELACION\`

4. **Conexiones (Links) y Cardinalidad:**
   - Sintaxis: \`link ENTIDAD RELACION "CARDINALIDAD"\`
   - Cardinalidades: "1", "N", "M"
   - Participación Total: \`link EMPLEADO TRABAJA_EN "N" [total]\`

5. **Jerarquías (Especialización/Generalización):**
   - Definir especialización: \`spec TIPO -> SUPERCLASE\`
     - TIPO: 'd' (disjunta) o 'o' (solapada)
   - Conectar subclases: \`link TIPO SUBCLASE\`
   - Ejemplo:
     \`\`\`
     spec d -> EMPLEADO
     link d SECRETARIA
     link d INGENIERO
     \`\`\`

6. **Uniones (Categorías):**
   - Definir unión: \`union u\`
   - Conectar superclases: \`link SUPERCLASE u\`
   - Conectar categoría: \`link u CATEGORIA\`

### Ejemplo:

**Input:** "Un empleado trabaja en un departamento. El empleado tiene DNI (clave) y Nombre. El departamento tiene un Nombre."

**Output:**
\`\`\`
// Entidades
ent EMPLEADO
ent DEPARTAMENTO

// Atributos
key_att DNI -> EMPLEADO
att Nombre -> EMPLEADO
att Nombre -> DEPARTAMENTO

// Relaciones
rel TRABAJA_EN
link EMPLEADO TRABAJA_EN "N" [total]
link DEPARTAMENTO TRABAJA_EN "1"
\`\`\`

### Tu Tarea:

Genera el código EER Studio para el siguiente problema. Identifica correctamente claves, cardinalidades, jerarquías y entidades débiles. Puedes sugerir coordenadas aproximadas para evitar superposiciones.

**Problema a modelar:**
[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]`}
                </pre>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-2">📋 Instrucciones:</h3>
                <ol className="text-sm space-y-1 list-decimal list-inside text-slate-700">
                  <li>Haz clic en "Copiar" para copiar el prompt</li>
                  <li>Pégalo en ChatGPT, Claude, Gemini o tu IA favorita</li>
                  <li>Reemplaza <code className="bg-white px-1 rounded text-xs">[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]</code> con tu enunciado</li>
                  <li>Copia el código generado por la IA</li>
                  <li>Pégalo en el panel izquierdo de EER Studio</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-indigo-50 to-white p-8 shadow-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-indigo-900">Créditos</h2>
              <button onClick={() => setShowCredits(false)} className="rounded-full p-1 hover:bg-indigo-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-6 text-slate-700">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-indigo-900 mb-2">EER Studio</h3>
                <p className="text-sm text-slate-600">Editor de Diagramas Entidad-Relación Extendido</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <p className="text-sm leading-relaxed">
                  <strong className="text-indigo-900">Desarrollado por:</strong><br />
                  <a href="https://davidbuenov.com/" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors">
                    David Bueno Vallejo
                  </a>
                  <br />
                  <a href="https://github.com/davidbuenov/eer-studio" target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-block text-slate-500 hover:text-slate-700 hover:underline transition-colors">
                    Repositorio GitHub · https://github.com/davidbuenov/eer-studio
                  </a>
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <p className="text-sm leading-relaxed">
                  <strong className="text-indigo-900">Asistencia de IA:</strong><br />
                  Este proyecto fue desarrollado con la ayuda de <strong>Gemini</strong> y <strong>GitHub Copilot</strong>,
                  herramientas de inteligencia artificial que facilitaron el desarrollo y la implementación de funcionalidades.
                </p>
              </div>

              <div className="text-center pt-4 border-t border-indigo-100">
                <p className="text-xs text-slate-500">
                  © 2025 David Bueno Vallejo<br />
                  Todos los derechos reservados
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Guía de Sintaxis EER</h2>
              <button onClick={() => setShowHelp(false)} className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 overflow-y-auto p-2">
              <div>
                <h3 className="mb-2 font-bold text-indigo-600">Entidades y Relaciones</h3>
                <ul className="space-y-2">
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">ent NOMBRE (x, y)</code> <span>Entidad. Coords opcionales.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">weak_ent NOMBRE</code> <span>Entidad débil.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">rel NOMBRE</code> <span>Relación.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">ident_rel NOMBRE</code> <span>Relación identificativa.</span></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-indigo-600">Atributos</h3>
                <ul className="space-y-2">
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">att NOMBRE -&gt; ENTIDAD</code> <span>Atributo simple.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">key_att NOMBRE -&gt; ENTIDAD</code> <span>Atributo clave.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">derived_att NOMBRE</code> <span>Derivado.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">multivalued_attribute</code> <span>Multivaluado.</span></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-indigo-600">Conexiones</h3>
                <ul className="space-y-2">
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">link A B "1"</code> <span>Conexión simple.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">link A B "N" [total]</code> <span>Participación total.</span></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-indigo-600">EER (Avanzado)</h3>
                <ul className="space-y-2">
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">spec d -&gt; SUPERCLASE</code> <span>Especialización.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">link d SUBCLASE</code> <span>Conecta subclase.</span></li>
                  <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">union u</code> <span>Categoría de Unión.</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4 text-center flex-shrink-0">
              <button onClick={() => setShowHelp(false)} className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">Entendido</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Propiedades */}
      {showPropertiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {['entity', 'weak_entity'].includes(elementType || '') ? 'Propiedades de la Entidad' : 
                 ['relationship', 'ident_rel'].includes(elementType || '') ? 'Propiedades de la Relación' :
                 elementType === 'specialization' ? 'Especialización/Generalización' :
                 elementType === 'union' ? 'Unión/Categoría' :
                 'Propiedades del Atributo'}
              </h2>
              <button onClick={() => setShowPropertiesModal(false)} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre (para entidades, atributos y relaciones) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {['entity', 'weak_entity'].includes(elementType || '') ? 'Nombre de la Entidad' : 
                   ['relationship', 'ident_rel'].includes(elementType || '') ? 'Nombre de la Relación' :
                   'Nombre del Atributo'}
                </label>
                <input
                  type="text"
                  value={elementName}
                  onChange={(e) => setElementName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                  placeholder={['entity', 'weak_entity'].includes(elementType || '') ? 'ej: EMPLEADO, CLIENTE' : 
                              ['relationship', 'ident_rel'].includes(elementType || '') ? 'ej: TRABAJA_EN, PERTENECE_A' :
                              'ej: Nombre, DNI, Teléfono'}
                />
              </div>

              {/* Configuración de relaciones */}
              {['relationship', 'ident_rel'].includes(elementType || '') && (
                <>
                  {/* Primera Entidad */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-600 uppercase mb-3">Primera Entidad</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Entidad</label>
                        <select
                          value={selectedEntity1}
                          onChange={(e) => setSelectedEntity1(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">-- Selecciona --</option>
                          {nodes
                            .filter(n => ['entity', 'weak_entity'].includes(n.type))
                            .map(n => (
                              <option key={n.id} value={n.label}>{n.label}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad</label>
                        <select
                          value={cardinalityE1}
                          onChange={(e) => setCardinalityE1(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="1">1</option>
                          <option value="N">N</option>
                          <option value="M">M</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>
                      {cardinalityE1 === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad Personalizada</label>
                          <input
                            type="text"
                            value={customCard1}
                            onChange={(e) => setCustomCard1(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                            placeholder="ej: (0..N), (1..4)"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={totalE1}
                          onChange={(e) => setTotalE1(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <label className="text-sm text-slate-700">Participación Total</label>
                      </div>
                    </div>
                  </div>

                  {/* Segunda Entidad */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-600 uppercase mb-3">Segunda Entidad</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Entidad</label>
                        <select
                          value={selectedEntity2}
                          onChange={(e) => setSelectedEntity2(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">-- Selecciona --</option>
                          {nodes
                            .filter(n => ['entity', 'weak_entity'].includes(n.type))
                            .map(n => (
                              <option key={n.id} value={n.label}>{n.label}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad</label>
                        <select
                          value={cardinalityE2}
                          onChange={(e) => setCardinalityE2(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="1">1</option>
                          <option value="N">N</option>
                          <option value="M">M</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>
                      {cardinalityE2 === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad Personalizada</label>
                          <input
                            type="text"
                            value={customCard2}
                            onChange={(e) => setCustomCard2(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                            placeholder="ej: (0..N), (1..4)"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={totalE2}
                          onChange={(e) => setTotalE2(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <label className="text-sm text-slate-700">Participación Total</label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tipo de atributo (solo para atributos) */}
              {['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(elementType || '') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Atributo</label>
                    <select
                      value={elementType2}
                      onChange={(e) => setElementType2(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="simple">Simple</option>
                      <option value="key">Clave (identificador)</option>
                      <option value="derived">Derivado</option>
                      <option value="multivalued">Multivaluado</option>
                    </select>
                  </div>

                  {/* Seleccionar Entidad (solo para atributos) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asociar a Entidad</label>
                    <select
                      value={selectedEntity}
                      onChange={(e) => setSelectedEntity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Selecciona una entidad --</option>
                      {nodes
                        .filter(n => ['entity', 'weak_entity'].includes(n.type))
                        .map(n => (
                          <option key={n.id} value={n.label}>{n.label}</option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {/* Configuración de especialización */}
              {elementType === 'specialization' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Especialización</label>
                    <select
                      value={specType}
                      onChange={(e) => setSpecType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="d">Disjunta (d)</option>
                      <option value="o">Solapada (o)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Superclase</label>
                    <select
                      value={specSuperclass}
                      onChange={(e) => setSpecSuperclass(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Selecciona superclase --</option>
                      {nodes
                        .filter(n => ['entity', 'weak_entity'].includes(n.type))
                        .map(n => (
                          <option key={n.id} value={n.label}>{n.label}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subclases (selecciona múltiples)</label>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                      {nodes
                        .filter(n => ['entity', 'weak_entity'].includes(n.type) && n.label !== specSuperclass)
                        .map(n => (
                          <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={specSubclasses.includes(n.label)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSpecSubclasses([...specSubclasses, n.label]);
                                } else {
                                  setSpecSubclasses(specSubclasses.filter(s => s !== n.label));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700">{n.label}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {/* Configuración de unión */}
              {elementType === 'union' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Unión</label>
                    <input
                      type="text"
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                      placeholder="ej: u, u1, u2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Superclases (selecciona múltiples)</label>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                      {nodes
                        .filter(n => ['entity', 'weak_entity'].includes(n.type))
                        .map(n => (
                          <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={unionSuperclasses.includes(n.label)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUnionSuperclasses([...unionSuperclasses, n.label]);
                                } else {
                                  setUnionSuperclasses(unionSuperclasses.filter(s => s !== n.label));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700">{n.label}</span>
                          </label>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                    <select
                      value={unionCategory}
                      onChange={(e) => setUnionCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Selecciona categoría --</option>
                      {nodes
                        .filter(n => ['entity', 'weak_entity'].includes(n.type))
                        .map(n => (
                          <option key={n.id} value={n.label}>{n.label}</option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowPropertiesModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmProperties}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Limpiar */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-red-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Confirmar Limpieza</h2>
              <button onClick={() => setShowClearConfirm(false)} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600">
                ¿Estás seguro de que deseas borrar toda la definición? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setCode('');
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Borrar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const EERDiagrammerWithRef = forwardRef(EERDiagrammer);
export default EERDiagrammerWithRef;