// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  HISTORY_LIMIT,
  TYPING_GROUP_MS,
  commitCode,
  createHistory,
  historyShortcut,
  redoCode,
  undoCode,
  type CodeHistory,
} from './codeHistory';

const apply = (history: CodeHistory, ...steps: Array<[string, 'canvas' | 'typing', number]>) =>
  steps.reduce((h, [code, origin, at]) => commitCode(h, code, origin, at), history);

describe('Historial de deshacer/rehacer (§3.11 H)', () => {
  it('cada acción del lienzo es un paso y se deshace y rehace en orden', () => {
    let h = apply(createHistory('A'), ['B', 'canvas', 10], ['C', 'canvas', 20]);
    expect(h.present).toBe('C');
    h = undoCode(h);
    expect(h.present).toBe('B');
    h = undoCode(h);
    expect(h.present).toBe('A');
    expect(undoCode(h)).toBe(h); // nada más que deshacer
    h = redoCode(redoCode(h));
    expect(h.present).toBe('C');
    expect(redoCode(h)).toBe(h);
  });

  it('el tecleo seguido se agrupa en un paso; una pausa de un segundo abre otro', () => {
    let h = apply(
      createHistory(''),
      ['e', 'typing', 0],
      ['en', 'typing', 200],
      ['ent', 'typing', 400],
      ['ent A', 'typing', 400 + TYPING_GROUP_MS + 1],
    );
    expect(h.past).toEqual(['', 'ent']);
    h = undoCode(h);
    expect(h.present).toBe('ent');
    expect(undoCode(h).present).toBe('');
  });

  it('una acción del lienzo corta la ráfaga de tecleo', () => {
    const h = apply(createHistory(''), ['x', 'typing', 0], ['x mov', 'canvas', 100], ['x movy', 'typing', 200]);
    expect(h.past).toEqual(['', 'x', 'x mov']);
  });

  it('un cambio nuevo tras deshacer vacía el "rehacer"', () => {
    let h = apply(createHistory('A'), ['B', 'canvas', 10]);
    h = undoCode(h);
    h = commitCode(h, 'C', 'canvas', 30);
    expect(h.future).toEqual([]);
    expect(redoCode(h).present).toBe('C');
  });

  it('tras deshacer, el siguiente tecleo abre un paso nuevo aunque sea inmediato', () => {
    let h = apply(createHistory(''), ['a', 'typing', 0], ['ab', 'typing', 100]);
    h = undoCode(h);
    h = commitCode(h, 'z', 'typing', 150);
    expect(h.past).toEqual(['']);
    expect(undoCode(h).present).toBe('');
  });

  it('un código idéntico no crea paso ni borra el "rehacer"', () => {
    let h = apply(createHistory('A'), ['B', 'canvas', 10]);
    h = undoCode(h);
    expect(commitCode(h, 'A', 'canvas', 20)).toBe(h);
  });

  it('limita el historial a los últimos pasos', () => {
    let h = createHistory('0');
    for (let i = 1; i <= HISTORY_LIMIT + 20; i++) h = commitCode(h, String(i), 'canvas', i);
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(h.past[0]).toBe('20');
  });

  it('reconoce Ctrl/Cmd+Z, Ctrl+Y y Ctrl+Mayús+Z, y nada más', () => {
    const key = (k: string, mods: Partial<KeyboardEvent> = {}) =>
      historyShortcut({ key: k, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods });
    expect(key('z', { ctrlKey: true })).toBe('undo');
    expect(key('Z', { metaKey: true })).toBe('undo');
    expect(key('y', { ctrlKey: true })).toBe('redo');
    expect(key('Z', { ctrlKey: true, shiftKey: true })).toBe('redo');
    expect(key('z')).toBeNull();
    expect(key('z', { ctrlKey: true, altKey: true })).toBeNull();
    expect(key('x', { ctrlKey: true })).toBeNull();
  });
});
