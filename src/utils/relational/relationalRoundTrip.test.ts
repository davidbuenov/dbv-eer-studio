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
import { relationalToSQL, type SQLDialect } from './relationalToSQL';
import type { RelationalSchema } from '../../types/relational';

/*
 * Ida y vuelta motor → DSL relacional → compilador → SQL (§3.11 L2 y L5). El DSL relacional
 * es lo que el alumno edita: cualquier cosa que el motor genere bien y el DSL no sepa expresar
 * se corrompe en cuanto se toca la pestaña relacional (caso real de Enrique Soler: FK
 * compuesta partida en dos, que Oracle rechaza con ORA-02270).
 */

const deriveSchema = (eer: string) => {
  const { nodes, links } = compileEER(eer);
  return eerToRelational(nodes, links);
};

const roundTrip = (schema: RelationalSchema) => {
  const result = compileRelationalDSL(generateRelationalDSL(schema));
  expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([]);
  return result.schema;
};

const fksOf = (schema: RelationalSchema, table: string) =>
  schema.tables
    .find(t => t.name === table)!
    .foreignKeys.map(f => `${f.sourceColumnNames.join(',')}->${f.targetTableName}(${f.targetColumnNames.join(',')}) ${f.onDelete}`);

const sqlWithoutHeader = (schema: RelationalSchema, dialect: SQLDialect = 'oracle') =>
  relationalToSQL(schema, dialect).replace(/^--.*$/gm, '').replace(/\n{2,}/g, '\n');

const COMPITE = `ent CIRCUITO
key_att Nombre -> CIRCUITO
key_att Fecha -> CIRCUITO
ent PILOTO
key_att Id -> PILOTO
rel COMPITE
link PILOTO COMPITE "N"
link CIRCUITO COMPITE "M"`;

const DIRIGE_1_1 = `ent EMPLEADO
key_att Dni -> EMPLEADO
ent DEPARTAMENTO
key_att Numero -> DEPARTAMENTO
rel DIRIGE
link EMPLEADO DIRIGE "1"
link DEPARTAMENTO DIRIGE "1" [total]`;

describe('DSL relacional — FK compuestas (§3.11 L2)', () => {
  it('una FK compuesta sobrevive a la ida y vuelta por el DSL relacional como UNA restricción', () => {
    const schema = deriveSchema(COMPITE);
    const back = roundTrip(schema);

    expect(fksOf(back, 'COMPITE')).toEqual(fksOf(schema, 'COMPITE'));
    expect(fksOf(back, 'COMPITE')).toContain('CIRCUITO_NOMBRE,CIRCUITO_FECHA->CIRCUITO(NOMBRE,FECHA) NO ACTION');
  });

  it('el SQL generado tras editar el DSL relacional coincide con el del motor', () => {
    const schema = deriveSchema(COMPITE);
    expect(sqlWithoutHeader(roundTrip(schema)).replace(/-- Regla.*|-- Justificaci.*/g, '')).toContain(
      'FOREIGN KEY (CIRCUITO_NOMBRE, CIRCUITO_FECHA) REFERENCES CIRCUITO (NOMBRE, FECHA)',
    );
  });

  it('los nombres de restricción del compilador coinciden con los del motor', () => {
    const schema = deriveSchema(COMPITE);
    const names = (s: RelationalSchema) => s.tables.flatMap(t => t.foreignKeys.map(f => f.constraintName));
    expect(names(roundTrip(schema))).toEqual(names(schema));
  });

  it('acepta la sintaxis de tabla `FK (a, b) -> T(x, y)` escrita a mano', () => {
    const result = compileRelationalDSL(`table T {
  ID NUMBER(10) PK
  A NUMBER(10)
}
table R {
  X NUMBER(10) PK
  Y NUMBER(10) PK
  FK (X, Y) -> T(ID, A) ON DELETE CASCADE
}`);
    const fk = result.schema.tables[1]!.foreignKeys[0]!;
    expect(fk.sourceColumnNames).toEqual(['X', 'Y']);
    expect(fk.targetColumnNames).toEqual(['ID', 'A']);
    expect(fk.onDelete).toBe('CASCADE');
    expect(result.schema.tables[1]!.columns.every(c => c.isForeignKey)).toBe(true);
  });

  it('error si el número de columnas origen y destino no coincide', () => {
    const result = compileRelationalDSL(`table T {
  ID NUMBER(10) PK
}
table R {
  X NUMBER(10) PK
  Y NUMBER(10)
  FK (X, Y) -> T(ID)
}`);
    expect(result.diagnostics.map(d => d.code)).toContain('INVALID_FOREIGN_KEY_SYNTAX');
    expect(result.isValid).toBe(false);
  });

  it('avisa si una FK referencia solo parte de la PK del destino', () => {
    const result = compileRelationalDSL(`table CIRCUITO {
  NOMBRE NUMBER(10) PK
  FECHA NUMBER(10) PK
}
table COMPITE {
  CIRCUITO_NOMBRE NUMBER(10) PK FK -> CIRCUITO(NOMBRE)
}`);
    expect(result.diagnostics.map(d => d.code)).toContain('FK_NOT_REFERENCING_KEY');
  });
});

