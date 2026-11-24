// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema } from '../../types/relational';

/*
 * Tipos de columna editados por el alumno en el DSL relacional (§3.11 L3).
 *
 * El EER no tiene tipos: el motor los infiere y el modelo relacional se regenera entero en cada
 * cambio del EER. Sin esto, cambiar `NOMBRE` a `VARCHAR2(50)` en la pestaña relacional se perdía
 * al tocar el diagrama, y las FK que lo referencian seguían con el tipo antiguo (caso real de
 * Enrique Soler). Se recuerdan por `TABLA.COLUMNA`, se reaplican al regenerar y se guardan en el
 * `.eer` junto a las posiciones de las tablas.
 */

/** `'TABLA.COLUMNA'` → tipo SQL elegido por el alumno. */
export type TypeOverrides = Record<string, string>;

// Límite al propagar por cadenas de FK (A → B → C): protege frente a ciclos.
const MAX_PROPAGATION_PASSES = 10;
const OVERRIDE_LINE = /^relational\s+([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$/;

const keyOf = (table: string, column: string) => `${table}.${column}`;

/** Columnas que son origen de alguna FK: su tipo no se elige, se hereda de la columna referenciada. */
function fkColumnKeys(schema: RelationalSchema): Set<string> {
  return new Set(schema.tables.flatMap(t => t.foreignKeys.flatMap(f => f.sourceColumnNames.map(c => keyOf(t.name, c)))));
}

/**
 * Tipos que el alumno ha cambiado: columnas (no FK) cuyo tipo en el esquema editado difiere del
 * que infiere el motor. Volver al tipo inferido borra la entrada; las columnas que el alumno
 * añadió a mano no se recuerdan (no existen en el EER, desaparecen al regenerar).
 */
export function extractTypeOverrides(edited: RelationalSchema, inferred: RelationalSchema): TypeOverrides {
  const inferredTypes = new Map(inferred.tables.flatMap(t => t.columns.map(c => [keyOf(t.name, c.name), c.dataType] as const)));
  const fkColumns = fkColumnKeys(edited);
  const overrides: TypeOverrides = {};

  edited.tables.forEach(table =>
    table.columns.forEach(column => {
      const key = keyOf(table.name, column.name);
      const inferredType = inferredTypes.get(key);
      if (inferredType !== undefined && !fkColumns.has(key) && column.dataType && column.dataType !== inferredType) {
        overrides[key] = column.dataType;
      }
    })
  );
  return overrides;
}

/**
 * Esquema con los tipos elegidos por el alumno y, después, cada FK con el tipo de la columna
 * que referencia (siguiendo cadenas). Devuelve un esquema nuevo; no muta el recibido.
 */
export function applyTypeOverrides(schema: RelationalSchema, overrides: TypeOverrides): RelationalSchema {
  const tables = schema.tables.map(t => ({
    ...t,
    columns: t.columns.map(c => {
      const override = overrides[keyOf(t.name, c.name)];
      return override ? { ...c, dataType: override } : { ...c };
    }),
  }));

  const columnOf = (table: string, column: string) =>
    tables.find(t => t.name === table)?.columns.find(c => c.name === column);

  let changed = true;
  for (let pass = 0; changed && pass < MAX_PROPAGATION_PASSES; pass++) {
    changed = false;
    tables.forEach(table =>
      table.foreignKeys.forEach(fk =>
        fk.sourceColumnNames.forEach((sourceName, i) => {
          const source = table.columns.find(c => c.name === sourceName);
          const target = columnOf(fk.targetTableName, fk.targetColumnNames[i] ?? '');
          if (source && target && source.dataType !== target.dataType) {
            source.dataType = target.dataType;
            changed = true;
          }
        })
      )
    );
  }

  return { ...schema, tables };
}

/** Líneas `relational TABLA.COLUMNA : TIPO` para el `.eer` (la v1.7.0 las ignora sin error). */
export function serializeTypeOverrides(overrides: TypeOverrides): string[] {
  return Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, type]) => `relational ${key} : ${type}`);
}

/** Lee una línea `relational TABLA.COLUMNA : TIPO`; `null` si la línea es de otro tipo. */
export function parseTypeOverrideLine(line: string): { key: string; type: string } | null {
  const match = line.trim().match(OVERRIDE_LINE);
  return match ? { key: keyOf(match[1]!.toUpperCase(), match[2]!.toUpperCase()), type: match[3]!.toUpperCase() } : null;
}
