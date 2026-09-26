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
  CascadeOption,
} from '../../types/relational';
import type { StepKey } from '../../i18n/steps';

/**
 * Normaliza nombres de tabla y columna para formato SQL
 */
function sanitizeName(name?: string): string {
  if (!name || typeof name !== 'string') {
    return '_SIN_NOMBRE';
  }
  return (
    name
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^([0-9])/, '_$1')
      .toUpperCase() || '_SIN_NOMBRE'
  );
}

/**
 * Deduce un tipo de dato SQL en función del nombre del atributo
 */
function inferSQLType(attrName?: string, isKey: boolean = false): string {
  if (!attrName || typeof attrName !== 'string') {
    return 'VARCHAR2(100)';
  }
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
 * Atributos de un nodo que se materializan como columnas.
 *
 * Excluye los derivados (se recalculan, no se almacenan) y los multivaluados (violarían
 * la 1FN; el Paso 6 les crea su propia tabla). La regla vive aquí, en el mecanismo, para
 * que valga igual colgando de una entidad (Pasos 1 y 2) que de una relación (Pasos 4, 5 y 7).
 */
function getMappableAttributes(nodeId: string, nodes: NodeData[], links: LinkData[]): NodeData[] {
  return getNodeAttributes(nodeId, nodes, links).filter(
    attr => attr.type !== 'derived_attribute' && attr.type !== 'multivalued_attribute'
  );
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
 * Acción `ON DELETE` de una FK que NO expresa dependencia existencial (Pasos 3, 4 y 9).
 *
 * Una FK opcional se anula al borrar la fila referenciada (el hijo sobrevive sin vínculo);
 * una FK obligatoria bloquea el borrado para no dejar huérfanos. `CASCADE` queda reservado a
 * los pasos donde la fila hija no existe sin la padre (2, 6 y 8A): borrar en cascada entidades
 * independientes —los profesores de un departamento— sería un efecto colateral peligroso.
 */
function nonDependentOnDelete(isNullable: boolean): CascadeOption {
  return isNullable ? 'SET NULL' : 'NO ACTION';
}

interface RelationshipAttributeOptions {
  step: 3 | 4 | 5 | 7;
  tableName: string;
  /** Prefija el nombre con el de la relación: evita choques al migrar a una tabla de entidad (Pasos 3/4). */
  prefixWithRelationship: boolean;
}

/**
 * Columnas de los atributos propios de una relación.
 *
 * En una tabla de relación (Pasos 5 y 7) un atributo clave forma parte de la PK compuesta:
 * p. ej. `VUELTA` en `CIRCULA(PILOTO, TRAMO, VUELTA)`, porque un piloto recorre el mismo tramo
 * varias veces. En los Pasos 3/4 los atributos migran a una tabla de entidad, cuya PK ya está
 * fijada, así que un atributo clave allí no tiene significado formal (el linter EER lo advierte).
 */
function buildRelationshipAttributeColumns(
  rel: NodeData,
  nodes: NodeData[],
  links: LinkData[],
  { step, tableName, prefixWithRelationship }: RelationshipAttributeOptions
): RelationalColumn[] {
  const keysJoinPK = step === 5 || step === 7;
  const columns: RelationalColumn[] = [];

  getMappableAttributes(rel.id, nodes, links).forEach(attr => {
    expandSimpleAttributes(attr, nodes, links).forEach(simpleAttr => {
      const isKey = keysJoinPK && (simpleAttr.type === 'key_attribute' || attr.type === 'key_attribute');
      const colName = sanitizeName(prefixWithRelationship ? `${rel.label}_${simpleAttr.label}` : simpleAttr.label);
      const stepKey: StepKey =
        step === 3 ? 'STEP3_ATTR'
        : step === 4 ? 'STEP4_ATTR'
        : step === 5 ? (isKey ? 'STEP5_ATTR_PK' : 'STEP5_ATTR')
        : (isKey ? 'STEP7_ATTR_PK' : 'STEP7_ATTR');

      columns.push({
        id: `${tableName}_${colName}`,
        name: colName,
        dataType: inferSQLType(simpleAttr.label, isKey),
        isPrimaryKey: isKey,
        isForeignKey: false,
        isNullable: !isKey,
        isUnique: false,
        stepTrace: {
          stepNumber: step,
          stepKey,
          params: { tableName, attrLabel: simpleAttr.label, relLabel: rel.label },
          sourceEERNodeId: simpleAttr.id,
          sourceEERNodeLabel: simpleAttr.label,
        },
      });
    });
  });

  return columns;
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

  /**
   * Añade una columna solo si la tabla no tiene ya otra con el mismo nombre.
   * Varios pasos pueden alcanzar la misma tabla (una subclase accesible desde dos nodos
   * `spec`, una superclase en dos uniones...); la idempotencia vive aquí, en el mecanismo,
   * en vez de repetirse como guard ad-hoc en cada paso.
   */
  function addColumn(table: RelationalTable, column: RelationalColumn, position: 'start' | 'end' = 'end') {
    if (table.columns.some((c: RelationalColumn) => c.name === column.name)) return;
    if (position === 'start') {
      table.columns.unshift(column);
    } else {
      table.columns.push(column);
    }
  }

  /**
   * Añade una restricción de clave ajena solo si no existe ya otra con el mismo
   * `constraintName`. Sin esto, dos pasos que alcancen la misma tabla emiten dos
   * `CONSTRAINT` homónimos y el DDL generado no compila en Oracle.
   */
  function addForeignKey(table: RelationalTable, fk: ForeignKeyConstraint) {
    if (table.foreignKeys.some((f: ForeignKeyConstraint) => f.constraintName === fk.constraintName)) return;
    table.foreignKeys.push(fk);
  }

  // =========================================================================
  // PASO 1: Mapeado de los Tipos de Entidad Regulares (Fuertes)
  // =========================================================================
  const strongEntities = nodes.filter(n => n.type === 'entity');

  strongEntities.forEach(entity => {
    const tableName = sanitizeName(entity.label);
    const attrNodes = getMappableAttributes(entity.id, nodes, links);

    const columns: RelationalColumn[] = [];
    const stepTrace: StepTrace = {
      stepNumber: 1,
      stepKey: 'STEP1_STRONG_ENTITY',
      params: { tableName, entityLabel: entity.label },
      sourceEERNodeId: entity.id,
      sourceEERNodeLabel: entity.label,
    };

    attrNodes.forEach(attr => {
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
            stepKey: isKey ? 'STEP1_ATTR_PK' : 'STEP1_ATTR_COLUMN',
            params: { attrLabel: simpleAttr.label },
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
          stepKey: 'STEP1_DEFAULT_PK',
          params: { defaultKeyName },
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

  // Registro de nodos de relación ya reclamados por un paso anterior. El bucle genérico
  // de relaciones (Pasos 3/4/5/7) debe saltárselos: si volviera a procesar una relación
  // identificativa como binaria normal, propagaría por segunda vez la misma FK, duplicando
  // columna y restricción en la tabla de la entidad débil.
  // Se reclama por semántica (es una relación identificativa de una entidad débil), no por
  // que su procesamiento haya tenido éxito: si el propietario no se resuelve, la relación
  // sigue siendo del Paso 2 y no debe caer al bucle genérico.
  const consumedRelationshipIds = new Set<string>();

  weakEntities.forEach(weakEntity => {
    const tableName = sanitizeName(weakEntity.label);
    const stepTrace: StepTrace = {
      stepNumber: 2,
      stepKey: 'STEP2_WEAK_ENTITY',
      params: { tableName, weakEntityLabel: weakEntity.label },
      sourceEERNodeId: weakEntity.id,
      sourceEERNodeLabel: weakEntity.label,
    };

    const connectedRelIds = getNeighborNodeIds(weakEntity.id, links);
    // `filter`, no `find`: una entidad débil puede tener más de una relación identificativa
    // conectada. Todas pertenecen al Paso 2 y todas deben reclamarse, o las no reclamadas
    // reaparecerían en el bucle genérico propagando FKs duplicadas.
    const identifyingRels = nodes.filter(
      n => connectedRelIds.includes(n.id) && n.type === 'identifying_relationship'
    );
    identifyingRels.forEach(rel => consumedRelationshipIds.add(rel.id));

    const identifyingRel = identifyingRels[0];

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
              stepKey: 'STEP2_FK_OWNER',
              params: { ownerTableName: ownerTable.name },
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
            stepKey: 'STEP2_FK_CASCADE',
          },
        });
      }
    }

    const attrNodes = getMappableAttributes(weakEntity.id, nodes, links);
    attrNodes.forEach(attr => {
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
            stepKey: isPartialKey ? 'STEP2_PARTIAL_KEY' : 'STEP2_ATTRIBUTE',
            params: { weakEntityLabel: weakEntity.label },
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

  // =========================================================================
  // PASO 8: Mapeado de Especialización o Generalización
  // =========================================================================
  // Se procesa antes de los Pasos 3/4/5/6/7 para establecer la PK definitiva de las subclases
  // (retirando cualquier PK sintética) antes de que las relaciones propaguen claves ajenas.
  const specializations = nodes.filter(n => n.type === 'specialization');

  let passChanged = true;
  let passCount = 0;
  while (passChanged && passCount < Math.max(1, specializations.length)) {
    passChanged = false;
    passCount++;

    specializations.forEach(spec => {
      const connectedLinks = links.filter(l => l.source === spec.id || l.target === spec.id);

      const superLink = connectedLinks.find(l => l.target === spec.id);
      const subLinks = connectedLinks.filter(l => l.source === spec.id);

      const superNodeId = superLink ? superLink.source : getNeighborNodeIds(spec.id, links)[0];
      const subNodeIds = subLinks.length > 0
        ? subLinks.map(l => l.target)
        : getNeighborNodeIds(spec.id, links).filter(id => id !== superNodeId);

      const superNode = nodes.find(n => n.id === superNodeId);
      const superTable = superNode ? tables.find(t => t.id === superNode.id || t.name === sanitizeName(superNode.label)) : undefined;

      // Especialización definida por atributo: el atributo definidor pertenece a la superclase.
      // Si el alumno no lo declaró también como `att`, se materializa aquí; si lo declaró,
      // `addColumn` lo deja como está. Sin atributo definidor (definida por el usuario) no hay
      // columna discriminante.
      if (superTable && spec.definingAttribute) {
        const colName = sanitizeName(spec.definingAttribute);
        addColumn(superTable, {
          id: `${superTable.name}_${colName}`,
          name: colName,
          dataType: inferSQLType(spec.definingAttribute),
          isPrimaryKey: false,
          isForeignKey: false,
          isNullable: true,
          isUnique: false,
          stepTrace: {
            stepNumber: 8,
            stepKey: 'STEP8_DEFINING_ATTR',
            params: { superTableName: superTable.name, attrLabel: spec.definingAttribute },
            sourceEERNodeId: spec.id,
          },
        });
      }

      if (superTable && subNodeIds.length > 0) {
        const selectedOption = config.inheritanceOptions[spec.id] ?? '8A';

        subNodeIds.forEach(subId => {
          const subNode = nodes.find(n => n.id === subId);
          const subTable = subNode ? tables.find(t => t.id === subNode.id || t.name === sanitizeName(subNode.label)) : undefined;

          if (subTable && subTable.id !== superTable.id) {
            if (selectedOption === '8A') {
              const superPKs = superTable.columns.filter((c: RelationalColumn) => c.isPrimaryKey);
              if (superPKs.length > 0) {
                const hadDefaultPK = subTable.columns.some((c: RelationalColumn) => c.stepTrace?.stepKey === 'STEP1_DEFAULT_PK');
                if (hadDefaultPK) {
                  subTable.columns = subTable.columns.filter((c: RelationalColumn) => c.stepTrace?.stepKey !== 'STEP1_DEFAULT_PK');
                  passChanged = true;
                }

                const fkCols: string[] = [];

                superPKs.forEach((pk: RelationalColumn) => {
                  const colName = pk.name;
                  fkCols.push(colName);

                  const lenBefore = subTable.columns.length;
                  addColumn(subTable, {
                    id: `${subTable.name}_${colName}`,
                    name: colName,
                    dataType: pk.dataType,
                    isPrimaryKey: true,
                    isForeignKey: true,
                    isNullable: false,
                    isUnique: true,
                    stepTrace: {
                      stepNumber: 8,
                      stepKey: 'STEP8A_PK_FK_INHERITED',
                      params: { superTableName: superTable.name },
                    },
                  }, 'start');

                  if (subTable.columns.length > lenBefore) {
                    passChanged = true;
                  }
                });

                addForeignKey(subTable, {
                  id: `FK_${subTable.name}_${superTable.name}`,
                  constraintName: `FK_${subTable.name}_${superTable.name}`,
                  sourceColumnNames: fkCols,
                  targetTableName: superTable.name,
                  targetColumnNames: superPKs.map((c: RelationalColumn) => c.name),
                  onDelete: 'CASCADE',
                  onUpdate: 'CASCADE',
                  stepTrace: {
                    stepNumber: 8,
                    stepKey: 'STEP8A_FK_LINK',
                    params: { subTableName: subTable.name, superTableName: superTable.name },
                  },
                });
              }
            }
          }
        });
      }
    });
  }

  // =========================================================================
  // PASOS 3, 4, 5 y 7: Relaciones
  // =========================================================================
  const relationships = nodes.filter(
    n =>
      (n.type === 'relationship' || n.type === 'identifying_relationship') &&
      !consumedRelationshipIds.has(n.id)
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
          // La FK va al lado de participación total (sea el primero o el segundo enlace), y
          // solo entonces es obligatoria. Sin participación total, va al segundo y es opcional.
          const isATotal = linkA.style === 'double';
          const isBTotal = linkB.style === 'double';
          const targetTable = isATotal ? tableA : tableB;
          const sourceTable = isATotal ? tableB : tableA;
          const isFKNullable = !(isATotal || isBTotal);
          const onDelete = nonDependentOnDelete(isFKNullable);

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
              isNullable: isFKNullable,
              isUnique: true,
              stepTrace: {
                stepNumber: 3,
                stepKey: 'STEP3_FK_ONE_TO_ONE',
                params: { relLabel: rel.label },
              },
            });
          });

          targetTable.columns.push(
            ...buildRelationshipAttributeColumns(rel, nodes, links, {
              step: 3,
              tableName: targetTable.name,
              prefixWithRelationship: true,
            })
          );

          targetTable.foreignKeys.push({
            id: `FK_${targetTable.name}_${rel.label}_${sourceTable.name}`,
            constraintName: `FK_${targetTable.name}_${sourceTable.name}`,
            sourceColumnNames: fkColNames.map(sanitizeName),
            targetTableName: sourceTable.name,
            targetColumnNames: sourcePKs.map((c: RelationalColumn) => c.name),
            onDelete,
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 3,
              stepKey: onDelete === 'SET NULL' ? 'STEP3_FK_CONSTRAINT_SET_NULL' : 'STEP3_FK_CONSTRAINT',
              params: { targetTableName: targetTable.name, sourceTableName: sourceTable.name },
            },
          });
        }
        // PASO 4: Relaciones 1:N
        else if (isAOne || isBOne) {
          const tableOne = isAOne ? tableA : tableB;
          const tableMany = isAOne ? tableB : tableA;
          // La FK solo es obligatoria si toda entidad del lado N participa en la relación.
          const linkMany = isAOne ? linkB : linkA;
          const isFKNullable = linkMany.style !== 'double';
          const onDelete = nonDependentOnDelete(isFKNullable);

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
              isNullable: isFKNullable,
              isUnique: false,
              stepTrace: {
                stepNumber: 4,
                stepKey: 'STEP4_FK_ONE_TO_MANY',
                params: { tableOneName: tableOne.name, tableManyName: tableMany.name },
              },
            });
          });

          tableMany.columns.push(
            ...buildRelationshipAttributeColumns(rel, nodes, links, {
              step: 4,
              tableName: tableMany.name,
              prefixWithRelationship: true,
            })
          );

          tableMany.foreignKeys.push({
            id: `FK_${tableMany.name}_${tableOne.name}`,
            constraintName: `FK_${tableMany.name}_${tableOne.name}`,
            sourceColumnNames: fkColNames.map(sanitizeName),
            targetTableName: tableOne.name,
            targetColumnNames: onePKs.map((c: RelationalColumn) => c.name),
            onDelete,
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 4,
              stepKey: onDelete === 'SET NULL' ? 'STEP4_FK_CONSTRAINT_SET_NULL' : 'STEP4_FK_CONSTRAINT',
              params: { tableOneName: tableOne.name, tableManyName: tableMany.name },
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
                stepKey: 'STEP5_PK_FK',
                params: { tableName: tableA.name, side: 'A' },
              },
            });
          });

          bridgeFKs.push({
            id: `FK_${bridgeTableName}_${tableA.name}`,
            constraintName: `FK_${bridgeTableName}_${tableA.name}`,
            sourceColumnNames: fkColsA,
            targetTableName: tableA.name,
            targetColumnNames: pksA.map((c: RelationalColumn) => c.name),
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 5,
              stepKey: 'STEP5_FK_CONSTRAINT',
              params: { tableName: tableA.name },
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
                stepKey: 'STEP5_PK_FK',
                params: { tableName: tableB.name, side: 'B' },
              },
            });
          });

          bridgeFKs.push({
            id: `FK_${bridgeTableName}_${tableB.name}`,
            constraintName: `FK_${bridgeTableName}_${tableB.name}`,
            sourceColumnNames: fkColsB,
            targetTableName: tableB.name,
            targetColumnNames: pksB.map((c: RelationalColumn) => c.name),
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 5,
              stepKey: 'STEP5_FK_CONSTRAINT',
              params: { tableName: tableB.name },
            },
          });

          bridgeColumns.push(
            ...buildRelationshipAttributeColumns(rel, nodes, links, {
              step: 5,
              tableName: bridgeTableName,
              prefixWithRelationship: false,
            })
          );

          tables.push({
            id: rel.id,
            name: bridgeTableName,
            columns: bridgeColumns,
            foreignKeys: bridgeFKs,
            x: rel.x || 60,
            y: rel.y || 60,
            stepTrace: {
              stepNumber: 5,
              stepKey: 'STEP5_BRIDGE_TABLE',
              params: { bridgeTableName },
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
                stepKey: hasCardinalityOne ? 'STEP7_PK_EXCLUDED' : 'STEP7_PK_COMPONENT',
                params: { tableName: table.name, relLabel: rel.label },
              },
            });
          });

          bridgeFKs.push({
            id: `FK_${bridgeTableName}_${table.name}`,
            constraintName: `FK_${bridgeTableName}_${table.name}`,
            sourceColumnNames: fkColNames,
            targetTableName: table.name,
            targetColumnNames: pks.map((c: RelationalColumn) => c.name),
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
            stepTrace: {
              stepNumber: 7,
              stepKey: 'STEP7_FK_CONSTRAINT',
              params: { tableName: table.name },
            },
          });
        });

        bridgeColumns.push(
          ...buildRelationshipAttributeColumns(rel, nodes, links, {
            step: 7,
            tableName: bridgeTableName,
            prefixWithRelationship: false,
          })
        );

        tables.push({
          id: rel.id,
          name: bridgeTableName,
          columns: bridgeColumns,
          foreignKeys: bridgeFKs,
          x: rel.x || 60,
          y: rel.y || 60,
          stepTrace: {
            stepNumber: 7,
            stepKey: 'STEP7_BRIDGE_TABLE',
            params: { bridgeTableName, count: String(participants.length) },
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
            stepKey: 'STEP6_FK_OWNER',
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
          stepKey: 'STEP6_VALUE',
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
          stepKey: 'STEP6_FK_CASCADE',
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
          stepKey: 'STEP6_TABLE',
          params: { tableName },
          sourceEERNodeId: attr.id,
          sourceEERNodeLabel: attr.label,
        },
        sourceNodeType: attr.type,
        lineIndex: attr.lineIndex,
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
        stepKey: 'STEP9_CATEGORY_TABLE',
        params: { categoryTableName: categoryTable.name },
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

            addColumn(superTable, {
              id: `${superTable.name}_${fkColName}`,
              name: fkColName,
              dataType: categoryPK.dataType,
              isPrimaryKey: false,
              isForeignKey: true,
              isNullable: true,
              isUnique: false,
              stepTrace: {
                stepNumber: 9,
                stepKey: 'STEP9_FK_CATEGORY',
                params: { superTableName: superTable.name, categoryTableName: categoryTable.name },
              },
            });

            addForeignKey(superTable, {
              id: `FK_${superTable.name}_${categoryTable.name}`,
              constraintName: `FK_${superTable.name}_${categoryTable.name}`,
              sourceColumnNames: [fkColName],
              targetTableName: categoryTable.name,
              targetColumnNames: [categoryPK.name],
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE',
              stepTrace: {
                stepNumber: 9,
                stepKey: 'STEP9_FK_CONSTRAINT',
                params: { categoryTableName: categoryTable.name },
              },
            });
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
