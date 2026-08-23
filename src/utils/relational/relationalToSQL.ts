// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema } from '../../types/relational';


/**
 * Dialectos SQL soportados para la exportación de DDL.
 * 'oracle' es el dialecto docente principal y por defecto en entornos universitarios.
 */
export type SQLDialect = 'oracle' | 'postgres' | 'mysql' | 'sqlite' | 'ansi';

/**
 * Mapea tipos de datos lógicos al dialecto destino específico
 */
function mapDataTypeToDialect(dataType: string, dialect: SQLDialect): string {
  const dt = dataType.toUpperCase();

  if (dialect === 'oracle') {
    if (dt.startsWith('VARCHAR')) return dt.replace('VARCHAR(', 'VARCHAR2(');
    if (dt.startsWith('INT') || dt === 'INTEGER') return 'NUMBER(10)';
    if (dt === 'BOOLEAN') return 'NUMBER(1)';
    if (dt === 'FLOAT' || dt === 'DOUBLE') return 'NUMBER(12, 4)';
    return dt;
  }

  if (dialect === 'postgres') {
    if (dt.startsWith('VARCHAR2')) return dt.replace('VARCHAR2(', 'VARCHAR(');
    if (dt.startsWith('NUMBER(1)')) return 'BOOLEAN';
    if (dt.startsWith('NUMBER')) return dt.replace('NUMBER', 'NUMERIC');
    return dt;
  }

  if (dialect === 'sqlite') {
    if (dt.includes('VARCHAR') || dt.includes('TEXT')) return 'TEXT';
    if (dt.includes('INT') || dt.includes('NUMBER(10)')) return 'INTEGER';
    if (dt.includes('NUMBER') || dt.includes('DECIMAL') || dt.includes('FLOAT')) return 'REAL';
    if (dt.includes('DATE') || dt.includes('TIME')) return 'TEXT';
    return 'TEXT';
  }

  return dt;
}

/**
 * Genera el script DDL SQL completo para un esquema relacional.
 * Incluye cabecera explicativa con los 9 pasos formales e instrucciones CREATE TABLE y FKs.
 */
export function relationalToSQL(schema: RelationalSchema, dialect: SQLDialect = 'oracle'): string {
  const lines: string[] = [];

  // Cabecera del archivo DDL
  lines.push(`-- =============================================================================`);
  lines.push(`-- Script SQL DDL generado automáticamente por eer-studio`);
  lines.push(`-- Dialecto Destino: ${dialect.toUpperCase()} ${dialect === 'oracle' ? '(Dialecto Universitario Principal)' : ''}`);
  lines.push(`-- Fecha de Generación: ${new Date().toISOString()}`);
  lines.push(`-- Basado en el Algoritmo Formal de Mapeo EER-a-Relacional (Pasos 1-9)`);
  lines.push(`-- =============================================================================\n`);

  if (dialect === 'oracle') {
    lines.push(`-- Borrado previo de tablas (si existen)`);
    schema.tables.forEach(table => {
      lines.push(`-- DROP TABLE ${table.name} CASCADE CONSTRAINTS;`);
    });
    lines.push(``);
  }

  // Generar cada tabla
  schema.tables.forEach(table => {
    lines.push(`-- -----------------------------------------------------------------------------`);
    lines.push(`-- Tabla: ${table.name}`);
    lines.push(`-- Regla Aplicada: ${table.stepTrace.stepTitle}`);
    lines.push(`-- Justificación: ${table.stepTrace.description}`);
    lines.push(`-- -----------------------------------------------------------------------------`);
    lines.push(`CREATE TABLE ${table.name} (`);

    const colLines: string[] = [];

    // Columnas
    table.columns.forEach(col => {
      const typeStr = mapDataTypeToDialect(col.dataType, dialect);
      const nullStr = col.isNullable ? 'NULL' : 'NOT NULL';
      const defaultStr = col.defaultValue ? ` DEFAULT ${col.defaultValue}` : '';
      colLines.push(`  ${col.name.padEnd(25)} ${typeStr.padEnd(15)} ${nullStr}${defaultStr}`);
    });

    // Clave Primaria (PK)
    const pkCols = table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
    if (pkCols.length > 0) {
      const pkName = `PK_${table.name}`;
      colLines.push(`  CONSTRAINT ${pkName} PRIMARY KEY (${pkCols.join(', ')})`);
    }

    // Claves Foráneas (FK) inline o como constraints
    table.foreignKeys.forEach(fk => {
      const sourceColsStr = fk.sourceColumnNames.join(', ');
      const targetColsStr = fk.targetColumnNames.join(', ');
      const cascadeStr = fk.onDelete === 'CASCADE' ? ' ON DELETE CASCADE' : '';
      colLines.push(
        `  CONSTRAINT ${fk.constraintName} FOREIGN KEY (${sourceColsStr}) REFERENCES ${fk.targetTableName} (${targetColsStr})${cascadeStr}`
      );
    });

    lines.push(colLines.join(',\n'));
    lines.push(`);`);
    lines.push(``);
  });

  return lines.join('\n');
}
