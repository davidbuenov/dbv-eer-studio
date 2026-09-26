// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { relationalToSQL } from './relationalToSQL';
import type { RelationalSchema } from '../../types/relational';

function buildSchema(): RelationalSchema {
  return {
    config: { inheritanceOptions: {}, oneToOneOptions: {} },
    tables: [
      {
        id: 't1',
        name: 'CLIENTE',
        x: 0,
        y: 0,
        stepTrace: { stepNumber: 1, stepKey: 'STEP1_STRONG_ENTITY', params: { tableName: 'CLIENTE', entityLabel: 'CLIENTE' } },
        columns: [
          { id: 'c1', name: 'ID_CLIENTE', dataType: 'NUMBER(10)', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true },
          { id: 'c2', name: 'NOMBRE', dataType: 'VARCHAR2(100)', isPrimaryKey: false, isForeignKey: false, isNullable: true, isUnique: false },
          { id: 'c3', name: 'ACTIVO', dataType: 'NUMBER(1)', isPrimaryKey: false, isForeignKey: false, isNullable: true, isUnique: false },
        ],
        foreignKeys: [],
      },
      {
        id: 't2',
        name: 'PEDIDO',
        x: 0,
        y: 0,
        stepTrace: { stepNumber: 4, stepKey: 'STEP4_FK_ONE_TO_MANY', params: { tableOneName: 'CLIENTE', tableManyName: 'PEDIDO' } },
        columns: [
          { id: 'p1', name: 'ID_PEDIDO', dataType: 'NUMBER(10)', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true },
          { id: 'p2', name: 'CLIENTE_ID_CLIENTE', dataType: 'NUMBER(10)', isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false },
        ],
        foreignKeys: [
          {
            id: 'fk1',
            constraintName: 'FK_PEDIDO_CLIENTE',
            sourceColumnNames: ['CLIENTE_ID_CLIENTE'],
            targetTableName: 'CLIENTE',
            targetColumnNames: ['ID_CLIENTE'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      },
    ],
  };
}

describe('relationalToSQL', () => {
  it('genera CREATE TABLE con la PK y la FK con ON DELETE CASCADE para el dialecto Oracle', () => {
    const sql = relationalToSQL(buildSchema(), 'oracle');

    expect(sql).toContain('CREATE TABLE CLIENTE (');
    expect(sql).toContain('CONSTRAINT PK_CLIENTE PRIMARY KEY (ID_CLIENTE)');
    expect(sql).toContain('CONSTRAINT FK_PEDIDO_CLIENTE FOREIGN KEY (CLIENTE_ID_CLIENTE) REFERENCES CLIENTE (ID_CLIENTE) ON DELETE CASCADE');
    // Oracle debe conservar NUMBER(1) para el flag booleano
    expect(sql).toMatch(/ACTIVO\s+NUMBER\(1\)/);
  });

  it('traduce los tipos de dato al dialecto PostgreSQL (NUMBER→NUMERIC, NUMBER(1)→BOOLEAN)', () => {
    const sql = relationalToSQL(buildSchema(), 'postgres');

    expect(sql).toMatch(/ID_CLIENTE\s+NUMERIC\(10\)/);
    expect(sql).toMatch(/ACTIVO\s+BOOLEAN/);
  });

  it('traduce los tipos de dato al dialecto SQLite (VARCHAR2→TEXT, NUMBER(10)→INTEGER)', () => {
    const sql = relationalToSQL(buildSchema(), 'sqlite');

    expect(sql).toMatch(/NOMBRE\s+TEXT/);
    expect(sql).toMatch(/ID_CLIENTE\s+INTEGER/);
  });

  it('marca las columnas nullable como NULL y las no-nullable como NOT NULL', () => {
    const sql = relationalToSQL(buildSchema(), 'ansi');

    expect(sql).toMatch(/ID_CLIENTE\s+\S+\s+NOT NULL/);
    expect(sql).toMatch(/NOMBRE\s+\S+\s+NULL\b/);
  });

  it('genera una tabla por cada tabla del esquema, en orden', () => {
    const sql = relationalToSQL(buildSchema(), 'oracle');
    const clienteIndex = sql.indexOf('CREATE TABLE CLIENTE');
    const pedidoIndex = sql.indexOf('CREATE TABLE PEDIDO');

    expect(clienteIndex).toBeGreaterThanOrEqual(0);
    expect(pedidoIndex).toBeGreaterThan(clienteIndex);
  });
});

describe('relationalToSQL — acciones referenciales por dialecto (v1.6.0)', () => {
  function schemaWith(onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION') {
    const schema = buildSchema();
    schema.tables[1]!.foreignKeys[0]!.onDelete = onDelete;
    return schema;
  }

  it('Oracle emite SET NULL (antes se perdía)', () => {
    expect(relationalToSQL(schemaWith('SET NULL'), 'oracle')).toContain('REFERENCES CLIENTE (ID_CLIENTE) ON DELETE SET NULL');
  });

  it.each(['NO ACTION', 'RESTRICT'] as const)('Oracle omite la cláusula para %s (evita ORA-00905)', action => {
    const sql = relationalToSQL(schemaWith(action), 'oracle');
    expect(sql).toContain('REFERENCES CLIENTE (ID_CLIENTE)');
    expect(sql).not.toContain('ON DELETE');
  });

  it.each(['postgres', 'mysql', 'sqlite', 'ansi'] as const)('%s escribe NO ACTION de forma explícita', dialect => {
    expect(relationalToSQL(schemaWith('NO ACTION'), dialect)).toContain('ON DELETE NO ACTION');
  });
});
