// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import type { NodeData, LinkData } from '../types';
import type { Diagnostic } from '../types/compiler';
import { compileEER } from '../utils/compiler';

/**
 * Hook para compilar código DSL y generar nodos y enlaces con tolerancia a fallos.
 *
 * Aplica la estrategia Stale-while-error:
 * - Si el código compila con éxito (isValid === true), actualiza los nodos, enlaces
 *   y guarda la referencia al último estado válido.
 * - Si el código contiene errores de sintaxis bloqueantes (isValid === false), conserva
 *   en pantalla el último estado válido (evitando parpadeos o desmontajes de entidades),
 *   y expone los diagnósticos para feedback en la UI.
 * - Si el código está vacío (o solo comentarios), limpia el canvas legítimamente.
 */
export function useEERParser(code: string) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);

  // Referencias para retención Stale-while-error
  const lastValidNodesRef = useRef<NodeData[]>([]);
  const lastValidLinksRef = useRef<LinkData[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = compileEER(code);
      setDiagnostics(result.diagnostics);
      setIsValid(result.isValid);

      if (result.isValid) {
        lastValidNodesRef.current = result.nodes;
        lastValidLinksRef.current = result.links;
        setNodes(result.nodes);
        setLinks(result.links);
      } else {
        // En caso de error bloqueante (ej: 'ent ' mientras se escribe),
        // retenemos el último estado válido si existía
        if (lastValidNodesRef.current.length > 0) {
          setNodes(lastValidNodesRef.current);
          setLinks(lastValidLinksRef.current);
        }
      }
    }, 300); // Debounce de 300ms para evitar parsing excesivo
    
    return () => clearTimeout(timer);
  }, [code]);

  return { nodes, links, setNodes, diagnostics, isValid };
}
