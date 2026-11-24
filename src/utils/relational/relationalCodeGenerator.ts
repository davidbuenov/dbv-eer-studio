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

    // Una FK de varias columnas no cabe en la línea de una columna: partirla en una FK por
    // columna referenciaría media PK compuesta, que Oracle rechaza (§3.11 L2). Va a nivel de tabla.
    const tableLevelFKs = table.foreignKeys.filter(f => f.sourceColumnNames.length > 1);
    const fkColumns = new Set(table.foreignKeys.flatMap(f => f.sourceColumnNames));

    table.columns.forEach(col => {
      // Una FK no lleva tipo: lo hereda de la columna que referencia, así que cambiar el tipo
      // de una PK cambia el de todas sus FK (§3.11 L3).
      let colLine = fkColumns.has(col.name) ? `  ${col.name}` : `  ${col.name} ${col.dataType}`;

      if (col.isPrimaryKey) {
        colLine += ' PK';
      } else if (!col.isNullable) {
        // También en FKs: sin esto una FK obligatoria volvería como nullable al recompilar el DSL.
        colLine += ' NOT NULL';
      }
      if (col.isUnique && !col.isPrimaryKey) {
        colLine += ' UNIQUE';
      }

      // La acción referencial se escribe siempre, para que el alumno vea la política de cada FK
      // y la ida y vuelta DSL → esquema → DSL no la pierda.
      const fk = table.foreignKeys.find(f => f.sourceColumnNames.length === 1 && f.sourceColumnNames[0] === col.name);
      if (fk) {
        colLine += ` FK -> ${fk.targetTableName}(${fk.targetColumnNames[0] ?? 'ID'}) ON DELETE ${fk.onDelete}`;
      }

      lines.push(colLine);
    });

    tableLevelFKs.forEach(fk => {
      lines.push(
        `  FK (${fk.sourceColumnNames.join(', ')}) -> ${fk.targetTableName}(${fk.targetColumnNames.join(', ')}) ON DELETE ${fk.onDelete}`
      );
    });
    (table.uniqueConstraints ?? []).forEach(columns => lines.push(`  UNIQUE (${columns.join(', ')})`));

    lines.push(`}`);
    if (index < schema.tables.length - 1) {
      lines.push(``);
    }
  });

  return lines.join('\n');
}
