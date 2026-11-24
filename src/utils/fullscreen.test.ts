// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { isFullscreenSupported, toggleFullscreen, type FullscreenDocument } from './fullscreen';

function fakeDocument({ enabled = true, rejects = false } = {}): FullscreenDocument & { calls: string[] } {
  const calls: string[] = [];
  const doc: FullscreenDocument & { calls: string[] } = {
    calls,
    fullscreenEnabled: enabled,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: async () => {
        calls.push('request');
        if (rejects) throw new TypeError('Permissions check failed');
        doc.fullscreenElement = {} as Element;
      },
    },
    exitFullscreen: async () => {
      calls.push('exit');
      doc.fullscreenElement = null;
    },
  };
  return doc;
}

describe('Pantalla completa de la edición Moodle (§3.11 F)', () => {
  it('entra y sale alternativamente', async () => {
    const doc = fakeDocument();
    expect(await toggleFullscreen(doc)).toBe('entered');
    expect(await toggleFullscreen(doc)).toBe('exited');
    expect(doc.calls).toEqual(['request', 'exit']);
  });

  it('sin soporte (iframe sin allowfullscreen) no lo intenta y lo informa', async () => {
    const doc = fakeDocument({ enabled: false });
    expect(isFullscreenSupported(doc)).toBe(false);
    expect(await toggleFullscreen(doc)).toBe('unsupported');
    expect(doc.calls).toEqual([]);
  });

  it('si el navegador lo rechaza, devuelve "failed" en lugar de lanzar', async () => {
    expect(await toggleFullscreen(fakeDocument({ rejects: true }))).toBe('failed');
  });
});
