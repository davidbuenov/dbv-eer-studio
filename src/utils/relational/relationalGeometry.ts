// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema, RelationalTable } from '../../types/relational';

/**
 * Geometría compartida de las tarjetas del Modelo Relacional, usada tanto por
 * `RelationalViewer.tsx` (render HTML+SVG en pantalla) como por
 * `exportRelationalSVG.ts` (exportación a fichero .svg), para que ambas
 * representaciones no puedan divergir con el tiempo (ver riesgo documentado
 * en `dbv-specs-ops/implementation_plan.md`).
 */
export const CARD_WIDTH = 288; // 18rem (w-72)
export const HEADER_HEIGHT = 41;
export const ROW_HEIGHT = 33;
export const FOOTER_HEIGHT = 26;

export type Side = 'top' | 'bottom' | 'left' | 'right';

/** Calcula la altura total estimada de una tarjeta de tabla */
export function getTableHeight(table: RelationalTable): number {
  return HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + FOOTER_HEIGHT;
}

/** Calcula las coordenadas exactas de un puerto de anclaje (3 puertos por lado: 25%, 50%, 75%) */
export function getAnchorPortPosition(
  table: RelationalTable,
  side: Side,
  slotIndex: number = 1
): { x: number; y: number; normalX: number; normalY: number } {
  const height = getTableHeight(table);
  const slots = [0.25, 0.5, 0.75];
  const ratio = slots[slotIndex % 3] ?? 0.5;

  switch (side) {
    case 'top':
      return { x: table.x + CARD_WIDTH * ratio, y: table.y, normalX: 0, normalY: -1 };
    case 'bottom':
      return { x: table.x + CARD_WIDTH * ratio, y: table.y + height, normalX: 0, normalY: 1 };
    case 'left':
      return { x: table.x, y: table.y + height * ratio, normalX: -1, normalY: 0 };
    case 'right':
    default:
      return { x: table.x + CARD_WIDTH, y: table.y + height * ratio, normalX: 1, normalY: 0 };
  }
}

/** Determina los lados de conexión óptimos (Top, Bottom, Left, Right) entre dos tablas */
export function getOptimalSides(
  sourceTable: RelationalTable,
  targetTable: RelationalTable
): { sourceSide: Side; targetSide: Side } {
  const sourceHeight = getTableHeight(sourceTable);
  const targetHeight = getTableHeight(targetTable);

  const sourceCenterX = sourceTable.x + CARD_WIDTH / 2;
  const sourceCenterY = sourceTable.y + sourceHeight / 2;

  const targetCenterX = targetTable.x + CARD_WIDTH / 2;
  const targetCenterY = targetTable.y + targetHeight / 2;

  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;

  if (Math.abs(dy) > Math.abs(dx) * 1.1) {
    return dy > 0 ? { sourceSide: 'bottom', targetSide: 'top' } : { sourceSide: 'top', targetSide: 'bottom' };
  }
  return dx > 0 ? { sourceSide: 'right', targetSide: 'left' } : { sourceSide: 'left', targetSide: 'right' };
}

/** Una arista de clave ajena ya resuelta: trazado, anclajes y etiqueta, sin nada de estilo. */
export interface FKEdge {
  key: string;
  sourceTableId: string;
  targetTableId: string;
  pathData: string;
  sourceAnchor: { x: number; y: number };
  targetAnchor: { x: number; y: number };
  midX: number;
  midY: number;
  labelText: string;
  textWidth: number;
  /** La FK forma parte de la PK (relación identificativa / herencia) → línea sólida. */
  isIdentifying: boolean;
}

/**
 * Calcula todas las aristas FK de un esquema.
 *
 * Es la única implementación del trazado: la usan tanto `RelationalViewer` (render en
 * pantalla, pasando `posOf` para reflejar el arrastre en vivo) como `exportRelationalSVG`
 * (exportación a fichero). Repartir este cálculo en dos ficheros hacía que el orden de
 * asignación de puertos —que es estado con orden significativo— pudiera divergir en
 * silencio y el SVG exportado dejara de coincidir con la pantalla.
 */
export function computeFKEdges(
  schema: RelationalSchema,
  posOf?: (table: RelationalTable) => { x: number; y: number }
): FKEdge[] {
  // Índice por nombre en mayúsculas: evita recorrer todas las tablas (con dos
  // `toUpperCase()` por comparación) por cada clave ajena en cada render.
  const tablesByName = new Map<string, RelationalTable>();
  schema.tables.forEach(table => tablesByName.set(table.name.toUpperCase(), table));

  const resolvePos = (table: RelationalTable): RelationalTable =>
    posOf ? { ...table, ...posOf(table) } : table;

  const sidePortUsage: Record<string, number> = {};
  const nextPortIndex = (tableId: string, side: Side): number => {
    const portKey = `${tableId}_${side}`;
    const count = sidePortUsage[portKey] ?? 0;
    sidePortUsage[portKey] = count + 1;
    return count;
  };

  const edges: FKEdge[] = [];

  schema.tables.forEach(sourceTableRaw => {
    const sourceTable = resolvePos(sourceTableRaw);

    sourceTableRaw.foreignKeys.forEach(fk => {
      const targetTableRaw = tablesByName.get(fk.targetTableName.toUpperCase());
      if (!targetTableRaw) return;
      const targetTable = resolvePos(targetTableRaw);

      const fkColName = fk.sourceColumnNames[0] || 'FK';
      const fkColumn = sourceTable.columns.find(c => c.name.toUpperCase() === fkColName.toUpperCase());

      const { sourceSide, targetSide } = getOptimalSides(sourceTable, targetTable);
      const sourceAnchor = getAnchorPortPosition(sourceTable, sourceSide, nextPortIndex(sourceTable.id, sourceSide));
      const targetAnchor = getAnchorPortPosition(targetTable, targetSide, nextPortIndex(targetTable.id, targetSide));

      const dist = Math.hypot(targetAnchor.x - sourceAnchor.x, targetAnchor.y - sourceAnchor.y);
      const curvature = Math.min(160, Math.max(50, dist * 0.4));

      const ctrlX1 = sourceAnchor.x + sourceAnchor.normalX * curvature;
      const ctrlY1 = sourceAnchor.y + sourceAnchor.normalY * curvature;
      const ctrlX2 = targetAnchor.x + targetAnchor.normalX * curvature;
      const ctrlY2 = targetAnchor.y + targetAnchor.normalY * curvature;

      const labelText = `${fkColName} ➔ ${targetTable.name}`;

      edges.push({
        key: `${sourceTable.id}_${fk.id}`,
        sourceTableId: sourceTable.id,
        targetTableId: targetTable.id,
        pathData: `M ${sourceAnchor.x} ${sourceAnchor.y} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${targetAnchor.x} ${targetAnchor.y}`,
        sourceAnchor: { x: sourceAnchor.x, y: sourceAnchor.y },
        targetAnchor: { x: targetAnchor.x, y: targetAnchor.y },
        midX: (sourceAnchor.x + targetAnchor.x) / 2,
        midY: (sourceAnchor.y + targetAnchor.y) / 2,
        labelText,
        textWidth: Math.max(80, Math.round(labelText.length * 6.5 + 20)),
        isIdentifying: fkColumn ? fkColumn.isPrimaryKey : false,
      });
    });
  });

  return edges;
}
