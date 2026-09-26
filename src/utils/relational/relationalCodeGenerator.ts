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
      } else if (!col.isNullable) {
        // También en FKs: sin esto una FK obligatoria volvería como nullable al recompilar el DSL.
        colLine += ' NOT NULL';
      }

      // La acción referencial se escribe siempre, para que el alumno vea la política de cada FK
      // y la ida y vuelta DSL → esquema → DSL no la pierda.
      const fk = table.foreignKeys.find(f => f.sourceColumnNames.includes(col.name));
      if (fk) {
        const sourceIdx = fk.sourceColumnNames.indexOf(col.name);
        const targetCol = fk.targetColumnNames[sourceIdx] ?? 'ID';
        colLine += ` FK -> ${fk.targetTableName}(${targetCol}) ON DELETE ${fk.onDelete}`;
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
