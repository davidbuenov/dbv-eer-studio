// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema, RelationalTable, RelationalColumn, ForeignKeyConstraint, CascadeOption } from '../../types/relational';


/**
 * Parsea un bloque de código en lenguaje DSL de texto relacional a una estructura RelationalSchema.
 * Soporta coordenadas visuales [x: N, y: N], claves primarias (PK), foráneas (FK -> TABLA(COL)) y nulabilidad.
 */
export function parseRelationalDSL(code: string): RelationalSchema {
  const tables: RelationalTable[] = [];
  const lines = code.split('\n');

  let currentTable: Partial<RelationalTable> | null = null;
  let currentColumns: RelationalColumn[] = [];
  let currentFKs: ForeignKeyConstraint[] = [];

  let defaultX = 100;
  let defaultY = 100;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('//')) return;

    // Declaración de inicio de tabla: table NOMBRE [x: 100, y: 150] {
    const tableMatch = trimmed.match(/^table\s+([A-Za-z0-9_]+)(?:\s*\[\s*x:\s*(-?\d+)\s*,\s*y:\s*(-?\d+)\s*\])?\s*\{/i);
    if (tableMatch) {
      const tableName = tableMatch[1]!.toUpperCase();
      const x = tableMatch[2] ? parseInt(tableMatch[2], 10) : defaultX;
      const y = tableMatch[3] ? parseInt(tableMatch[3], 10) : defaultY;

      defaultX += 300;
      if (defaultX > 1000) {
        defaultX = 100;
        defaultY += 250;
      }

      currentTable = {
        id: `table_${tableName}`,
        name: tableName,
        x,
        y,
        lineIndex: lineIndex + 1,
        stepTrace: {
          stepNumber: 1,
          stepTitle: 'Tabla Relacional DSL',
          description: `Tabla '${tableName}' definida mediante DSL de texto relacional.`,
        },
      };
      currentColumns = [];
      currentFKs = [];
      return;
    }

    // Fin de tabla: }
    if (trimmed === '}' && currentTable) {
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
      return;
    }

    // Definición de Columna dentro de la tabla
    if (currentTable) {
      const isPK = /\bPK\b/i.test(trimmed);
      const isNotNull = /\bNOT NULL\b/i.test(trimmed);

      // Coincidencia de FK: COLNAME TYPE ... FK -> TARGET_TABLE(TARGET_COL) [ON DELETE CASCADE]
      const fkMatch = trimmed.match(/([A-Za-z0-9_]+)\s+([A-Za-z0-9_(),]+).*?\bFK\s*->\s*([A-Za-z0-9_]+)\(([A-Za-z0-9_]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|SET NULL|RESTRICT))?/i);

      if (fkMatch) {
        const colName = fkMatch[1]!.toUpperCase();
        const dataType = fkMatch[2]!.toUpperCase();
        const targetTable = fkMatch[3]!.toUpperCase();
        const targetCol = fkMatch[4]!.toUpperCase();
        const cascadeOpt = (fkMatch[5]?.toUpperCase() ?? 'CASCADE') as CascadeOption;

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
          id: `FK_${currentTable.name}_${targetTable}`,
          constraintName: `FK_${currentTable.name}_${targetTable}`,
          sourceColumnNames: [colName],
          targetTableName: targetTable,
          targetColumnNames: [targetCol],
          onDelete: cascadeOpt,
          onUpdate: 'CASCADE',
        });
      } else {
        // Columna regular sin FK
        const colMatch = trimmed.match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_(),]+)/i);
        if (colMatch) {
          const colName = colMatch[1]!.toUpperCase();
          const dataType = colMatch[2]!.toUpperCase();

          currentColumns.push({
            id: `${currentTable.name}_${colName}`,
            name: colName,
            dataType,
            isPrimaryKey: isPK,
            isForeignKey: false,
            isNullable: !isNotNull && !isPK,
            isUnique: isPK,
          });
        }
      }
    }
  });

  return {
    tables,
    config: {
      inheritanceOptions: {},
      oneToOneOptions: {},
    },
  };
}
