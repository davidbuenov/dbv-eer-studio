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

const REFERENTIAL_ACTIONS: readonly CascadeOption[] = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'];

/**
 * Normaliza el texto que sigue a `ON DELETE` (mayúsculas, espacios simples) y lo valida
 * contra las acciones referenciales del estándar SQL. Devuelve `null` si no es ninguna.
 */
function parseReferentialAction(text: string): CascadeOption | null {
  const normalized = text.trim().replace(/\s+/g, ' ').toUpperCase();
  return REFERENTIAL_ACTIONS.find(action => action === normalized) ?? null;
}

// Tipo SQL: identificador con parámetros opcionales que pueden llevar espacios
// (`NUMBER(12, 2)`). No puede ser una palabra reservada del DSL: en `X PK FK -> …` el tipo
// se ha omitido (FK que hereda el tipo), no se llama "PK".
const TYPE_PATTERN = String.raw`(?!(?:PK|FK|NOT|UNIQUE)\b)[A-Za-z_][A-Za-z0-9_]*(?:\s*\([^)]*\))?`;
const COLUMN_REGEX = new RegExp(String.raw`^([A-Za-z0-9_]+)(?:\s+(${TYPE_PATTERN}))?(.*)$`, 'i');
const INLINE_FK_REGEX = /\bFK\s*->\s*([A-Za-z0-9_]+)\s*\(\s*([A-Za-z0-9_]+)\s*\)/i;
const TABLE_FK_REGEX = /^FK\s*\(([^)]*)\)\s*->\s*([A-Za-z0-9_]+)\s*\(([^)]*)\)(.*)$/i;
const TABLE_UNIQUE_REGEX = /^UNIQUE\s*\(([^)]*)\)\s*$/i;
// Límite al seguir cadenas de FK sin tipo (A → B → C): protege frente a ciclos escritos a mano.
const MAX_TYPE_CHAIN = 10;

/** `A, b ,C` → `['A', 'B', 'C']` (vacíos descartados). */
function splitColumnList(text: string): string[] {
  return text
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);
}

/** Tipo en mayúsculas con los espacios de los parámetros normalizados: `number(12,2)` → `NUMBER(12, 2)`. */
function normalizeType(type: string): string {
  return type.trim().toUpperCase().replace(/\s*\(\s*/, '(').replace(/\s*,\s*/g, ', ').replace(/\s*\)/, ')');
}

/**
 * Acción `ON DELETE` del resto de una línea. Omitida ⇒ NO ACTION, el valor por defecto del
 * estándar SQL: nunca se asume CASCADE en silencio, porque borraría en cadena filas que el
 * alumno no ha decidido borrar. `'invalid'` si hay cláusula pero la acción no existe.
 */
function parseOnDelete(rest: string): CascadeOption | 'invalid' {
  const clause = rest.match(/\bON\s+DELETE\b(.*)$/i);
  const result = clause ? (parseReferentialAction(clause[1] ?? '') ?? 'invalid') : 'NO ACTION';
  return result;
}

function fkSyntaxError(line: number): Diagnostic {
  return { line, severity: 'error', code: 'INVALID_FOREIGN_KEY_SYNTAX', messageKey: 'compiler.invalidFKSyntax', params: {} };
}

function invalidActionError(line: number, action: string): Diagnostic {
  return {
    line,
    severity: 'error',
    code: 'INVALID_REFERENTIAL_ACTION',
    messageKey: 'compiler.invalidReferentialAction',
    params: { action: action.trim() },
  };
}

/** ¿Las columnas son exactamente la PK, una restricción UNIQUE o una columna UNIQUE de la tabla? */
function referencesKey(columns: readonly string[], table: RelationalTable): boolean {
  const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every(c => b.includes(c));
  const pk = table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
  // Las columnas de una PK compuesta llevan `isUnique` pero no son claves por separado.
  const uniqueColumns = table.columns.filter(c => c.isUnique && !c.isPrimaryKey).map(c => [c.name]);
  return [pk, ...(table.uniqueConstraints ?? []), ...uniqueColumns].some(key => sameSet(columns, key));
}

/** Tipo de una columna, siguiendo FK sin tipo hasta la columna que lo declara ('' si no se resuelve). */
function resolveColumnType(tableName: string, columnName: string, tables: ReadonlyMap<string, RelationalTable>): string {
  let table = tables.get(tableName);
  let column = columnName;
  let resolved = '';
  for (let depth = 0; table && !resolved && depth < MAX_TYPE_CHAIN; depth++) {
    const current = table.columns.find(c => c.name === column);
    const fk = current && !current.dataType ? table.foreignKeys.find(f => f.sourceColumnNames.includes(column)) : undefined;
    resolved = current?.dataType ?? '';
    column = fk?.targetColumnNames[fk.sourceColumnNames.indexOf(column)] ?? '';
    table = fk ? tables.get(fk.targetTableName) : undefined;
  }
  return resolved;
}

