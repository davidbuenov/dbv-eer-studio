// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { compileRelationalDSL } from './relationalCompiler';

describe('Relational Compiler & Linter (compileRelationalDSL)', () => {
  it('compiles valid relational DSL with tables, PK, and FK successfully', () => {
    const dsl = `
      table DEPARTAMENTO [x: 100, y: 100] {
        ID_DEP INT PK
        NOMBRE VARCHAR(50) NOT NULL
      }

      table PROFESOR [x: 400, y: 100] {
        DNI VARCHAR(9) PK
        NOMBRE VARCHAR(50)
        DEP_ID INT FK -> DEPARTAMENTO(ID_DEP) ON DELETE CASCADE
      }
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(true);
    expect(result.diagnostics.filter(d => d.severity === 'error')).toHaveLength(0);
    expect(result.schema.tables).toHaveLength(2);
    expect(result.schema.tables[0].name).toBe('DEPARTAMENTO');
    expect(result.schema.tables[1].name).toBe('PROFESOR');
    expect(result.schema.tables[1].foreignKeys).toHaveLength(1);
    expect(result.schema.tables[1].foreignKeys[0].targetTableName).toBe('DEPARTAMENTO');
  });

  it('detects missing table name when keyword table has no identifier', () => {
    const dsl = `
      table {
        ID INT PK
      }
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(false);
    const err = result.diagnostics.find(d => d.code === 'MISSING_TABLE_NAME');
    expect(err).toBeDefined();
    expect(err?.severity).toBe('error');
    expect(err?.line).toBe(2);
  });

  it('detects unclosed table block when file ends without closing brace', () => {
    const dsl = `
      table ALUMNO {
        EXPEDIENTE INT PK
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(false);
    const err = result.diagnostics.find(d => d.code === 'UNCLOSED_TABLE_BLOCK');
    expect(err).toBeDefined();
    expect(err?.severity).toBe('error');
    expect(err?.line).toBe(2);
  });

  it('detects unclosed table block when another table begins without closing the previous one', () => {
    const dsl = `
      table A {
        ID_A INT PK
      table B {
        ID_B INT PK
      }
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(false);
    const err = result.diagnostics.find(d => d.code === 'UNCLOSED_TABLE_BLOCK');
    expect(err).toBeDefined();
    expect(err?.params?.name).toBe('A');
  });

  it('flags invalid foreign key syntax', () => {
    const dsl = `
      table A {
        ID INT PK
        REF_B INT FK -> BROKEN_SYNTAX
      }
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(false);
    const err = result.diagnostics.find(d => d.code === 'INVALID_FOREIGN_KEY_SYNTAX');
    expect(err).toBeDefined();
    expect(err?.severity).toBe('error');
  });

  it('correctly handles forward references without false positive undeclared target table', () => {
    // PROFESOR declared before DEPARTAMENTO
    const dsl = `
      table PROFESOR {
        DNI VARCHAR(9) PK
        DEP_ID INT FK -> DEPARTAMENTO(ID_DEP)
      }

      table DEPARTAMENTO {
        ID_DEP INT PK
      }
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(true);
    expect(result.diagnostics.some(d => d.code === 'UNDECLARED_TARGET_TABLE')).toBe(false);
    expect(result.diagnostics.some(d => d.code === 'UNDECLARED_TARGET_COLUMN')).toBe(false);
  });

  it('warns when foreign key points to non-existent table', () => {
    const dsl = `
      table PROFESOR {
        DNI VARCHAR(9) PK
        DEP_ID INT FK -> TABLA_INEXISTENTE(ID)
      }
    `;

    const result = compileRelationalDSL(dsl);
    // Warning does not block validity
    expect(result.isValid).toBe(true);
    const warn = result.diagnostics.find(d => d.code === 'UNDECLARED_TARGET_TABLE');
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warning');
    expect(warn?.params?.table).toBe('TABLA_INEXISTENTE');
  });

  it('warns when foreign key points to non-existent column in existing table', () => {
    const dsl = `
      table DEPARTAMENTO {
        ID_DEP INT PK
      }

      table PROFESOR {
        DNI VARCHAR(9) PK
        DEP_ID INT FK -> DEPARTAMENTO(COLUMNA_FANTASMA)
      }
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(true);
    const warn = result.diagnostics.find(d => d.code === 'UNDECLARED_TARGET_COLUMN');
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warning');
    expect(warn?.params?.col).toBe('COLUMNA_FANTASMA');
  });

  it('emits pedagogical warning when table has columns but lacks a primary key', () => {
    const dsl = `
      table LOGS {
        MENSAJE VARCHAR(255)
        FECHA DATE
      }
    `;

    const result = compileRelationalDSL(dsl);
    expect(result.isValid).toBe(true);
    const warn = result.diagnostics.find(d => d.code === 'TABLE_WITHOUT_PK');
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warning');
    expect(warn?.params?.name).toBe('LOGS');
  });

  it('emits warning when duplicate table names are declared', () => {
    const dsl = `
      table A {
        ID INT PK
      }
      table A {
        NOMBRE VARCHAR(50)
      }
    `;

    const result = compileRelationalDSL(dsl);
    const warn = result.diagnostics.find(d => d.code === 'DUPLICATE_TABLE_NAME');
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warning');
  });
});

describe('compileRelationalDSL — acciones referenciales (v1.6.0)', () => {
  const dsl = (clause: string) => `table DEPTO {\n  ID NUMBER(10) PK\n}\n\ntable PROFESOR {\n  ID NUMBER(10) PK\n  DEPTO_ID NUMBER(10) FK -> DEPTO(ID)${clause}\n}`;

  it('sin cláusula ON DELETE asume NO ACTION (nunca CASCADE en silencio)', () => {
    const result = compileRelationalDSL(dsl(''));
    expect(result.schema.tables[1]!.foreignKeys[0]!.onDelete).toBe('NO ACTION');
  });

  it.each(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as const)('acepta ON DELETE %s', action => {
    const result = compileRelationalDSL(dsl(` ON DELETE ${action}`));
    expect(result.isValid).toBe(true);
    expect(result.schema.tables[1]!.foreignKeys[0]!.onDelete).toBe(action);
  });

  it('tolera espacios múltiples y minúsculas en la acción', () => {
    const result = compileRelationalDSL(dsl(' on delete set   null'));
    expect(result.schema.tables[1]!.foreignKeys[0]!.onDelete).toBe('SET NULL');
  });

  it('marca error bloqueante ante una acción desconocida', () => {
    const result = compileRelationalDSL(dsl(' ON DELETE BORRAR'));
    expect(result.isValid).toBe(false);
    expect(result.diagnostics.map(d => d.code)).toContain('INVALID_REFERENTIAL_ACTION');
  });

  it('una FK marcada NOT NULL no es nullable', () => {
    const result = compileRelationalDSL(dsl('').replace('NUMBER(10) FK', 'NUMBER(10) NOT NULL FK'));
    expect(result.schema.tables[1]!.columns[1]!.isNullable).toBe(false);
  });
});
