import { useState, useEffect } from 'react';
import type { NodeData, LinkData } from '../types';
import { parseCode } from '../utils/parser';

/**
 * Hook para parsear código DSL y generar nodos y enlaces
 */
export function useEERParser(code: string) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const { nodes: parsedNodes, links: parsedLinks } = parseCode(code);
      setNodes(parsedNodes);
      setLinks(parsedLinks);
    }, 300); // Debounce de 300ms para evitar parsing excesivo
    
    return () => clearTimeout(timer);
  }, [code]);

  return { nodes, links, setNodes };
}
