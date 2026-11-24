// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useCallback, useReducer } from 'react';
import { commitCode, createHistory, redoCode, undoCode, type CodeChangeOrigin, type CodeHistory } from '../utils/codeHistory';

type HistoryAction =
  | { type: 'commit'; code: string; origin: CodeChangeOrigin; now: number }
  | { type: 'undo' }
  | { type: 'redo' };

function reducer(history: CodeHistory, action: HistoryAction): CodeHistory {
  const next =
    action.type === 'commit'
      ? commitCode(history, action.code, action.origin, action.now)
      : action.type === 'undo'
        ? undoCode(history)
        : redoCode(history);
  return next;
}

/**
 * Estado del código DSL EER con deshacer/rehacer (§3.11 H). Sustituye al `useState` del código
 * en la edición completa y en la de Moodle: `setCode` registra un paso (lienzo, formularios,
 * Limpiar, cargar) y `setCodeFromTyping` agrupa lo tecleado en el panel de código.
 */
export function useCodeHistory(initial: string) {
  const [history, dispatch] = useReducer(reducer, initial, createHistory);

  const setCode = useCallback((code: string) => dispatch({ type: 'commit', code, origin: 'canvas', now: Date.now() }), []);
  const setCodeFromTyping = useCallback(
    (code: string) => dispatch({ type: 'commit', code, origin: 'typing', now: Date.now() }),
    []
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    code: history.present,
    setCode,
    setCodeFromTyping,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