describe('DSL relacional y SQL — UNIQUE (§3.11 L5)', () => {
  it('la FK de una 1:1 es UNIQUE en el SQL (si no, la 1:1 sería una 1:N)', () => {
    const sql = sqlWithoutHeader(deriveSchema(DIRIGE_1_1));
    // En Oracle (por defecto) `UQ_DEPARTAMENTO_DIRIGE_EMPLEADO_DNI` pasa de 30 caracteres: se abrevia.
    expect(sql).toMatch(/CONSTRAINT UQ_DEPARTAMENTO_1 UNIQUE \(DIRIGE_EMPLEADO_DNI\)/);
    expect(sqlWithoutHeader(deriveSchema(DIRIGE_1_1), 'postgres')).toMatch(
      /CONSTRAINT UQ_DEPARTAMENTO_DIRIGE_EMPLEADO_DNI UNIQUE \(DIRIGE_EMPLEADO_DNI\)/
    );
  });

  it('UNIQUE sobrevive a la ida y vuelta por el DSL relacional', () => {
    const schema = deriveSchema(DIRIGE_1_1);
    const back = roundTrip(schema);
    const col = back.tables.find(t => t.name === 'DEPARTAMENTO')!.columns.find(c => c.name === 'DIRIGE_EMPLEADO_DNI')!;
    expect(col.isUnique).toBe(true);
    expect(sqlWithoutHeader(back)).toContain('UNIQUE (DIRIGE_EMPLEADO_DNI)');
  });

  it('una 1:1 hacia una PK compuesta lleva UN UNIQUE de tabla, no uno por columna', () => {
    const schema = deriveSchema(`ent CIRCUITO
key_att Nombre -> CIRCUITO
key_att Fecha -> CIRCUITO
ent TROFEO
key_att Id -> TROFEO
rel PREMIA
link CIRCUITO PREMIA "1"
link TROFEO PREMIA "1" [total]`);
    const trofeo = schema.tables.find(t => t.name === 'TROFEO')!;
    expect(trofeo.columns.filter(c => c.isUnique && !c.isPrimaryKey)).toEqual([]);
    expect(trofeo.uniqueConstraints).toEqual([['PREMIA_CIRCUITO_NOMBRE', 'PREMIA_CIRCUITO_FECHA']]);
    expect(sqlWithoutHeader(roundTrip(schema))).toContain('UNIQUE (PREMIA_CIRCUITO_NOMBRE, PREMIA_CIRCUITO_FECHA)');
  });

  it('acepta `UNIQUE` en columna y `UNIQUE (a, b)` de tabla escritos a mano', () => {
    const result = compileRelationalDSL(`table CLIENTE {
  ID NUMBER(10) PK
  EMAIL VARCHAR2(100) NOT NULL UNIQUE
  NOMBRE VARCHAR2(100)
  APELLIDO VARCHAR2(100)
  UNIQUE (NOMBRE, APELLIDO)
}`);
    const table = result.schema.tables[0]!;
    expect(result.isValid).toBe(true);
    expect(table.columns.find(c => c.name === 'EMAIL')?.isUnique).toBe(true);
    expect(table.uniqueConstraints).toEqual([['NOMBRE', 'APELLIDO']]);
  });
});

describe('DSL relacional — tipos con espacios', () => {
  it('`NUMBER(12, 2)` sobrevive a la ida y vuelta (antes volvía como `NUMBER(12,`)', () => {
    const result = compileRelationalDSL(`table PRODUCTO {
  ID NUMBER(10) PK
  PRECIO NUMBER(12, 2) NOT NULL
}`);
    expect(result.schema.tables[0]!.columns[1]).toMatchObject({ dataType: 'NUMBER(12, 2)', isNullable: false });
  });
});
