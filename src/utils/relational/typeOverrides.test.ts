// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { compileEER } from '../compiler';
import { eerToRelational } from './eerToRelational';
import { generateRelationalDSL } from './relationalCodeGenerator';
import { compileRelationalDSL } from './relationalCompiler';
import {
  applyTypeOverrides,
  extractTypeOverrides,
  parseTypeOverrideLine,
  serializeTypeOverrides,
} from './typeOverrides';
import type { RelationalSchema } from '../../types/relational';

/*
 * Tipos relacionales conservados y propagados (§3.11 L3). Caso real de Enrique Soler: cambiar
 * el tipo de la PK de CIRCUITO no cambiaba el de las FK de COMPITE, y cualquier cambio en el
 * EER borraba los tipos editados.
 */

const COMPITE = `ent CIRCUITO
key_att Nombre -> CIRCUITO
key_att Fecha -> CIRCUITO
att Pais -> CIRCUITO
ent PILOTO
key_att Id -> PILOTO
rel COMPITE
link PILOTO COMPITE "N"
link CIRCUITO COMPITE "M"`;

const derive = (eer: string) => {
  const { nodes, links } = compileEER(eer);
  return eerToRelational(nodes, links);
};

const typeOf = (schema: RelationalSchema, table: string, column: string) =>
  schema.tables.find(t => t.name === table)?.columns.find(c => c.name === column)?.dataType;

describe('Tipos relacionales (§3.11 L3)', () => {
  it('el DSL relacional escribe las FK sin tipo y el compilador lo hereda de la columna referenciada', () => {
    const dsl = generateRelationalDSL(derive(COMPITE));
    expect(dsl).toMatch(/^\s+PILOTO_ID PK FK -> PILOTO\(ID\)/m);

    const edited = compileRelationalDSL(dsl.replace(/NOMBRE NUMBER\(10\) PK/, 'NOMBRE VARCHAR2(50) PK'));
    expect(edited.diagnostics.filter(d => d.severity !== 'warning' || d.code === 'FK_TYPE_MISMATCH')).toEqual([]);
    expect(typeOf(edited.schema, 'COMPITE', 'CIRCUITO_NOMBRE')).toBe('VARCHAR2(50)');
  });

  it('un tipo distinto escrito a mano en una FK da FK_TYPE_MISMATCH', () => {
    const result = compileRelationalDSL(`table T {
  ID VARCHAR2(9) PK
}
table R {
  T_ID NUMBER(10) PK FK -> T(ID)
}`);
    expect(result.diagnostics.map(d => d.code)).toContain('FK_TYPE_MISMATCH');
  });

  it('los tipos editados se recuerdan y se reaplican al regenerar desde el EER, propagándose a las FK', () => {
    const inferred = derive(COMPITE);
    const edited = compileRelationalDSL(
      generateRelationalDSL(inferred).replace(/NOMBRE NUMBER\(10\) PK/, 'NOMBRE VARCHAR2(50) PK').replace('PAIS VARCHAR2(100)', 'PAIS CHAR(2)')
    ).schema;
    const overrides = extractTypeOverrides(edited, inferred);
    expect(overrides).toEqual({ 'CIRCUITO.NOMBRE': 'VARCHAR2(50)', 'CIRCUITO.PAIS': 'CHAR(2)' });

    // El alumno cambia el EER (añade un atributo): el modelo se regenera con sus tipos.
    const regenerated = applyTypeOverrides(derive(`${COMPITE}\natt Ciudad -> CIRCUITO`), overrides);
    expect(typeOf(regenerated, 'CIRCUITO', 'NOMBRE')).toBe('VARCHAR2(50)');
    expect(typeOf(regenerated, 'CIRCUITO', 'PAIS')).toBe('CHAR(2)');
    expect(typeOf(regenerated, 'COMPITE', 'CIRCUITO_NOMBRE')).toBe('VARCHAR2(50)');
    expect(typeOf(regenerated, 'COMPITE', 'CIRCUITO_FECHA')).toBe('NUMBER(10)');
  });

  it('volver al tipo inferido olvida el cambio; las FK nunca se recuerdan', () => {
    const inferred = derive(COMPITE);
    const same = compileRelationalDSL(generateRelationalDSL(inferred)).schema;
    expect(extractTypeOverrides(same, inferred)).toEqual({});
  });

  it('applyTypeOverrides no muta el esquema recibido', () => {
    const inferred = derive(COMPITE);
    applyTypeOverrides(inferred, { 'CIRCUITO.NOMBRE': 'VARCHAR2(50)' });
    expect(typeOf(inferred, 'CIRCUITO', 'NOMBRE')).toBe('NUMBER(10)');
  });

  it('serializa y lee las líneas del .eer (orden estable, espacios y mayúsculas tolerados)', () => {
    const lines = serializeTypeOverrides({ 'CIRCUITO.PAIS': 'CHAR(2)', 'CIRCUITO.NOMBRE': 'NUMBER(12, 2)' });
    expect(lines).toEqual(['relational CIRCUITO.NOMBRE : NUMBER(12, 2)', 'relational CIRCUITO.PAIS : CHAR(2)']);
    expect(parseTypeOverrideLine('  relational circuito.nombre :  varchar2(50) ')).toEqual({ key: 'CIRCUITO.NOMBRE', type: 'VARCHAR2(50)' });
    expect(parseTypeOverrideLine('relational CIRCUITO (100, 200)')).toBeNull();
  });

  it('la v1.7.0 ignora la línea nueva: el compilador EER descarta el comando `relational`', () => {
    const result = compileEER(`ent A\nrelational A.ID : VARCHAR2(9)`);
    expect(result.diagnostics).toEqual([]);
    expect(result.nodes).toHaveLength(1);
  });
});
