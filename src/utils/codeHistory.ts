// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/*
 * Historial de deshacer/rehacer del DSL EER (§3.11 H), como funciones puras.
 *
 * Todo el estado del diagrama vive en el texto del DSL, así que basta con guardar instantáneas
 * del texto. Las acciones del lienzo y de los formularios (mover, crear, borrar, editar,
 * Limpiar, cargar) son un paso cada una; lo tecleado en el panel de código se agrupa mientras
 * no haya una pausa de un segundo, para que Ctrl+Z no deshaga letra a letra.
 */

export type CodeChangeOrigin = 'canvas' | 'typing';

export interface CodeHistory {
  past: string[];
  present: string;
  future: string[];
  lastOrigin: CodeChangeOrigin | null;
  lastAt: number;
}

export const HISTORY_LIMIT = 100;
export const TYPING_GROUP_MS = 1000;

export function createHistory(initial: string): CodeHistory {
  return { past: [], present: initial, future: [], lastOrigin: null, lastAt: 0 };
}

/** Registra un código nuevo. Un cambio sin diferencia no crea paso (ni vacía el "rehacer"). */
export function commitCode(history: CodeHistory, code: string, origin: CodeChangeOrigin, now: number): CodeHistory {
  const continuesTyping =
    origin === 'typing' && history.lastOrigin === 'typing' && now - history.lastAt < TYPING_GROUP_MS;

  let next: CodeHistory;
  if (code === history.present) {
    next = history;
  } else if (continuesTyping) {
    // Misma ráfaga de tecleo: se sustituye el presente; el estado previo a la ráfaga ya está en `past`.
    next = { ...history, present: code, future: [], lastAt: now };
  } else {
    next = {
      past: [...history.past, history.present].slice(-HISTORY_LIMIT),
      present: code,
      future: [],
      lastOrigin: origin,
      lastAt: now,
    };
  }
  return next;
}

export function undoCode(history: CodeHistory): CodeHistory {
  const previous = history.past[history.past.length - 1];
  const next =
    previous === undefined
      ? history
      : {
          past: history.past.slice(0, -1),
          present: previous,
          future: [history.present, ...history.future],
          // Tras deshacer, lo siguiente que se teclee abre un paso nuevo.
          lastOrigin: null,
          lastAt: 0,
        };
  return next;
}

export function redoCode(history: CodeHistory): CodeHistory {
  const following = history.future[0];
  const next =
    following === undefined
      ? history
      : {
          past: [...history.past, history.present].slice(-HISTORY_LIMIT),
          present: following,
          future: history.future.slice(1),
          lastOrigin: null,
          lastAt: 0,
        };
  return next;
}

/** Atajo de teclado de deshacer/rehacer (Ctrl o Cmd): Z, Y y Mayús+Z. */
export function historyShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): 'undo' | 'redo' | null {
  const key = event.key.toLowerCase();
  const withModifier = (event.ctrlKey || event.metaKey) && !event.altKey;
  const action = !withModifier
    ? null
    : key === 'y' || (key === 'z' && event.shiftKey)
      ? 'redo'
      : key === 'z'
        ? 'undo'
        : null;
  return action;
}
