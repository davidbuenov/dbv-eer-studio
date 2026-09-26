// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { EER_SYNTAX, RELATIONAL_SYNTAX } from './syntaxExamples';
import { compileEER } from '../../utils/compiler';
import { compileRelationalDSL } from '../../utils/relational/relationalCompiler';

const eerExamples = EER_SYNTAX.flatMap(s => s.examples);
const relationalExamples = RELATIONAL_SYNTAX.flatMap(s => s.examples).filter(e => e.compiles !== false);

describe('Guía de sintaxis — todo ejemplo mostrado al alumno es DSL válido', () => {
  it.each(eerExamples.map(e => [e.code]))('EER: %s compila sin errores', code => {
    const result = compileEER(code);
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([]);
  });

  it('EER: todos los ejemplos juntos forman un diagrama sin errores', () => {
    expect(compileEER(eerExamples.map(e => e.code).join('\n')).isValid).toBe(true);
  });

  it.each(relationalExamples.map(e => [e.code]))('Relacional: %s compila dentro de una tabla', code => {
    const result = compileRelationalDSL(`table T {\n  ID NUMBER(10) PK\n  ${code}\n}`);
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([]);
  });
});
