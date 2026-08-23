// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { NodeData, LinkData } from '../../types';
import type {
  RelationalSchema,
  RelationalTable,
  RelationalColumn,
  ForeignKeyConstraint,
  MappingConfig,
  StepTrace,
} from '../../types/relational';

/**
 * Normaliza nombres de tabla y columna para formato SQL
 */
function sanitizeName(name: string): string {
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .toUpperCase();
}

/**
 * Deduce un tipo de dato SQL en función del nombre del atributo
 */
function inferSQLType(attrName: string, isKey: boolean = false): string {
  const lower = attrName.toLowerCase();
  if (isKey || lower.includes('id') || lower.includes('codigo') || lower.includes('num')) {
    return 'NUMBER(10)';
  }
  if (lower.includes('fecha') || lower.includes('date')) {
    return 'DATE';
  }
  if (lower.includes('precio') || lower.includes('salario') || lower.includes('monto') || lower.includes('total')) {
    return 'NUMBER(12, 2)';
  }
  if (lower.includes('es_') || lower.includes('tiene_') || lower.includes('activo')) {
    return 'NUMBER(1)';
  }
  return 'VARCHAR2(100)';
}

/**
 * Obtiene los enlaces conectados a un nodo por su ID
 */
function getConnectedLinks(nodeId: string, links: LinkData[]): LinkData[] {
  return links.filter(l => l.source === nodeId || l.target === nodeId);
}

/**
 * Obtiene los IDs de los nodos adyacentes a un nodo dado
 */
function getNeighborNodeIds(nodeId: string, links: LinkData[]): string[] {
  return links
    .filter(l => l.source === nodeId || l.target === nodeId)
    .map(l => (l.source === nodeId ? l.target : l.source));
}

/**
 * Obtiene los atributos directamente asociados a un nodo (entidad o relación)
 */
function getNodeAttributes(nodeId: string, nodes: NodeData[], links: LinkData[]): NodeData[] {
  const directNeighborIds = getNeighborNodeIds(nodeId, links);
  const directAttrNodes = nodes.filter(
    n =>
      directNeighborIds.includes(n.id) &&
      ['attribute', 'key_attribute', 'multivalued_attribute', 'derived_attribute'].includes(n.type)
  );

  const parentAttrNodes = nodes.filter(
    n =>
      n.parentEntity === nodeId &&
      ['attribute', 'key_attribute', 'multivalued_attribute', 'derived_attribute'].includes(n.type)
  );

  return Array.from(new Set([...directAttrNodes, ...parentAttrNodes]));
}

/**
 * Convierte atributos compuestos a sus componentes simples hoja
 */
function expandSimpleAttributes(attrNode: NodeData, nodes: NodeData[], links: LinkData[]): NodeData[] {
  const childAttrIds = getNeighborNodeIds(attrNode.id, links).filter(id => {
    const child = nodes.find(n => n.id === id);
    return child && ['attribute', 'key_attribute'].includes(child.type) && child.id !== attrNode.id;
  });

  if (childAttrIds.length === 0) {
    return [attrNode];
  }

  const result: NodeData[] = [];
  childAttrIds.forEach(childId => {
    const childNode = nodes.find(n => n.id === childId);
    if (childNode) {
      result.push(...expandSimpleAttributes(childNode, nodes, links));
    }
  });
  return result;
}

/**
 * Organiza automáticamente las tablas relacionales en una cuadrícula limpia respetando las posiciones guardadas por el usuario.
 */
function applySmartAutoLayout(
  tables: RelationalTable[],
  savedPositions?: Record<string, { x: number; y: number }>
) {
  if (tables.length === 0) return;

  const CARD_WIDTH = 288;
  const GAP_X = 80;
  const GAP_Y = 120;
  const MARGIN_X = 60;
  const MARGIN_Y = 60;

  // Restaurar posiciones guardadas explícitamente por el usuario
  if (savedPositions) {
    tables.forEach(t => {
      const pos = savedPositions[t.name] || savedPositions[t.id];
      if (pos) {
        t.x = pos.x;
        t.y = pos.y;
      }
    });
  }

  // Detectar si existen tablas encimadas no posicionadas manualmente
  let hasOverlap = false;
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const t1 = tables[i]!;
      const t2 = tables[j]!;
      const dx = Math.abs(t1.x - t2.x);
      const dy = Math.abs(t1.y - t2.y);
      if (dx < 260 && dy < 180) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) break;
  }

  // Si hay solapamientos o la mayoría coincide en posiciones (0,0), reordenar en cuadrícula solo las no guardadas
  if (hasOverlap || tables.some(t => t.x <= 0 || t.y <= 0)) {
    const cols = Math.min(3, Math.ceil(Math.sqrt(tables.length)));
    tables.forEach((table, index) => {
      const hasCustomPos = savedPositions && (savedPositions[table.name] || savedPositions[table.id]);
      if (!hasCustomPos) {
        const row = Math.floor(index / cols);
        const col = index % cols;
        table.x = MARGIN_X + col * (CARD_WIDTH + GAP_X);
        table.y = MARGIN_Y + row * (180 + GAP_Y);
      }
    });
  }
}

