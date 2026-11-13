// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import { AUTOSAVE_TTL_MS, clearAutosave, loadAutosave, saveAutosave } from './autosave';
import { createScormSession, findScormApi, type Scorm12Api } from './scorm12';
import { copyText } from './clipboard';
import { DEFAULT_EXAM_CONFIG, parseExamConfig } from './examConfig';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

const blockedStorage = {
  getItem: () => { throw new Error('SecurityError'); },
  setItem: () => { throw new Error('SecurityError'); },
  removeItem: () => { throw new Error('SecurityError'); },
};

describe('autosave', () => {
  it('guarda y recupera por examen', () => {
    const storage = memoryStorage();
    expect(saveAutosave('ex1', 'entity A "A"', 1000, storage)).toBe(true);
    expect(loadAutosave('ex1', 2000, storage)).toBe('entity A "A"');
    expect(loadAutosave('ex2', 2000, storage)).toBeNull();
  });

  it('descarta y borra un borrador caducado', () => {
    const storage = memoryStorage();
    saveAutosave('ex1', 'old', 0, storage);
    expect(loadAutosave('ex1', AUTOSAVE_TTL_MS + 1, storage)).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it('con localStorage bloqueado o datos corruptos no lanza', () => {
    expect(saveAutosave('ex1', 'x', 0, blockedStorage)).toBe(false);
    expect(loadAutosave('ex1', 0, blockedStorage)).toBeNull();
    expect(() => clearAutosave('ex1', blockedStorage)).not.toThrow();
    const storage = memoryStorage();
    storage.setItem('eer-moodle-autosave:ex1', '{not json');
    expect(loadAutosave('ex1', 0, storage)).toBeNull();
    expect(saveAutosave('ex1', 'x', 0, undefined)).toBe(false);
  });

  it('clearAutosave elimina el borrador', () => {
    const storage = memoryStorage();
    saveAutosave('ex1', 'x', 0, storage);
    clearAutosave('ex1', storage);
    expect(loadAutosave('ex1', 0, storage)).toBeNull();
  });
});

function fakeApi(status = 'not attempted') {
  const values: Record<string, string> = { 'cmi.core.lesson_status': status };
  const api: Scorm12Api = {
    LMSInitialize: vi.fn(() => 'true'),
    LMSFinish: vi.fn(() => 'true'),
    LMSGetValue: vi.fn((k: string) => values[k] ?? ''),
    LMSSetValue: vi.fn((k: string, v: string) => { values[k] = v; return 'true'; }),
    LMSCommit: vi.fn(() => 'true'),
  };
  return { api, values };
}

describe('SCORM 1.2', () => {
  it('encuentra la API en un marco padre', () => {
    const { api } = fakeApi();
    const top: { API?: Scorm12Api; parent?: unknown } = { API: api };
    top.parent = top;
    const child = { parent: { parent: top } };
    expect(findScormApi(child as never)).toBe(api);
  });

  it('busca en opener y tolera marcos de otro origen', () => {
    const { api } = fakeApi();
    const crossOrigin = {};
    Object.defineProperty(crossOrigin, 'API', { get: () => { throw new Error('cross-origin'); } });
    expect(findScormApi({ parent: crossOrigin } as never)).toBeNull();
    expect(findScormApi({ opener: { API: api } } as never)).toBe(api);
    expect(findScormApi({})).toBeNull();
  });

  it('marca incomplete al abrir, completed al entregar y cierra una sola vez', () => {
    const { api, values } = fakeApi();
    const session = createScormSession(api);
    session.start();
    expect(values['cmi.core.lesson_status']).toBe('incomplete');
    session.complete();
    expect(values['cmi.core.lesson_status']).toBe('completed');
    session.finish();
    session.finish();
    session.complete();
    expect(api.LMSFinish).toHaveBeenCalledTimes(1);
  });

  it('no rebaja un intento ya completado al reabrirlo', () => {
    const { api, values } = fakeApi('completed');
    createScormSession(api).start();
    expect(values['cmi.core.lesson_status']).toBe('completed');
  });

  it('sin API o con una API que lanza, no rompe', () => {
    const offline = createScormSession(null);
    expect(offline.connected).toBe(false);
    expect(() => { offline.start(); offline.complete(); offline.finish(); }).not.toThrow();

    const { api } = fakeApi();
    api.LMSSetValue = () => { throw new Error('LMS caído'); };
    const broken = createScormSession(api);
    expect(() => { broken.start(); broken.complete(); broken.finish(); }).not.toThrow();
  });
});

function fakeDocument(execResult: boolean | 'throw') {
  const body = { appendChild: vi.fn(), removeChild: vi.fn() };
  const textarea = { value: '', setAttribute: vi.fn(), select: vi.fn(), style: {} };
  return {
    body,
    createElement: vi.fn(() => textarea),
    execCommand: vi.fn(() => {
      if (execResult === 'throw') throw new Error('no permitido');
      return execResult;
    }),
  } as unknown as Document;
}

describe('copyText', () => {
  it('usa la Clipboard API si está disponible', async () => {
    const clipboard = { writeText: vi.fn(async () => undefined) };
    expect(await copyText('x', { clipboard, document: fakeDocument(true) })).toBe('clipboard');
    expect(clipboard.writeText).toHaveBeenCalledWith('x');
  });

  it('recurre a execCommand si la Clipboard API está bloqueada', async () => {
    const clipboard = { writeText: vi.fn(async () => { throw new Error('NotAllowedError'); }) };
    const doc = fakeDocument(true);
    expect(await copyText('x', { clipboard, document: doc })).toBe('execCommand');
    expect(doc.body.removeChild).toHaveBeenCalled();
  });

  it('informa del fallo si ningún método funciona', async () => {
    expect(await copyText('x', { document: fakeDocument(false) })).toBe('failed');
    expect(await copyText('x', { document: fakeDocument('throw') })).toBe('failed');
    expect(await copyText('x', {})).toBe('failed');
  });
});

describe('parseExamConfig', () => {
  it('lee la configuración incrustada, incluida una plantilla con </script>', () => {
    const json = JSON.stringify({ examId: 'bd', title: 'Examen BD', template: 'entity A "</script>"' }).replace(/</g, '\\u003c');
    expect(parseExamConfig(json)).toEqual({ examId: 'bd', title: 'Examen BD', template: 'entity A "</script>"' });
  });

  it('cae a la configuración por defecto ante JSON ausente, roto o con tipos erróneos', () => {
    expect(parseExamConfig(null)).toEqual(DEFAULT_EXAM_CONFIG);
    expect(parseExamConfig('{roto')).toEqual(DEFAULT_EXAM_CONFIG);
    expect(parseExamConfig(JSON.stringify({ examId: 7, template: ['x'] }))).toEqual(DEFAULT_EXAM_CONFIG);
  });
});
