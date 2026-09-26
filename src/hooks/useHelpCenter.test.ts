// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { readStoredHelpTab } from './useHelpCenter';

describe('readStoredHelpTab — última pestaña de ayuda', () => {
  it('recupera una pestaña válida guardada', () => {
    expect(readStoredHelpTab({ getItem: () => 'steps' })).toBe('steps');
  });

  it('ignora valores desconocidos y abre "Uso del editor"', () => {
    expect(readStoredHelpTab({ getItem: () => 'credits' })).toBe('usage');
    expect(readStoredHelpTab({ getItem: () => null })).toBe('usage');
  });

  it('no rompe la ayuda si el almacenamiento está bloqueado', () => {
    const blocked = { getItem: () => { throw new DOMException('denied', 'SecurityError'); } };
    expect(readStoredHelpTab(blocked)).toBe('usage');
  });

  it('funciona sin almacenamiento disponible (entorno sin window)', () => {
    expect(readStoredHelpTab(undefined)).toBe('usage');
  });
});
