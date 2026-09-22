// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type {
  RelationalTable,
  RelationalColumn,
  ForeignKeyConstraint,
  CascadeOption,
} from '../../types/relational';
import type { Diagnostic, CompileRelationalResult } from '../../types/compiler';

/**
 * Compila y valida el código DSL del Modelo Relacional línea a línea.
 *
 * Emite diagnósticos en dos niveles:
 * - severity === 'error': Errores de sintaxis bloqueantes (ej: tabla sin nombre, bloque sin cerrar, FK rota).
 * - severity === 'warning': Advertencias semánticas docentes (ej: FK hacia tabla no declarada, tabla sin PK, duplicados).
 *
 * Utiliza un enfoque multi-pasada para resolver referencias cruzadas (forward references)
 * sin emitir falsos positivos de integridad referencial.
 */
export function compileRelationalDSL(code: string): CompileRelationalResult {
  const lines = code.split('\n');
  const diagnostics: Diagnostic[] = [];
  const tables: RelationalTable[] = [];

  let currentTable: Partial<RelationalTable> | null = null;
  let currentColumns: RelationalColumn[] = [];
  let currentFKs: ForeignKeyConstraint[] = [];
  let currentTableStartLine = 1;

  let defaultX = 100;
  let defaultY = 100;

  const declaredTableNames = new Set<string>();

  // =========================================================================
  // PASE 1: Análisis Sintáctico línea por línea
  // =========================================================================
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Ignorar líneas vacías y comentarios
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }

    // 1. Declaración de inicio de tabla: table NOMBRE [x: N, y: N] {
    if (/^table\b/i.test(trimmed)) {
      // Si ya había una tabla abierta y encontramos otra 'table', error por llave sin cerrar
      if (currentTable) {
        diagnostics.push({
          line: currentTableStartLine,
          severity: 'error',
          code: 'UNCLOSED_TABLE_BLOCK',
          messageKey: 'compiler.unclosedTableBlock',
          params: { name: currentTable.name ?? 'UNKNOWN' },
        });
        // Cerramos la tabla anterior de forma forzada para procesar la nueva
        tables.push({
          id: currentTable.id!,
          name: currentTable.name!,
          columns: currentColumns,
          foreignKeys: currentFKs,
          x: currentTable.x!,
          y: currentTable.y!,
          stepTrace: currentTable.stepTrace!,
          lineIndex: currentTable.lineIndex!,
        });
        currentTable = null;
      }

      const tableMatch = trimmed.match(
        /^table\s+([A-Za-z0-9_]+)(?:\s*\[\s*x:\s*(-?\d+)\s*,\s*y:\s*(-?\d+)\s*\])?\s*\{/i
      );

      if (!tableMatch) {
        // Analizar causas específicas del fallo
        const nameMatch = trimmed.match(/^table\s+([A-Za-z0-9_]+)/i);
        if (!nameMatch) {
          diagnostics.push({
            line: lineNum,
            severity: 'error',
            code: 'MISSING_TABLE_NAME',
            messageKey: 'compiler.missingTableName',
            params: {},
          });
        } else if (!trimmed.includes('{')) {
          diagnostics.push({
            line: lineNum,
            severity: 'error',
            code: 'MISSING_TABLE_NAME',
            messageKey: 'compiler.missingTableName',
            params: {},
          });
        }
        continue;
      }

      const tableName = tableMatch[1]!.toUpperCase();
      const x = tableMatch[2] ? parseInt(tableMatch[2], 10) : defaultX;
      const y = tableMatch[3] ? parseInt(tableMatch[3], 10) : defaultY;

      defaultX += 300;
      if (defaultX > 1000) {
        defaultX = 100;
        defaultY += 250;
      }

      if (declaredTableNames.has(tableName)) {
        diagnostics.push({
          line: lineNum,
          severity: 'warning',
          code: 'DUPLICATE_TABLE_NAME',
          messageKey: 'compiler.duplicateTableName',
          params: { name: tableName },
        });
      } else {
        declaredTableNames.add(tableName);
      }

      currentTable = {
        id: `table_${tableName}`,
        name: tableName,
        x,
        y,
        lineIndex: lineNum,
        stepTrace: {
          stepNumber: 1,
          stepKey: 'DSL_TABLE',
          params: { tableName },
        },
      };
      currentColumns = [];
      currentFKs = [];
      currentTableStartLine = lineNum;
      continue;
    }

    // 2. Cierre de tabla: }
    if (trimmed === '}') {
      if (currentTable) {
        tables.push({
          id: currentTable.id!,
          name: currentTable.name!,
          columns: currentColumns,
          foreignKeys: currentFKs,
          x: currentTable.x!,
          y: currentTable.y!,
          stepTrace: currentTable.stepTrace!,
          lineIndex: currentTable.lineIndex!,
        });
        currentTable = null;
        currentColumns = [];
        currentFKs = [];
      } else {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          code: 'UNCLOSED_TABLE_BLOCK',
          messageKey: 'compiler.unknownCommand',
          params: { command: '}' },
        });
      }
      continue;
    }

    // 3. Declaración de Columna dentro de una tabla
    if (currentTable) {
      const isPK = /\bPK\b/i.test(trimmed);
      const isNotNull = /\bNOT NULL\b/i.test(trimmed);
      const hasFKKeyword = /\bFK\b/i.test(trimmed);

      // Comprobar formato de clave foránea si contiene 'FK'
      if (hasFKKeyword) {
        const fkMatch = trimmed.match(
          /^([A-Za-z0-9_]+)\s+([A-Za-z0-9_(),]+).*?\bFK\s*->\s*([A-Za-z0-9_]+)\(([A-Za-z0-9_]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|SET NULL|RESTRICT))?/i
        );

        if (!fkMatch) {
          diagnostics.push({
            line: lineNum,
            severity: 'error',
            code: 'INVALID_FOREIGN_KEY_SYNTAX',
            messageKey: 'compiler.invalidFKSyntax',
            params: {},
          });
          continue;
        }

        const colName = fkMatch[1]!.toUpperCase();
        const dataType = fkMatch[2]!.toUpperCase();
        const targetTable = fkMatch[3]!.toUpperCase();
        const targetCol = fkMatch[4]!.toUpperCase();
        const cascadeOpt = (fkMatch[5]?.toUpperCase() ?? 'CASCADE') as CascadeOption;

        if (currentColumns.some(c => c.name === colName)) {
          diagnostics.push({
            line: lineNum,
            severity: 'warning',
            code: 'DUPLICATE_COLUMN_NAME',
            messageKey: 'compiler.duplicateColumnName',
            params: { col: colName, table: currentTable.name ?? '' },
          });
        }

        currentColumns.push({
          id: `${currentTable.name}_${colName}`,
          name: colName,
          dataType,
          isPrimaryKey: isPK,
          isForeignKey: true,
          isNullable: !isNotNull && !isPK,
          isUnique: isPK,
        });

        currentFKs.push({
          id: `FK_${currentTable.name}_${targetTable}_${colName}`,
          constraintName: `FK_${currentTable.name}_${targetTable}_${colName}`,
          sourceColumnNames: [colName],
          targetTableName: targetTable,
          targetColumnNames: [targetCol],
          onDelete: cascadeOpt,
          onUpdate: 'CASCADE',
          lineIndex: lineNum,
        });
        continue;
      }

      // Columna normal (sin FK)
      const colMatch = trimmed.match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_(),]+)/);
      if (colMatch) {
        const colName = colMatch[1]!.toUpperCase();
        const dataType = colMatch[2]!.toUpperCase();

        if (currentColumns.some(c => c.name === colName)) {
          diagnostics.push({
            line: lineNum,
            severity: 'warning',
            code: 'DUPLICATE_COLUMN_NAME',
            messageKey: 'compiler.duplicateColumnName',
            params: { col: colName, table: currentTable.name ?? '' },
          });
        }

        currentColumns.push({
          id: `${currentTable.name}_${colName}`,
          name: colName,
          dataType,
          isPrimaryKey: isPK,
          isForeignKey: false,
          isNullable: !isNotNull && !isPK,
          isUnique: isPK,
        });
        continue;
      }

      // Línea irreconocible dentro de tabla
      diagnostics.push({
        line: lineNum,
        severity: 'error',
        code: 'INVALID_COLUMN_DEFINITION',
        messageKey: 'compiler.unknownCommand',
        params: { command: trimmed },
      });
      continue;
    }

    // Línea fuera de tabla no reconocida
    diagnostics.push({
      line: lineNum,
      severity: 'error',
      code: 'UNKNOWN_COMMAND',
      messageKey: 'compiler.unknownCommand',
      params: { command: trimmed },
    });
  }

  // Si el archivo terminó y quedó una tabla sin cerrar con '}'
  if (currentTable) {
    diagnostics.push({
      line: currentTableStartLine,
      severity: 'error',
      code: 'UNCLOSED_TABLE_BLOCK',
      messageKey: 'compiler.unclosedTableBlock',
      params: { name: currentTable.name ?? 'UNKNOWN' },
    });
    tables.push({
      id: currentTable.id!,
      name: currentTable.name!,
      columns: currentColumns,
      foreignKeys: currentFKs,
      x: currentTable.x!,
      y: currentTable.y!,
      stepTrace: currentTable.stepTrace!,
      lineIndex: currentTable.lineIndex!,
    });
  }

  // =========================================================================
  // PASE 2: Linter Semántico y Verificación de Integridad Referencial
  // =========================================================================
  const validTableMap = new Map<string, RelationalTable>();
  tables.forEach(t => validTableMap.set(t.name.toUpperCase(), t));

  tables.forEach(table => {
    // 1. Advertencia pedagógica: Tabla sin Primary Key
    const hasPK = table.columns.some(c => c.isPrimaryKey);
    if (!hasPK && table.columns.length > 0) {
      diagnostics.push({
        line: table.lineIndex ?? 1,
        severity: 'warning',
        code: 'TABLE_WITHOUT_PK',
        messageKey: 'compiler.tableWithoutPK',
        params: { name: table.name },
      });
    }

    // 2. Validación de Integridad Referencial de Claves Foráneas
    table.foreignKeys.forEach(fk => {
      const fkLine = fk.lineIndex ?? table.lineIndex ?? 1;
      const targetTable = validTableMap.get(fk.targetTableName.toUpperCase());

      if (!targetTable) {
        diagnostics.push({
          line: fkLine,
          severity: 'warning',
          code: 'UNDECLARED_TARGET_TABLE',
          messageKey: 'compiler.undeclaredTargetTable',
          params: { table: fk.targetTableName },
        });
      } else {
        // Verificar que la columna destino exista dentro de la tabla destino
        const targetColName = fk.targetColumnNames[0]?.toUpperCase();
        if (targetColName && !targetTable.columns.some(c => c.name.toUpperCase() === targetColName)) {
          diagnostics.push({
            line: fkLine,
            severity: 'warning',
            code: 'UNDECLARED_TARGET_COLUMN',
            messageKey: 'compiler.undeclaredTargetColumn',
            params: { col: targetColName, table: fk.targetTableName },
          });
        }
      }
    });
  });

  const isValid = !diagnostics.some(d => d.severity === 'error');

  return {
    isValid,
    schema: {
      tables,
      config: {
        inheritanceOptions: {},
        oneToOneOptions: {},
      },
    },
    diagnostics,
  };
}