/**
 * Restricción FK con el mismo nombre que le da el motor EER → relacional (`FK_<TABLA>_<DESTINO>`),
 * para que editar el DSL no renombre las restricciones; si la tabla ya tiene una con ese
 * nombre (dos FK hacia la misma tabla), se numera.
 */
function buildForeignKey(
  tableName: string,
  sources: string[],
  targetTable: string,
  targets: string[],
  onDelete: CascadeOption,
  lineIndex: number,
  existing: readonly ForeignKeyConstraint[]
): ForeignKeyConstraint {
  const baseName = `FK_${tableName}_${targetTable}`;
  const taken = new Set(existing.map(f => f.constraintName));
  let constraintName = baseName;
  for (let n = 2; taken.has(constraintName); n++) constraintName = `${baseName}_${n}`;

  return {
    id: constraintName,
    constraintName,
    sourceColumnNames: sources,
    targetTableName: targetTable,
    targetColumnNames: targets,
    onDelete,
    onUpdate: 'CASCADE',
    lineIndex,
  };
}

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
  let currentUniques: Array<{ columns: string[]; lineIndex: number }> = [];
  let currentColumnLines = new Map<string, number>();
  let currentTableStartLine = 1;

  // Cierra la tabla abierta. Aquí ya se conocen todas sus columnas, así que se validan las
  // restricciones de tabla (FK (…), UNIQUE (…)), que pueden escribirse antes o después.
  const closeTable = (table: Partial<RelationalTable>) => {
    const columnNames = new Set(currentColumns.map(c => c.name));
    const checkColumns = (columns: string[], line: number) =>
      columns
        .filter(col => !columnNames.has(col))
        .forEach(col =>
          diagnostics.push({
            line,
            severity: 'warning',
            code: 'UNDECLARED_CONSTRAINT_COLUMN',
            messageKey: 'compiler.undeclaredConstraintColumn',
            params: { col, table: table.name ?? '' },
          })
        );

    currentFKs.forEach(fk => {
      checkColumns(fk.sourceColumnNames, fk.lineIndex ?? currentTableStartLine);
      currentColumns.forEach(c => {
        if (fk.sourceColumnNames.includes(c.name)) c.isForeignKey = true;
      });
    });
    currentUniques.forEach(u => checkColumns(u.columns, u.lineIndex));

    // Una columna sin tipo solo es válida si es FK (lo hereda): si no, la línea está incompleta.
    currentColumns
      .filter(c => !c.dataType && !c.isForeignKey)
      .forEach(c =>
        diagnostics.push({
          line: currentColumnLines.get(c.name) ?? currentTableStartLine,
          severity: 'error',
          code: 'INVALID_COLUMN_DEFINITION',
          messageKey: 'compiler.missingColumnType',
          params: { col: c.name },
        })
      );

    tables.push({
      id: table.id!,
      name: table.name!,
      columns: currentColumns,
      foreignKeys: currentFKs,
      x: table.x!,
      y: table.y!,
      stepTrace: table.stepTrace!,
      lineIndex: table.lineIndex!,
      ...(currentUniques.length > 0 ? { uniqueConstraints: currentUniques.map(u => u.columns) } : {}),
    });
  };

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
        closeTable(currentTable);
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
      currentUniques = [];
      currentColumnLines = new Map();
      currentTableStartLine = lineNum;
      continue;
    }

    // 2. Cierre de tabla: }
    if (trimmed === '}') {
      if (currentTable) {
        closeTable(currentTable);
        currentTable = null;
        currentColumns = [];
        currentFKs = [];
        currentUniques = [];
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

    // 3. Contenido de una tabla: restricciones de tabla o columnas
    if (currentTable) {
      const tableName = currentTable.name ?? '';

      // 3a. FK de tabla (varias columnas): `FK (A, B) -> T(X, Y) [ON DELETE …]`
      const tableFK = trimmed.match(TABLE_FK_REGEX);
      if (/^FK\b/i.test(trimmed)) {
        const sources = tableFK ? splitColumnList(tableFK[1]!) : [];
        const targets = tableFK ? splitColumnList(tableFK[3]!) : [];
        const onDelete = tableFK ? parseOnDelete(tableFK[4] ?? '') : 'NO ACTION';

        if (!tableFK || sources.length === 0 || sources.length !== targets.length) {
          diagnostics.push(fkSyntaxError(lineNum));
        } else if (onDelete === 'invalid') {
          diagnostics.push(invalidActionError(lineNum, tableFK[4] ?? ''));
        } else {
          currentFKs.push(buildForeignKey(tableName, sources, tableFK[2]!.toUpperCase(), targets, onDelete, lineNum, currentFKs));
        }
        continue;
      }

      // 3b. UNIQUE de tabla: `UNIQUE (A, B)`
      if (/^UNIQUE\b/i.test(trimmed)) {
        const uniqueMatch = trimmed.match(TABLE_UNIQUE_REGEX);
        const columns = uniqueMatch ? splitColumnList(uniqueMatch[1]!) : [];
        if (columns.length === 0) {
          diagnostics.push({
            line: lineNum,
            severity: 'error',
            code: 'INVALID_COLUMN_DEFINITION',
            messageKey: 'compiler.unknownCommand',
            params: { command: trimmed },
          });
        } else {
          currentUniques.push({ columns, lineIndex: lineNum });
        }
        continue;
      }

      // 3c. Columna: `NOMBRE [TIPO] [PK] [NOT NULL] [UNIQUE] [FK -> T(C) [ON DELETE …]]`.
      // El tipo solo puede omitirse en una FK: lo hereda de la columna referenciada (§3.11 L3).
      const colMatch = trimmed.match(COLUMN_REGEX);
      const rest = colMatch?.[3] ?? '';
      const hasFK = /\bFK\b/i.test(rest);
      const inlineFK = rest.match(INLINE_FK_REGEX);
      const onDelete = parseOnDelete(rest);

      // Sin tipo solo vale en una FK (en línea o de tabla `FK (…)`): se comprueba al cerrar la tabla.
      if (!colMatch) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          code: 'INVALID_COLUMN_DEFINITION',
          messageKey: 'compiler.unknownCommand',
          params: { command: trimmed },
        });
        continue;
      }
      if (hasFK && !inlineFK) {
        diagnostics.push(fkSyntaxError(lineNum));
        continue;
      }
      if (onDelete === 'invalid') {
        diagnostics.push(invalidActionError(lineNum, rest.match(/\bON\s+DELETE\b(.*)$/i)?.[1] ?? ''));
        continue;
      }

      const colName = colMatch[1]!.toUpperCase();
      const isPK = /\bPK\b/i.test(rest);
      const isNotNull = /\bNOT\s+NULL\b/i.test(rest);
      const isUniqueColumn = /\bUNIQUE\b/i.test(rest);

      if (currentColumns.some(c => c.name === colName)) {
        diagnostics.push({
          line: lineNum,
          severity: 'warning',
          code: 'DUPLICATE_COLUMN_NAME',
          messageKey: 'compiler.duplicateColumnName',
          params: { col: colName, table: tableName },
        });
      }

      currentColumnLines.set(colName, lineNum);
      currentColumns.push({
        id: `${tableName}_${colName}`,
        name: colName,
        dataType: normalizeType(colMatch[2] ?? ''),
        isPrimaryKey: isPK,
        isForeignKey: Boolean(inlineFK),
        isNullable: !isNotNull && !isPK,
        isUnique: isPK || isUniqueColumn,
      });

      if (inlineFK) {
        currentFKs.push(
          buildForeignKey(tableName, [colName], inlineFK[1]!.toUpperCase(), [inlineFK[2]!.toUpperCase()], onDelete, lineNum, currentFKs)
        );
      }
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
    closeTable(currentTable);
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
        return;
      }

      const missing = fk.targetColumnNames.filter(col => !targetTable.columns.some(c => c.name === col));
      missing.forEach(col =>
        diagnostics.push({
          line: fkLine,
          severity: 'warning',
          code: 'UNDECLARED_TARGET_COLUMN',
          messageKey: 'compiler.undeclaredTargetColumn',
          params: { col, table: fk.targetTableName },
        })
      );

      // Una FK debe referenciar la PK completa o una clave UNIQUE del destino: con media PK
      // compuesta (el caso de Enrique Soler) Oracle la rechaza con ORA-02270.
      if (missing.length === 0 && !referencesKey(fk.targetColumnNames, targetTable)) {
        diagnostics.push({
          line: fkLine,
          severity: 'warning',
          code: 'FK_NOT_REFERENCING_KEY',
          messageKey: 'compiler.fkNotReferencingKey',
          params: { cols: fk.targetColumnNames.join(', '), table: targetTable.name },
        });
      }
    });
  });

  // 3. Tipos de las columnas FK (§3.11 L3): una FK sin tipo hereda el de la columna que
  // referencia (siguiendo cadenas A → B → C); con tipo distinto, aviso.
  tables.forEach(table =>
    table.foreignKeys.forEach(fk =>
      fk.sourceColumnNames.forEach((sourceName, i) => {
        const column = table.columns.find(c => c.name === sourceName);
        const targetName = fk.targetColumnNames[i];
        if (!column || !targetName) return;

        const referencedType = resolveColumnType(fk.targetTableName, targetName, validTableMap);
        const fkLine = fk.lineIndex ?? table.lineIndex ?? 1;

        if (!column.dataType) {
          if (referencedType) {
            column.dataType = referencedType;
          } else {
            column.dataType = 'NUMBER(10)';
            diagnostics.push({
              line: fkLine,
              severity: 'warning',
              code: 'UNRESOLVED_FK_TYPE',
              messageKey: 'compiler.unresolvedFkType',
              params: { col: sourceName, table: table.name },
            });
          }
        } else if (referencedType && referencedType !== column.dataType) {
          diagnostics.push({
            line: fkLine,
            severity: 'warning',
            code: 'FK_TYPE_MISMATCH',
            messageKey: 'compiler.fkTypeMismatch',
            params: { col: sourceName, type: column.dataType, ref: `${fk.targetTableName}.${targetName}`, refType: referencedType },
          });
        }
      })
    )
  );

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
