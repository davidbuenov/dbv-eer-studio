// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema, RelationalTable } from '../../types/relational';

export interface InverseEngineeringResult {
  eerCode: string;
  generatedEntitiesCount: number;
  generatedRelationshipsCount: number;
}

/**
 * Motor de Ingeniería Inversa: Deduce y genera el código DSL de Diagrama EER
 * a partir de un Esquema Relacional Lógico (tablas, columnas, PKs y FKs).
 */
export function relationalToEER(schema: RelationalSchema): InverseEngineeringResult {
  const codeLines: string[] = [
    '// ==========================================',
    '// DIAGRAMA EER GENERADO POR INGENIERÍA INVERSA',
    '// ==========================================',
    '',
  ];

  let entitiesCount = 0;
  let relationshipsCount = 0;

  // Track de relaciones binarias y tablas puente ya procesadas
  const processedBridgeTables = new Set<string>();

  // 1. Identificar Tablas Puente M:N (Tablas cuya PK está formada exclusivamente por 2 FKs a otras tablas)
  const bridgeTables: RelationalTable[] = [];
  const regularTables: RelationalTable[] = [];

  schema.tables.forEach(table => {
    const pkCols = table.columns.filter(c => c.isPrimaryKey);


    const isBridge =
      table.foreignKeys.length === 2 &&
      pkCols.length >= 2 &&
      pkCols.every(c => c.isForeignKey);

    if (isBridge) {
      bridgeTables.push(table);
    } else {
      regularTables.push(table);
    }
  });

  // 2. Generar Entidades Fuertes y Débiles
  regularTables.forEach(table => {
    entitiesCount++;
    const isWeak = table.stepTrace?.stepNumber === 2 || table.columns.some(c => c.isPrimaryKey && c.isForeignKey);

    if (isWeak) {
      codeLines.push(`weak_entity ${table.name} (${table.x}, ${table.y})`);
    } else {
      codeLines.push(`entity ${table.name} (${table.x}, ${table.y})`);
    }

    // Atributos de la tabla
    table.columns.forEach(col => {
      // Ignorar FKs propagadas para mantener limpio el diagrama EER derivado
      if (col.isForeignKey && !col.isPrimaryKey) return;

      if (col.isPrimaryKey) {
        codeLines.push(`att ${col.name} [key] -> ${table.name}`);
      } else {
        codeLines.push(`att ${col.name} -> ${table.name}`);
      }
    });

    codeLines.push('');
  });

  // 3. Generar Relaciones Binarias 1:N y 1:1 a partir de las Claves Ajenas (FKs)
  regularTables.forEach(childTable => {
    childTable.foreignKeys.forEach(fk => {
      const parentTable = schema.tables.find(t => t.name.toUpperCase() === fk.targetTableName.toUpperCase());

      if (parentTable && parentTable.name !== childTable.name) {
        // Verificar si es herencia (Paso 8: Subclase PK es FK de Superclase)
        const isInheritance = childTable.columns.every(c => c.isPrimaryKey === c.isForeignKey);

        if (!isInheritance) {
          relationshipsCount++;
          const relName = `TIENE_${parentTable.name}_${childTable.name}`;
          const isOneToOne = childTable.columns.some(c => c.name === fk.sourceColumnNames[0] && c.isUnique);

          codeLines.push(`relationship ${relName} (${Math.round((childTable.x + parentTable.x) / 2)}, ${Math.round((childTable.y + parentTable.y) / 2)})`);
          codeLines.push(`link ${parentTable.name} ${relName} "1"`);
          codeLines.push(`link ${relName} ${childTable.name} "${isOneToOne ? '1' : 'N'}"`);
          codeLines.push('');
        }
      }
    });
  });

  // 4. Generar Relaciones Binarias M:N a partir de Tablas Puente
  bridgeTables.forEach(bridge => {
    processedBridgeTables.add(bridge.name);
    relationshipsCount++;

    const fk1 = bridge.foreignKeys[0];
    const fk2 = bridge.foreignKeys[1];

    if (fk1 && fk2) {
      const relName = bridge.name;
      codeLines.push(`relationship ${relName} (${bridge.x}, ${bridge.y})`);
      codeLines.push(`link ${fk1.targetTableName} ${relName} "M"`);
      codeLines.push(`link ${relName} ${fk2.targetTableName} "N"`);

      // Atributos propios de la relación M:N
      bridge.columns.forEach(col => {
        if (!col.isForeignKey) {
          codeLines.push(`att ${col.name} -> ${relName}`);
        }
      });

      codeLines.push('');
    }
  });

  return {
    eerCode: codeLines.join('\n'),
    generatedEntitiesCount: entitiesCount,
    generatedRelationshipsCount: relationshipsCount,
  };
}
