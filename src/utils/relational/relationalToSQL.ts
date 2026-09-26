// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema, CascadeOption } from '../../types/relational';
import type { Language } from '../../i18n/language';
import { translate } from '../../i18n/translate';
import { translateStep } from '../../i18n/steps';


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
 * Cláusula `ON DELETE` de una FK en el dialecto destino.
 *
 * Oracle solo acepta `ON DELETE CASCADE` y `ON DELETE SET NULL`: `NO ACTION` es su comportamiento
 * implícito y `ON DELETE NO ACTION`/`RESTRICT` literales darían ORA-00905, así que se omiten.
 * El resto de dialectos admite las cuatro acciones y se escriben siempre de forma explícita.
 */
function onDeleteClause(action: CascadeOption, dialect: SQLDialect): string {
  const isOracleImplicit = dialect === 'oracle' && (action === 'NO ACTION' || action === 'RESTRICT');
  return isOracleImplicit ? '' : ` ON DELETE ${action}`;
}

/**
 * Genera el script DDL SQL completo para un esquema relacional.
 * Incluye cabecera explicativa con los 9 pasos formales e instrucciones CREATE TABLE y FKs.
 */
export function relationalToSQL(schema: RelationalSchema, dialect: SQLDialect = 'oracle', lang: Language = 'es'): string {
  const lines: string[] = [];
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
    translate(lang, key, params);

  // Cabecera del archivo DDL
  lines.push(`-- =============================================================================`);
  lines.push(`-- ${t('sqlExport.header.generated')}`);
  lines.push(`-- ${t('sqlExport.header.dialect')} ${dialect.toUpperCase()} ${dialect === 'oracle' ? t('sqlExport.header.universityDialect') : ''}`);
  lines.push(`-- ${t('sqlExport.header.generatedDate')} ${new Date().toISOString()}`);
  lines.push(`-- ${t('sqlExport.header.basedOn')}`);
  lines.push(`-- =============================================================================\n`);

  if (dialect === 'oracle') {
    lines.push(`-- ${t('sqlExport.dropTables')}`);
    schema.tables.forEach(table => {
      lines.push(`-- DROP TABLE ${table.name} CASCADE CONSTRAINTS;`);
    });
    lines.push(``);
  }

  // Generar cada tabla
  schema.tables.forEach(table => {
    const stepText = translateStep(lang, table.stepTrace.stepKey, table.stepTrace.params);
    lines.push(`-- -----------------------------------------------------------------------------`);
    lines.push(`-- ${t('sqlExport.table')} ${table.name}`);
    lines.push(`-- ${t('sqlExport.ruleApplied')} ${stepText.title}`);
    lines.push(`-- ${t('sqlExport.justification')} ${stepText.description}`);
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
      colLines.push(
        `  CONSTRAINT ${fk.constraintName} FOREIGN KEY (${sourceColsStr}) REFERENCES ${fk.targetTableName} (${targetColsStr})${onDeleteClause(fk.onDelete, dialect)}`
      );
    });

    lines.push(colLines.join(',\n'));
    lines.push(`);`);
    lines.push(``);
  });

  return lines.join('\n');
}
