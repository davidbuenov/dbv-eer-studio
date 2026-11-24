import React from 'react';
import type { NodeData, LinkData } from '../types';

interface LinkRendererProps {
  link: LinkData;
  nodes: NodeData[];
  /**
   * Desplazamiento perpendicular (px) cuando hay varios enlaces entre los mismos nodos
   * (relación recursiva): ver `computeParallelOffsets`. 0 = sobre el eje.
   */
  offset?: number;
}

/**
 * Renderiza un enlace (línea de conexión) entre dos nodos
 *
 * Características:
 * - Línea simple para participación parcial
 * - Línea doble para participación total ([total])
 * - Símbolo de subconjunto (⊂) para jerarquías especialización/unión
 * - Etiquetas centradas con cardinalidades (1, N, M, etc.)
 * - Rol del participante en cursiva cerca de la entidad (§3.11 E)
 * - Enlaces paralelos desplazados para que no se superpongan (relaciones recursivas)
 *
 * El símbolo de subconjunto se orienta hacia el nodo padre (especialización/unión).
 *
 * Optimizado con React.memo para evitar re-renders innecesarios cuando las props no cambian.
 */
function LinkRendererComponent({ link, nodes, offset = 0 }: LinkRendererProps) {
  const sourceNode = nodes.find(n => n.id === link.source);
  const targetNode = nodes.find(n => n.id === link.target);

  if (!sourceNode || !targetNode) return null;

  // Detectar si el origen es una especialización/unión y el destino es una entidad (subclase/categoría)
  const isSourceSpec = sourceNode.type === 'specialization' || sourceNode.type === 'union';
  const isTargetEntity = targetNode.type === 'entity' || targetNode.type === 'weak_entity';
  const showSubsetSymbol = isSourceSpec && isTargetEntity;

  // Extremos desplazados en perpendicular (normal unitaria del sentido origen → destino).
  const length = Math.hypot(targetNode.x - sourceNode.x, targetNode.y - sourceNode.y) || 1;
  const normalX = -(targetNode.y - sourceNode.y) / length;
  const normalY = (targetNode.x - sourceNode.x) / length;
  const sx = sourceNode.x + normalX * offset;
  const sy = sourceNode.y + normalY * offset;
  const tx = targetNode.x + normalX * offset;
  const ty = targetNode.y + normalY * offset;

  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  // Calcular ángulo para rotar el símbolo correctamente
  const angle = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;

  // Ancho aproximado a 7 px por carácter (fuente de 12 px en negrita); mínimo el de una cardinalidad.
  const labelWidth = Math.max(20, (link.label?.length ?? 0) * 7 + 8);

  // Rol (§3.11 E): al 25 % del segmento desde la entidad, apartado 12 px hacia fuera del eje
  // (del lado del desplazamiento en un enlace paralelo) para no tapar la línea ni la cardinalidad.
  const entityIsSource = sourceNode.type === 'entity' || sourceNode.type === 'weak_entity';
  const [fromX, fromY, toX, toY] = entityIsSource ? [sx, sy, tx, ty] : [tx, ty, sx, sy];
  const side = offset < 0 ? -1 : 1;
  const roleX = fromX + (toX - fromX) * 0.25 + normalX * 12 * side;
  const roleY = fromY + (toY - fromY) * 0.25 + normalY * 12 * side;

  return (
    <g>
      {/* Línea principal */}
      <line
        x1={sx}
        y1={sy}
        x2={tx}
        y2={ty}
        stroke="#64748b"
        strokeWidth={link.style === 'double' ? 4 : 1.5}
        strokeLinecap="round"
      />

      {/* Línea blanca central para efecto doble */}
      {link.style === 'double' && (
        <line
          x1={sx}
          y1={sy}
          x2={tx}
          y2={ty}
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

      {/* Etiqueta de cardinalidad, o atributo definidor en la arista superclase–especialización */}
      {link.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect x={-labelWidth / 2} y="-10" width={labelWidth} height="20" fill="white" opacity="0.9" rx="4" />
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

      {link.role && (
        <text
          x={roleX}
          y={roleY}
          textAnchor="middle"
          fontSize="11"
          fontStyle="italic"
          fill="#4338ca"
          stroke="white"
          strokeWidth="3"
          paintOrder="stroke"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {link.role}
        </text>
      )}
    </g>
  );
}

export const LinkRenderer = React.memo(LinkRendererComponent, (prevProps, nextProps) => {
  // Retorna true si NO debería re-renderizar (props son iguales)
  return (
    prevProps.link.source === nextProps.link.source &&
    prevProps.link.target === nextProps.link.target &&
    prevProps.link.style === nextProps.link.style &&
    prevProps.link.label === nextProps.link.label &&
    prevProps.link.role === nextProps.link.role &&
    prevProps.offset === nextProps.offset &&
    prevProps.nodes.length === nextProps.nodes.length &&
    prevProps.nodes === nextProps.nodes
  );
});
