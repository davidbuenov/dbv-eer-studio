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

/*
 * Relaciones recursivas (§3.11 E): la misma entidad participa dos veces. Hasta la v1.7.0 una
 * M:N recursiva generaba `SUPERVISA(EMPLEADO_DNI, EMPLEADO_DNI)` y dos restricciones
 * `FK_SUPERVISA_EMPLEADO`, un DDL que Oracle rechaza.
 */

const recursive = (card1: string, card2: string, roles = ['', '']) => {
  const role = (r: string) => (r ? ` role:${r}` : '');
  return compileEER(`ent EMPLEADO
key_att Dni -> EMPLEADO
rel SUPERVISA
link EMPLEADO SUPERVISA "${card1}"${role(roles[0]!)}
link EMPLEADO SUPERVISA "${card2}"${role(roles[1]!)}`);
};

const tableOf = (eer: ReturnType<typeof compileEER>, name: string) =>
  eerToRelational(eer.nodes, eer.links).tables.find(t => t.name === name)!;

describe('Relaciones recursivas sin roles (§3.11 E)', () => {
  it('M:N: columnas y restricciones con nombres únicos', () => {
    const supervisa = tableOf(recursive('N', 'M'), 'SUPERVISA');
    expect(supervisa.columns.map(c => c.name)).toEqual(['EMPLEADO_DNI', 'EMPLEADO_DNI_2']);
    expect(supervisa.foreignKeys.map(f => f.constraintName)).toEqual(['FK_SUPERVISA_EMPLEADO', 'FK_SUPERVISA_EMPLEADO_2']);
    expect(supervisa.columns.filter(c => c.isPrimaryKey)).toHaveLength(2);
  });

  it('M:N: la ida y vuelta por el DSL relacional conserva las dos FK', () => {
    const eer = recursive('N', 'M');
    const schema = eerToRelational(eer.nodes, eer.links);
    const back = compileRelationalDSL(generateRelationalDSL(schema));
    expect(back.diagnostics.filter(d => d.code === 'DUPLICATE_COLUMN_NAME')).toEqual([]);
    expect(back.schema.tables.find(t => t.name === 'SUPERVISA')!.foreignKeys.map(f => f.constraintName)).toEqual([
      'FK_SUPERVISA_EMPLEADO',
      'FK_SUPERVISA_EMPLEADO_2',
    ]);
  });

  it('1:N: una sola FK en la propia tabla (sin cambios respecto a la v1.7.0)', () => {
    const empleado = tableOf(recursive('1', 'N'), 'EMPLEADO');
    expect(empleado.columns.map(c => c.name)).toEqual(['DNI', 'EMPLEADO_DNI']);
    expect(empleado.foreignKeys.map(f => f.constraintName)).toEqual(['FK_EMPLEADO_EMPLEADO']);
  });

  it('dos 1:N entre las mismas entidades no repiten columna ni restricción', () => {
    const eer = compileEER(`ent EMPLEADO
key_att Dni -> EMPLEADO
ent DEPARTAMENTO
key_att Numero -> DEPARTAMENTO
rel TRABAJA_EN
link DEPARTAMENTO TRABAJA_EN "1"
link EMPLEADO TRABAJA_EN "N"
rel COLABORA_CON
link DEPARTAMENTO COLABORA_CON "1"
link EMPLEADO COLABORA_CON "N"`);
    const empleado = tableOf(eer, 'EMPLEADO');
    expect(empleado.columns.map(c => c.name)).toEqual(['DNI', 'DEPARTAMENTO_NUMERO', 'DEPARTAMENTO_NUMERO_2']);
    expect(empleado.foreignKeys.map(f => f.constraintName)).toEqual(['FK_EMPLEADO_DEPARTAMENTO', 'FK_EMPLEADO_DEPARTAMENTO_2']);
  });
});
