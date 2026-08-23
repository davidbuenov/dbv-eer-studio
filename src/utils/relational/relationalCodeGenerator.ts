// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema } from '../../types/relational';


/**
 * Genera el código DSL de texto para el Modelo Relacional a partir del objeto de esquema.
 * Incluye coordenadas visuales [x: N, y: N] para permitir la edición bidireccional código ↔ canvas.
 */
export function generateRelationalDSL(schema: RelationalSchema): string {
  const lines: string[] = [];

  schema.tables.forEach((table, index) => {
    const posX = Math.round(table.x);
    const posY = Math.round(table.y);

    lines.push(`table ${table.name} [x: ${posX}, y: ${posY}] {`);

    table.columns.forEach(col => {
      let colLine = `  ${col.name} ${col.dataType}`;

      if (col.isPrimaryKey) {
        colLine += ' PK';
      }

      // Buscar si esta columna es parte de una clave foránea
      const fk = table.foreignKeys.find(f => f.sourceColumnNames.includes(col.name));
      if (fk) {
        const sourceIdx = fk.sourceColumnNames.indexOf(col.name);
        const targetCol = fk.targetColumnNames[sourceIdx] ?? 'ID';
        colLine += ` FK -> ${fk.targetTableName}(${targetCol})`;
        if (fk.onDelete === 'CASCADE') {
          colLine += ' ON DELETE CASCADE';
        }
      } else if (!col.isNullable && !col.isPrimaryKey) {
        colLine += ' NOT NULL';
      }

      lines.push(colLine);
    });

    lines.push(`}`);
    if (index < schema.tables.length - 1) {
      lines.push(``);
    }
  });

  return lines.join('\n');
}