/**
 * Motor Principal: Transforma un Esquema Conceptual EER a un Esquema Relacional Lógico
 * Siguiendo estrictamente los 9 Pasos del Algoritmo eer-to-relational-mapping.md
 */
export function eerToRelational(
  nodes: NodeData[],
  links: LinkData[],
  customConfig?: Partial<MappingConfig>,
  savedPositions?: Record<string, { x: number; y: number }>
): RelationalSchema {
  const config: MappingConfig = {
    inheritanceOptions: customConfig?.inheritanceOptions ?? {},
    oneToOneOptions: customConfig?.oneToOneOptions ?? {},
  };

  const tables: RelationalTable[] = [];

  // =========================================================================
  // PASO 1: Mapeado de los Tipos de Entidad Regulares (Fuertes)
  // =========================================================================
  const strongEntities = nodes.filter(n => n.type === 'entity');

  strongEntities.forEach(entity => {
    const tableName = sanitizeName(entity.label);
    const attrNodes = getNodeAttributes(entity.id, nodes, links);

    const columns: RelationalColumn[] = [];
    const stepTrace: StepTrace = {
      stepNumber: 1,
      stepTitle: 'Paso 1: Mapeado de Entidades Fuertes',
      description: `Se crea la tabla '${tableName}' para la entidad fuerte '${entity.label}'. Se mapean los atributos simples y componentes simples de compuestos.`,
      sourceEERNodeId: entity.id,
      sourceEERNodeLabel: entity.label,
    };

    attrNodes.forEach(attr => {
      if (attr.type === 'derived_attribute') return;
      if (attr.type === 'multivalued_attribute') return;

      const expanded = expandSimpleAttributes(attr, nodes, links);
      expanded.forEach(simpleAttr => {
        const colName = sanitizeName(simpleAttr.label);
        const isKey = simpleAttr.type === 'key_attribute' || attr.type === 'key_attribute';

        columns.push({
          id: `${tableName}_${colName}`,
          name: colName,
          dataType: inferSQLType(simpleAttr.label, isKey),
          isPrimaryKey: isKey,
          isForeignKey: false,
          isNullable: !isKey,
          isUnique: isKey,
          stepTrace: {
            stepNumber: 1,
            stepTitle: 'Paso 1: Atributo de Entidad Fuerte',
            description: isKey
              ? `Clave Primaria (PK) derivada del atributo clave '${simpleAttr.label}'.`
              : `Columna derivada del atributo '${simpleAttr.label}'.`,
            sourceEERNodeId: simpleAttr.id,
            sourceEERNodeLabel: simpleAttr.label,
          },
        });
      });
    });

    if (!columns.some((c: RelationalColumn) => c.isPrimaryKey)) {
      const defaultKeyName = `ID_${tableName}`;
      columns.unshift({
        id: `${tableName}_${defaultKeyName}`,
        name: defaultKeyName,
        dataType: 'NUMBER(10)',
        isPrimaryKey: true,
        isForeignKey: false,
        isNullable: false,
        isUnique: true,
        stepTrace: {
          stepNumber: 1,
          stepTitle: 'Paso 1: Clave Primaria por Defecto',
          description: `Se genera la columna PK '${defaultKeyName}' al no detectarse atributo clave explícito en la entidad.`,
        },
      });
    }

    tables.push({
      id: entity.id,
      name: tableName,
      columns,
      foreignKeys: [],
      x: entity.x || 60,
      y: entity.y || 60,
      stepTrace,
      sourceNodeType: entity.type,
      lineIndex: entity.lineIndex,
    });
  });

  // =========================================================================
  // PASO 2: Mapeado de los Tipos de Entidad Débiles
  // =========================================================================
  const weakEntities = nodes.filter(n => n.type === 'weak_entity');

  weakEntities.forEach(weakEntity => {
    const tableName = sanitizeName(weakEntity.label);
    const stepTrace: StepTrace = {
      stepNumber: 2,
      stepTitle: 'Paso 2: Mapeado de Entidades Débiles',
      description: `Se crea la tabla '${tableName}' para la entidad débil '${weakEntity.label}'. Incluye la PK de la entidad propietaria como FK y forma su PK compuesta con su clave parcial.`,
      sourceEERNodeId: weakEntity.id,
      sourceEERNodeLabel: weakEntity.label,
    };

    const connectedRelIds = getNeighborNodeIds(weakEntity.id, links);
    const identifyingRel = nodes.find(
      n => connectedRelIds.includes(n.id) && n.type === 'identifying_relationship'
    );

    let ownerEntity: NodeData | undefined;
    if (identifyingRel) {
      const relNeighborIds = getNeighborNodeIds(identifyingRel.id, links);
      const ownerId = relNeighborIds.find(id => id !== weakEntity.id);
      ownerEntity = nodes.find(n => n.id === ownerId && (n.type === 'entity' || n.type === 'weak_entity'));
    }

    const columns: RelationalColumn[] = [];
    const foreignKeys: ForeignKeyConstraint[] = [];

    if (ownerEntity) {
      const ownerTable = tables.find(t => t.id === ownerEntity!.id);
      if (ownerTable) {
        const ownerPKs = ownerTable.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
        const fkColNames: string[] = [];
        const targetPKNames: string[] = [];

        ownerPKs.forEach((pkCol: RelationalColumn) => {
          const fkColName = `${ownerTable.name}_${pkCol.name}`;
          fkColNames.push(fkColName);
          targetPKNames.push(pkCol.name);

          columns.push({
            id: `${tableName}_${fkColName}`,
            name: fkColName,
            dataType: pkCol.dataType,
            isPrimaryKey: true,
            isForeignKey: true,
            isNullable: false,
            isUnique: false,
            stepTrace: {
              stepNumber: 2,
              stepTitle: 'Paso 2: FK Propagada del Propietario',
              description: `Clave ajena propagada desde la entidad propietaria '${ownerTable.name}'.`,
            },
          });
        });

        foreignKeys.push({
          id: `FK_${tableName}_${ownerTable.name}`,
          constraintName: `FK_${tableName}_${ownerTable.name}`,
          sourceColumnNames: fkColNames,
          targetTableName: ownerTable.name,
          targetColumnNames: targetPKNames,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          stepTrace: {
            stepNumber: 2,
            stepTitle: 'Paso 2: Restricción FK con CASCADE',
            description: `Integridad referencial ON DELETE CASCADE obligatoria al depender la entidad débil de la propietaria.`,
          },
        });
      }
    }

    const attrNodes = getNodeAttributes(weakEntity.id, nodes, links);
    attrNodes.forEach(attr => {
      if (attr.type === 'derived_attribute') return;
      if (attr.type === 'multivalued_attribute') return;

      const expanded = expandSimpleAttributes(attr, nodes, links);
      expanded.forEach(simpleAttr => {
        const colName = sanitizeName(simpleAttr.label);
        const isPartialKey = simpleAttr.type === 'key_attribute' || attr.type === 'key_attribute';

        columns.push({
          id: `${tableName}_${colName}`,
          name: colName,
          dataType: inferSQLType(simpleAttr.label, isPartialKey),
          isPrimaryKey: isPartialKey,
          isForeignKey: false,
          isNullable: !isPartialKey,
          isUnique: false,
          stepTrace: {
            stepNumber: 2,
            stepTitle: 'Paso 2: Clave Parcial / Atributo',
            description: isPartialKey
              ? `Clave parcial (discriminador) de la entidad débil '${weakEntity.label}'.`
              : `Atributo de la entidad débil '${weakEntity.label}'.`,
          },
        });
      });
    });

    tables.push({
      id: weakEntity.id,
      name: tableName,
      columns,
      foreignKeys,
      x: weakEntity.x || 60,
      y: weakEntity.y || 60,
      stepTrace,
      sourceNodeType: weakEntity.type,
      lineIndex: weakEntity.lineIndex,
    });
  });

  const relationships = nodes.filter(
    n => n.type === 'relationship' || n.type === 'identifying_relationship'
  );

  relationships.forEach(rel => {
    const relLinks = getConnectedLinks(rel.id, links);
    const entityLinks = relLinks.filter(l => {
      const otherId = l.source === rel.id ? l.target : l.source;
      const otherNode = nodes.find(n => n.id === otherId);
      return otherNode && (otherNode.type === 'entity' || otherNode.type === 'weak_entity');
    });

    if (entityLinks.length === 2) {
      const linkA = entityLinks[0]!;
      const linkB = entityLinks[1]!;

      const entityAId = linkA.source === rel.id ? linkA.target : linkA.source;
      const entityBId = linkB.source === rel.id ? linkB.target : linkB.source;

      const entityANode = nodes.find(n => n.id === entityAId);
      const entityBNode = nodes.find(n => n.id === entityBId);

      const tableA = tables.find(t => t.id === entityAId);
      const tableB = tables.find(t => t.id === entityBId);

      if (tableA && tableB && entityANode && entityBNode) {
        const cardA = (linkA.label ?? 'N').toUpperCase();
        const cardB = (linkB.label ?? 'N').toUpperCase();

        const isAOne = cardA === '1' || cardA === '0..1' || cardA === '1..1';
        const isBOne = cardB === '1' || cardB === '0..1' || cardB === '1..1';

        // PASO 3: Relaciones 1:1
        if (isAOne && isBOne) {
          const isATotal = linkA.style === 'double';
          const targetTable = isATotal ? tableA : tableB;
          const sourceTable = isATotal ? tableB : tableA;

          const sourcePKs = sourceTable.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
          const fkColNames: string[] = [];

          sourcePKs.forEach((pkCol: RelationalColumn) => {
            const fkName = `${rel.label}_${sourceTable.name}_${pkCol.name}`;
            fkColNames.push(fkName);

            targetTable.columns.push({
              id: `${targetTable.name}_${fkName}`,
              name: sanitizeName(fkName),
              dataType: pkCol.dataType,
              isPrimaryKey: false,
              isForeignKey: true,
              isNullable: !isATotal,
              isUnique: true,
              stepTrace: {
                stepNumber: 3,
                stepTitle: 'Paso 3: FK en Relación Binaria 1:1',
                description: `Clave ajena propagada para modelar la relación 1:1 '${rel.label}'. Contiene restricción UNIQUE.`,
              },
            });
          });

          targetTable.foreignKeys.push({
            id: `FK_${targetTable.name}_${rel.label}_${sourceTable.name}`,
            constraintName: `FK_${targetTable.name}_${sourceTable.name}`,
            sourceColumnNames: fkColNames.map(sanitizeName),
            targetTableName: sourceTable.name,
            targetColumnNames: sourcePKs.map((c: RelationalColumn) => c.name),
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 3,
              stepTitle: 'Paso 3: Restricción FK 1:1',
              description: `Restricción referencial 1:1 entre '${targetTable.name}' y '${sourceTable.name}'.`,
            },
          });
        }
        // PASO 4: Relaciones 1:N
        else if (isAOne || isBOne) {
          const tableOne = isAOne ? tableA : tableB;
          const tableMany = isAOne ? tableB : tableA;

          const onePKs = tableOne.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
          const fkColNames: string[] = [];

          onePKs.forEach((pkCol: RelationalColumn) => {
            const fkName = `${tableOne.name}_${pkCol.name}`;
            fkColNames.push(fkName);

            tableMany.columns.push({
              id: `${tableMany.name}_${fkName}`,
              name: sanitizeName(fkName),
              dataType: pkCol.dataType,
              isPrimaryKey: false,
              isForeignKey: true,
              isNullable: false,
              isUnique: false,
              stepTrace: {
                stepNumber: 4,
                stepTitle: 'Paso 4: FK en Relación Binaria 1:N',
                description: `Propagación de la clave primaria de la tabla del lado 1 '${tableOne.name}' como FK en la tabla del lado N '${tableMany.name}'.`,
              },
            });
          });

          const relAttrs = getNodeAttributes(rel.id, nodes, links);
          relAttrs.forEach(attr => {
            const expanded = expandSimpleAttributes(attr, nodes, links);
            expanded.forEach(simpleAttr => {
              tableMany.columns.push({
                id: `${tableMany.name}_${rel.label}_${simpleAttr.label}`,
                name: sanitizeName(`${rel.label}_${simpleAttr.label}`),
                dataType: inferSQLType(simpleAttr.label),
                isPrimaryKey: false,
                isForeignKey: false,
                isNullable: true,
                isUnique: false,
                stepTrace: {
                  stepNumber: 4,
                  stepTitle: 'Paso 4: Atributo de Relación 1:N',
                  description: `Atributo de la relación 1:N migrado a la tabla del lado N '${tableMany.name}'.`,
                },
              });
            });
          });

          tableMany.foreignKeys.push({
            id: `FK_${tableMany.name}_${tableOne.name}`,
            constraintName: `FK_${tableMany.name}_${tableOne.name}`,
            sourceColumnNames: fkColNames.map(sanitizeName),
            targetTableName: tableOne.name,
            targetColumnNames: onePKs.map((c: RelationalColumn) => c.name),
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 4,
              stepTitle: 'Paso 4: Restricción FK 1:N',
              description: `Restricción de clave ajena referenciando al lado 1 '${tableOne.name}'.`,
            },
          });
        }
        // PASO 5: Relaciones M:N
        else {
          const bridgeTableName = sanitizeName(rel.label || `${tableA.name}_${tableB.name}`);
          const bridgeColumns: RelationalColumn[] = [];
          const bridgeFKs: ForeignKeyConstraint[] = [];

          const pksA = tableA.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
          const fkColsA: string[] = [];
          pksA.forEach((pk: RelationalColumn) => {
            const colName = sanitizeName(`${tableA.name}_${pk.name}`);
            fkColsA.push(colName);
            bridgeColumns.push({
              id: `${bridgeTableName}_${colName}`,
              name: colName,
              dataType: pk.dataType,
              isPrimaryKey: true,
              isForeignKey: true,
              isNullable: false,
              isUnique: false,
              stepTrace: {
                stepNumber: 5,
                stepTitle: 'Paso 5: Componente PK/FK M:N (Entidad A)',
                description: `Clave ajena participante de '${tableA.name}' formando la PK compuesta de la tabla puente M:N.`,
              },
            });
          });

          bridgeFKs.push({
            id: `FK_${bridgeTableName}_${tableA.name}`,
            constraintName: `FK_${bridgeTableName}_${tableA.name}`,
            sourceColumnNames: fkColsA,
            targetTableName: tableA.name,
            targetColumnNames: pksA.map((c: RelationalColumn) => c.name),
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 5,
              stepTitle: 'Paso 5: Restricción FK M:N',
              description: `Integridad referencial a '${tableA.name}' con CASCADE.`,
            },
          });

          const pksB = tableB.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
          const fkColsB: string[] = [];
          pksB.forEach((pk: RelationalColumn) => {
            const colName = sanitizeName(`${tableB.name}_${pk.name}`);
            fkColsB.push(colName);
            bridgeColumns.push({
              id: `${bridgeTableName}_${colName}`,
              name: colName,
              dataType: pk.dataType,
              isPrimaryKey: true,
              isForeignKey: true,
              isNullable: false,
              isUnique: false,
              stepTrace: {
                stepNumber: 5,
                stepTitle: 'Paso 5: Componente PK/FK M:N (Entidad B)',
                description: `Clave ajena participante de '${tableB.name}' formando la PK compuesta de la tabla puente M:N.`,
              },
            });
          });

          bridgeFKs.push({
            id: `FK_${bridgeTableName}_${tableB.name}`,
            constraintName: `FK_${bridgeTableName}_${tableB.name}`,
            sourceColumnNames: fkColsB,
            targetTableName: tableB.name,
            targetColumnNames: pksB.map((c: RelationalColumn) => c.name),
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 5,
              stepTitle: 'Paso 5: Restricción FK M:N',
              description: `Integridad referencial a '${tableB.name}' con CASCADE.`,
            },
          });

          const relAttrs = getNodeAttributes(rel.id, nodes, links);
          relAttrs.forEach(attr => {
            const expanded = expandSimpleAttributes(attr, nodes, links);
            expanded.forEach(simpleAttr => {
              bridgeColumns.push({
                id: `${bridgeTableName}_${simpleAttr.label}`,
                name: sanitizeName(simpleAttr.label),
                dataType: inferSQLType(simpleAttr.label),
                isPrimaryKey: false,
                isForeignKey: false,
                isNullable: true,
                isUnique: false,
                stepTrace: {
                  stepNumber: 5,
                  stepTitle: 'Paso 5: Atributo Propio M:N',
                  description: `Atributo de la relación muchos-a-muchos incorporado como columna en la tabla puente.`,
                },
              });
            });
          });

          tables.push({
            id: rel.id,
            name: bridgeTableName,
            columns: bridgeColumns,
            foreignKeys: bridgeFKs,
            x: rel.x || 60,
            y: rel.y || 60,
            stepTrace: {
              stepNumber: 5,
              stepTitle: 'Paso 5: Mapeado de Relaciones M:N Binarias',
              description: `Se crea la tabla puente '${bridgeTableName}' para representar la relación muchos-a-muchos. Su PK es la unión de las FKs de ambas entidades.`,
              sourceEERNodeId: rel.id,
              sourceEERNodeLabel: rel.label,
            },
            sourceNodeType: rel.type,
            lineIndex: rel.lineIndex,
          });
        }
      }
    } else if (entityLinks.length >= 3) {
      // =====================================================================
      // PASO 7: Mapeado de Relaciones N-arias (n > 2 entidades participantes)
      // =====================================================================
      const participants = entityLinks
        .map(link => {
          const entityId = link.source === rel.id ? link.target : link.source;
          return {
            table: tables.find(t => t.id === entityId),
            cardinality: (link.label ?? 'N').toUpperCase(),
          };
        })
        .filter((p): p is { table: RelationalTable; cardinality: string } => !!p.table);

      if (participants.length === entityLinks.length) {
        const bridgeTableName = sanitizeName(
          rel.label || participants.map(p => p.table.name).join('_')
        );
        const bridgeColumns: RelationalColumn[] = [];
        const bridgeFKs: ForeignKeyConstraint[] = [];

        participants.forEach(({ table, cardinality }) => {
          // Regla de excepción del Paso 7: si la entidad tiene restricción de
          // cardinalidad 1, su FK queda fuera de la PK compuesta de la tabla de relación.
          const hasCardinalityOne = cardinality === '1' || cardinality === '0..1' || cardinality === '1..1';
          const pks = table.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
          const fkColNames: string[] = [];

          pks.forEach((pk: RelationalColumn) => {
            const colName = sanitizeName(`${table.name}_${pk.name}`);
            fkColNames.push(colName);
            bridgeColumns.push({
              id: `${bridgeTableName}_${colName}`,
              name: colName,
              dataType: pk.dataType,
              isPrimaryKey: !hasCardinalityOne,
              isForeignKey: true,
              isNullable: false,
              isUnique: false,
              stepTrace: {
                stepNumber: 7,
                stepTitle: hasCardinalityOne
                  ? 'Paso 7 (N-aria): FK excluida de la PK por cardinalidad 1'
                  : 'Paso 7 (N-aria): Componente de la PK Compuesta',
                description: hasCardinalityOne
                  ? `Clave ajena de '${table.name}' excluida de la PK por su restricción de cardinalidad 1 en la relación n-aria '${rel.label}'.`
                  : `Clave ajena de '${table.name}' participante de la PK compuesta de la relación n-aria '${rel.label}'.`,
              },
            });
          });

          bridgeFKs.push({
            id: `FK_${bridgeTableName}_${table.name}`,
            constraintName: `FK_${bridgeTableName}_${table.name}`,
            sourceColumnNames: fkColNames,
            targetTableName: table.name,
            targetColumnNames: pks.map((c: RelationalColumn) => c.name),
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 7,
              stepTitle: 'Paso 7: Restricción FK N-aria',
              description: `Integridad referencial a '${table.name}' con CASCADE.`,
            },
          });
        });

        const relAttrs = getNodeAttributes(rel.id, nodes, links);
        relAttrs.forEach(attr => {
          const expanded = expandSimpleAttributes(attr, nodes, links);
          expanded.forEach(simpleAttr => {
            bridgeColumns.push({
              id: `${bridgeTableName}_${simpleAttr.label}`,
              name: sanitizeName(simpleAttr.label),
              dataType: inferSQLType(simpleAttr.label),
              isPrimaryKey: false,
              isForeignKey: false,
              isNullable: true,
              isUnique: false,
              stepTrace: {
                stepNumber: 7,
                stepTitle: 'Paso 7: Atributo Propio de la Relación N-aria',
                description: `Atributo de la relación n-aria incorporado como columna en la tabla de relación.`,
              },
            });
          });
        });

        tables.push({
          id: rel.id,
          name: bridgeTableName,
          columns: bridgeColumns,
          foreignKeys: bridgeFKs,
          x: rel.x || 60,
          y: rel.y || 60,
          stepTrace: {
            stepNumber: 7,
            stepTitle: 'Paso 7: Mapeado de Relaciones N-arias (n > 2)',
            description: `Se crea la tabla de relación '${bridgeTableName}' para representar la relación n-aria entre ${participants.length} entidades. Su PK es la combinación de las FKs de las entidades sin restricción de cardinalidad 1.`,
            sourceEERNodeId: rel.id,
            sourceEERNodeLabel: rel.label,
          },
          sourceNodeType: rel.type,
          lineIndex: rel.lineIndex,
        });
      }
    }
  });

  // =========================================================================
  // PASO 6: Mapeado de Atributos Multivalorados
  // =========================================================================
  const multiValuedAttrs = nodes.filter(n => n.type === 'multivalued_attribute');

  multiValuedAttrs.forEach(attr => {
    const parentIds = getNeighborNodeIds(attr.id, links);
    const parentNode = nodes.find(n => parentIds.includes(n.id) && (n.type === 'entity' || n.type === 'weak_entity'));
    const parentTable = parentNode ? tables.find(t => t.id === parentNode.id) : undefined;

    if (parentTable) {
      const tableName = sanitizeName(`${parentTable.name}_${attr.label}`);
      const columns: RelationalColumn[] = [];
      const foreignKeys: ForeignKeyConstraint[] = [];

      const parentPKs = parentTable.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
      const fkCols: string[] = [];

      parentPKs.forEach((pk: RelationalColumn) => {
        const colName = sanitizeName(`${parentTable.name}_${pk.name}`);
        fkCols.push(colName);
        columns.push({
          id: `${tableName}_${colName}`,
          name: colName,
          dataType: pk.dataType,
          isPrimaryKey: true,
          isForeignKey: true,
          isNullable: false,
          isUnique: false,
          stepTrace: {
            stepNumber: 6,
            stepTitle: 'Paso 6: FK Propietario de Atributo Multivalorado',
            description: `Clave ajena de la entidad propietaria formando parte de la PK de la tabla del atributo multivalor.`,
          },
        });
      });

      const valColName = sanitizeName(attr.label);
      columns.push({
        id: `${tableName}_${valColName}`,
        name: valColName,
        dataType: inferSQLType(attr.label),
        isPrimaryKey: true,
        isForeignKey: false,
        isNullable: false,
        isUnique: false,
        stepTrace: {
          stepNumber: 6,
          stepTitle: 'Paso 6: Valor del Atributo Multivalorado',
          description: `Columna que almacena cada uno de los múltiples valores asociados a la entidad.`,
        },
      });

      foreignKeys.push({
        id: `FK_${tableName}_${parentTable.name}`,
        constraintName: `FK_${tableName}_${parentTable.name}`,
        sourceColumnNames: fkCols,
        targetTableName: parentTable.name,
        targetColumnNames: parentPKs.map((c: RelationalColumn) => c.name),
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        stepTrace: {
          stepNumber: 6,
          stepTitle: 'Paso 6: Restricción FK con CASCADE',
          description: `ON DELETE CASCADE para eliminar los valores multivalorados al borrar la entidad propietaria.`,
        },
      });

      tables.push({
        id: attr.id,
        name: tableName,
        columns,
        foreignKeys,
        x: attr.x || 60,
        y: attr.y || 60,
        stepTrace: {
          stepNumber: 6,
          stepTitle: 'Paso 6: Mapeado de Atributos Multivalorados',
          description: `Se crea la tabla independiente '${tableName}' para evitar violar la Primera Forma Normal (1FN).`,
          sourceEERNodeId: attr.id,
          sourceEERNodeLabel: attr.label,
        },
        sourceNodeType: attr.type,
        lineIndex: attr.lineIndex,
      });
    }
  });

  // =========================================================================
  // PASO 8: Mapeado de Especialización o Generalización
  // =========================================================================
  const specializations = nodes.filter(n => n.type === 'specialization');

  specializations.forEach(spec => {
    const connectedLinks = links.filter(l => l.source === spec.id || l.target === spec.id);
    
    // Identificar superclase (enlace entrante o primer nodo)
    const superLink = connectedLinks.find(l => l.target === spec.id);
    const subLinks = connectedLinks.filter(l => l.source === spec.id);

    const superNodeId = superLink ? superLink.source : getNeighborNodeIds(spec.id, links)[0];
    const subNodeIds = subLinks.length > 0 
      ? subLinks.map(l => l.target) 
      : getNeighborNodeIds(spec.id, links).filter(id => id !== superNodeId);

    const superNode = nodes.find(n => n.id === superNodeId);
    const superTable = superNode ? tables.find(t => t.id === superNode.id || t.name === sanitizeName(superNode.label)) : undefined;

    if (superTable && subNodeIds.length > 0) {
      const selectedOption = config.inheritanceOptions[spec.id] ?? '8A';

      subNodeIds.forEach(subId => {
        const subNode = nodes.find(n => n.id === subId);
        const subTable = subNode ? tables.find(t => t.id === subNode.id || t.name === sanitizeName(subNode.label)) : undefined;

        if (subTable && subTable.id !== superTable.id) {
          if (selectedOption === '8A') {
            const superPKs = superTable.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
            const fkCols: string[] = [];

            superPKs.forEach((pk: RelationalColumn) => {
              const colName = pk.name;
              fkCols.push(colName);

              if (!subTable.columns.some((c: RelationalColumn) => c.name === colName)) {
                subTable.columns.unshift({
                  id: `${subTable.name}_${colName}`,
                  name: colName,
                  dataType: pk.dataType,
                  isPrimaryKey: true,
                  isForeignKey: true,
                  isNullable: false,
                  isUnique: true,
                  stepTrace: {
                    stepNumber: 8,
                    stepTitle: 'Paso 8 (Opción 8A): PK/FK de Superclase Heredada',
                    description: `Clave heredada de la superclase '${superTable.name}' actuando como PK y FK en la subclase.`,
                  },
                });
              }
            });

            subTable.foreignKeys.push({
              id: `FK_${subTable.name}_${superTable.name}`,
              constraintName: `FK_${subTable.name}_${superTable.name}`,
              sourceColumnNames: fkCols,
              targetTableName: superTable.name,
              targetColumnNames: superPKs.map((c: RelationalColumn) => c.name),
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
              stepTrace: {
                stepNumber: 8,
                stepTitle: 'Paso 8 (Opción 8A): Enlace de Herencia FK',
                description: `Restricción de herencia asociando la subclase '${subTable.name}' a su superclase '${superTable.name}'.`,
              },
            });
          }
        }
      });
    }
  });

  // =========================================================================
  // PASO 9: Mapeado de Tipos de Unión (Categorías)
  // =========================================================================
  const unionNodes = nodes.filter(n => n.type === 'union' || n.meta === 'u');

  unionNodes.forEach(unionNode => {
    const connectedLinks = links.filter(l => l.source === unionNode.id || l.target === unionNode.id);

    const categoryLink = connectedLinks.find(l => l.source === unionNode.id) || connectedLinks.find(l => l.style === 'double');
    const superclassLinks = connectedLinks.filter(
      l => !(categoryLink && l.source === categoryLink.source && l.target === categoryLink.target)
    );

    const categoryNodeId = categoryLink 
      ? (categoryLink.source === unionNode.id ? categoryLink.target : categoryLink.source)
      : undefined;

    const categoryNode = categoryNodeId ? nodes.find(n => n.id === categoryNodeId) : undefined;
    const categoryTable = categoryNode 
      ? tables.find(t => t.id === categoryNode.id || t.name === sanitizeName(categoryNode.label)) 
      : undefined;

    if (categoryTable) {
      categoryTable.stepTrace = {
        stepNumber: 9,
        stepTitle: 'Paso 9: Mapeado de Categoría (Tipo de Unión)',
        description: `Se crea la tabla de categoría '${categoryTable.name}' con su clave sustituta artificial como PK.`,
        sourceEERNodeId: categoryNode!.id,
        sourceEERNodeLabel: categoryNode!.label,
      };

      const categoryPK = categoryTable.columns.find((c: RelationalColumn) => c.isPrimaryKey);

      if (categoryPK) {
        superclassLinks.forEach(sLink => {
          const superNodeId = sLink.source === unionNode.id ? sLink.target : sLink.source;
          const superNode = nodes.find(n => n.id === superNodeId);
          const superTable = superNode 
            ? tables.find(t => t.id === superNode.id || t.name === sanitizeName(superNode.label)) 
            : undefined;

          if (superTable && superTable.id !== categoryTable.id) {
            const fkColName = `${categoryTable.name}_${categoryPK.name}`;

            if (!superTable.columns.some((c: RelationalColumn) => c.name === fkColName)) {
              superTable.columns.push({
                id: `${superTable.name}_${fkColName}`,
                name: fkColName,
                dataType: categoryPK.dataType,
                isPrimaryKey: false,
                isForeignKey: true,
                isNullable: true,
                isUnique: false,
                stepTrace: {
                  stepNumber: 9,
                  stepTitle: 'Paso 9: FK de Categoría de Unión (Caso 9.1)',
                  description: `Clave ajena que vincula la superclase '${superTable.name}' con la categoría sustituta '${categoryTable.name}'.`,
                },
              });

              superTable.foreignKeys.push({
                id: `FK_${superTable.name}_${categoryTable.name}`,
                constraintName: `FK_${superTable.name}_${categoryTable.name}`,
                sourceColumnNames: [fkColName],
                targetTableName: categoryTable.name,
                targetColumnNames: [categoryPK.name],
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
                stepTrace: {
                  stepNumber: 9,
                  stepTitle: 'Paso 9: Restricción FK de Categoría',
                  description: `Integridad referencial que asocia la superclase a la categoría '${categoryTable.name}'.`,
                },
              });
            }
          }
        });
      }
    }
  });

  // Aplicar distribución automática inteligente respetando posiciones guardadas
  applySmartAutoLayout(tables, savedPositions);

  return {
    tables,
    config,
  };
}
