// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { compileEER } from './compiler';

/*
 * Avisos pedagógicos del linter EER sobre entidades débiles y roles (§3.11 G). Son `warning`:
 * nunca bloquean la compilación ni el dibujo.
 */

const codes = (code: string) => compileEER(code).diagnostics.map(d => `${d.line}:${d.code}`);

const WEAK_OK = `ent EDIFICIO
key_att Codigo -> EDIFICIO
weak_ent AULA
partial_key_att Numero -> AULA
ident_rel TIENE
link EDIFICIO TIENE "1"
link AULA TIENE "N" [total]`;

describe('Linter — entidades débiles y roles (§3.11 G)', () => {
  it('una entidad débil bien modelada no da avisos', () => {
    expect(codes(WEAK_OK)).toEqual([]);
  });

  it('entidad débil sin relación identificativa', () => {
    expect(codes(WEAK_OK.replace('ident_rel TIENE', 'rel TIENE'))).toEqual(['3:WEAK_ENTITY_WITHOUT_IDENTIFYING_RELATIONSHIP']);
  });

  it('entidad débil sin clave parcial', () => {
    expect(codes(WEAK_OK.replace('partial_key_att Numero -> AULA\n', ''))).toEqual(['3:WEAK_ENTITY_WITHOUT_PARTIAL_KEY']);
  });

  it('`key_att` en una entidad débil sugiere `partial_key_att` (y cuenta como clave parcial)', () => {
    expect(codes(WEAK_OK.replace('partial_key_att', 'key_att'))).toEqual(['4:KEY_ATTRIBUTE_ON_WEAK_ENTITY']);
  });

  it('`partial_key_att` en una entidad fuerte sugiere `key_att`', () => {
    expect(codes('ent CLIENTE\npartial_key_att Dni -> CLIENTE')).toEqual(['2:PARTIAL_KEY_ON_STRONG_ENTITY']);
  });

  it('la clave parcial también se reconoce con `link ENTIDAD atributo`', () => {
    expect(codes(WEAK_OK.replace('partial_key_att Numero -> AULA', 'partial_key_att Numero\nlink AULA Numero'))).toEqual([]);
  });

  it('relación recursiva sin roles avisa; con roles, no', () => {
    const recursive = `ent EMPLEADO
key_att Dni -> EMPLEADO
rel SUPERVISA
link EMPLEADO SUPERVISA "1"
link SUPERVISA EMPLEADO "N"`;
    expect(codes(recursive)).toEqual(['3:RECURSIVE_RELATIONSHIP_WITHOUT_ROLES']);
    expect(codes(recursive.replace('"1"', '"1" role:Supervisor').replace('"N"', '"N" role:Supervisado'))).toEqual([]);
  });

  it('los avisos no bloquean: el diagrama sigue siendo válido', () => {
    expect(compileEER('weak_ent SUELTA').isValid).toBe(true);
  });
});
