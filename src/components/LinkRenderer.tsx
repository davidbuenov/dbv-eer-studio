import type { NodeData, LinkData } from '../types';

interface LinkRendererProps {
  link: LinkData;
  nodes: NodeData[];
}

/**
 * Renderiza un enlace (línea de conexión) entre dos nodos
 * 
 * Características:
 * - Línea simple para participación parcial
 * - Línea doble para participación total ([total])
 * - Símbolo de subconjunto (⊂) para jerarquías especialización/unión
 * - Etiquetas centradas con cardinalidades (1, N, M, etc.)
 * 
 * El símbolo de subconjunto se orienta hacia el nodo padre (especialización/unión).
 */
export function LinkRenderer({ link, nodes }: LinkRendererProps) {
  const sourceNode = nodes.find(n => n.id === link.source);
  const targetNode = nodes.find(n => n.id === link.target);
  
  if (!sourceNode || !targetNode) return null;

  // Detectar si el origen es una especialización/unión y el destino es una entidad (subclase/categoría)
  const isSourceSpec = sourceNode.type === 'specialization' || sourceNode.type === 'union';
  const isTargetEntity = targetNode.type === 'entity' || targetNode.type === 'weak_entity';
  const showSubsetSymbol = isSourceSpec && isTargetEntity;
  
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;
  
  // Calcular ángulo para rotar el símbolo correctamente
  const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x) * 180 / Math.PI;

  return (
    <g key={`${link.source}-${link.target}`}>
      {/* Línea principal */}
      <line
        x1={sourceNode.x}
        y1={sourceNode.y}
        x2={targetNode.x}
        y2={targetNode.y}
        stroke="#64748b"
        strokeWidth={link.style === 'double' ? 4 : 1.5}
        strokeLinecap="round"
      />
      
      {/* Línea blanca central para efecto doble */}
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

      {/* Símbolo de subconjunto para especialización/unión */}
      {showSubsetSymbol && (
        <path 
          d={`M ${midX-8} ${midY-5} Q ${midX} ${midY+8} ${midX+8} ${midY-5}`}
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          transform={`rotate(${angle - 90}, ${midX}, ${midY})`}
        />
      )}

      {/* Etiqueta de cardinalidad */}
      {link.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect x="-10" y="-10" width="20" height="20" fill="white" opacity="0.9" rx="4" />
          <text 
            x="0" 
            y="5" 
            textAnchor="middle" 
            fontSize="12" 
            fontWeight="bold" 
            fill="#0f172a" 
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {link.label}
          </text>
        </g>
      )}
    </g>
  );
}
