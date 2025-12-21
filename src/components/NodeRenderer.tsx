import React from 'react';
import type { NodeData } from '../types';
import { NODE_STYLES } from '../constants';

interface NodeRendererProps {
  node: NodeData;
  isDragged: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
}

/**
 * Renderiza un nodo individual según su tipo en notación EER
 * 
 * Mapeo de tipos a representaciones visuales:
 * - entity: Rectángulo simple
 * - weak_entity: Rectángulo doble
 * - relationship: Rombo/Diamante
 * - identifying_relationship: Rombo doble
 * - attribute: Elipse
 * - key_attribute: Elipse con texto subrayado
 * - derived_attribute: Elipse con borde discontinuo
 * - multivalued_attribute: Elipse doble
 * - specialization/union: Círculo con letra (d, o, u)
 * 
 * Optimizado con React.memo para evitar re-renders innecesarios cuando las props no cambian.
 */
function NodeRendererComponent({ node, isDragged, onMouseDown }: NodeRendererProps) {
  const { STROKE_COLOR, STROKE_WIDTH, FILL_COLOR, TEXT_COLOR } = NODE_STYLES;

  const commonProps = {
    onMouseDown: (e: React.MouseEvent) => onMouseDown(e, node.id),
    style: { cursor: 'move' }
  };

  return (
    <g
      key={node.id}
      transform={`translate(${node.x}, ${node.y})`}
      opacity={isDragged ? 0.8 : 1}
      {...commonProps}
    >
      {node.type === 'entity' && (
        <>
          <rect x="-50" y="-25" width="100" height="50" fill={FILL_COLOR} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} rx="2" className="drop-shadow-sm" />
          <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="12" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
        </>
      )}

      {node.type === 'weak_entity' && (
        <>
          <rect x="-50" y="-25" width="100" height="50" fill={FILL_COLOR} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} rx="2" className="drop-shadow-sm"/>
          <rect x="-44" y="-19" width="88" height="38" fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} rx="1" />
          <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="12" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
        </>
      )}

      {node.type === 'relationship' && (
        <>
          <polygon points="0,-40 60,0 0,40 -60,0" fill="#f8fafc" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} className="drop-shadow-sm"/>
          <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="11" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
        </>
      )}

      {node.type === 'identifying_relationship' && (
        <>
          <polygon points="0,-40 60,0 0,40 -60,0" fill="#f8fafc" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} className="drop-shadow-sm"/>
          <polygon points="0,-32 48,0 0,32 -48,0" fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
          <text x="0" y="5" textAnchor="middle" fill={TEXT_COLOR} fontSize="11" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
        </>
      )}

      {(node.type === 'attribute' || node.type === 'key_attribute' || node.type === 'multivalued_attribute' || node.type === 'derived_attribute') && (
        <>
          {(() => {
            const isKey = node.type === 'key_attribute';
            const isMulti = node.type === 'multivalued_attribute';
            const isDerived = node.type === 'derived_attribute';
            return (
              <>
                <ellipse cx="0" cy="0" rx="45" ry="25" fill="#f1f5f9" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeDasharray={isDerived ? "4" : "0"} className="drop-shadow-sm"/>
                {isMulti && <ellipse cx="0" cy="0" rx="38" ry="18" fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />}
                <text x="0" y="4" textAnchor="middle" fill={TEXT_COLOR} fontSize="11" textDecoration={isKey ? "underline" : "none"} style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
              </>
            );
          })()}
        </>
      )}

      {(node.type === 'specialization' || node.type === 'union') && (
        <>
          <circle cx="0" cy="0" r="18" fill="#fff" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} className="drop-shadow-sm"/>
          <text x="0" y="5" textAnchor="middle" fontWeight="bold" fontSize="14" style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
        </>
      )}
    </g>
  );
}

export const NodeRenderer = React.memo(NodeRendererComponent, (prevProps, nextProps) => {
  // Retorna true si NO debería re-renderizar (props son iguales)
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.type === nextProps.node.type &&
    prevProps.node.label === nextProps.node.label &&
    prevProps.node.x === nextProps.node.x &&
    prevProps.node.y === nextProps.node.y &&
    prevProps.isDragged === nextProps.isDragged &&
    prevProps.onMouseDown === nextProps.onMouseDown
  );
});
