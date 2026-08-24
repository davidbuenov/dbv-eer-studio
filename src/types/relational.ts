// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { StepKey } from '../i18n/steps';

/**
 * Acciones en cascada para la integridad referencial de Claves Foráneas
 */
export type CascadeOption = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

/**
 * Trazabilidad pedagógica de la conversión para alumnos universitarios.
 * Informa sobre cuál de los 9 pasos formales generó cada elemento.
 *
 * Se almacena como datos estructurados (clave + parámetros), no como texto
 * pre-formateado: la traducción e interpolación (ver `src/i18n/steps.ts`) se
 * resuelven en el punto de renderizado, nunca dentro del motor de conversión
 * (ver ADR "StepTrace pasa a datos estructurados" en dbv-specs-ops/memory.md).
 */
export interface StepTrace {
  /** Número del paso formal (1 a 9) */
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** Clave de la plantilla pedagógica (título + descripción) en `src/i18n/steps.ts` */
  stepKey: StepKey;
  /** Valores reales (nombres de tabla/entidad) a interpolar en la plantilla */
  params?: Record<string, string>;
  /** ID del nodo EER origen */
  sourceEERNodeId?: string;
  /** Nombre/Etiqueta del nodo EER origen */
  sourceEERNodeLabel?: string;
}

/**
 * Representación de una Columna en el Modelo Relacional Lógico
 */
export interface RelationalColumn {
  id: string;
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  checkExpression?: string;
  /** Trazabilidad educativa del paso formal */
  stepTrace?: StepTrace;
}

/**
 * Restricción de Clave Foránea (Foreign Key)
 */
export interface ForeignKeyConstraint {
  id: string;
  constraintName: string;
  sourceColumnNames: string[];
  targetTableName: string;
  targetColumnNames: string[];
  onDelete: CascadeOption;
  onUpdate: CascadeOption;
  /** Trazabilidad educativa del paso formal */
  stepTrace?: StepTrace;
}

/**
 * Opciones de Mapeo para Especialización/Generalización (Paso 8)
 * - 8A: Tabla por superclase y por subclase (con FK)
 * - 8B: Tabla solo por subclase concreta (atributos heredados)
 * - 8C: Tabla única con columna discriminadora de tipo
 * - 8D: Tabla única con banderas booleanas por subclase
 */
export type InheritanceOption = '8A' | '8B' | '8C' | '8D';

/**
 * Opciones de Mapeo para Relaciones Binarias 1:1 (Paso 3)
 * - 3.1: Clave Ajena Propagada (Recomendada)
 * - 3.2: Relación Mezclada (Tabla unificada)
 * - 3.3: Referencia Cruzada (Tabla de relación separada)
 */
export type OneToOneOption = '3.1' | '3.2' | '3.3';

/**
 * Representación de una Tabla Relacional con coordenadas visuales (x, y)
 */
export interface RelationalTable {
  id: string;
  name: string;
  columns: RelationalColumn[];
  foreignKeys: ForeignKeyConstraint[];
  /** Coordenada X visual en el Canvas Relacional */
  x: number;
  /** Coordenada Y visual en el Canvas Relacional */
  y: number;
  /** Trazabilidad pedagógica del paso formal principal que creó esta tabla */
  stepTrace: StepTrace;
  /** Tipo de nodo EER conceptual del que procede */
  sourceNodeType?: string;
  /** Índice de línea en el DSL relacional */
  lineIndex?: number;
}

/**
 * Configuración global de opciones de mapeo para el esquema
 */
export interface MappingConfig {
  /** Configuración por nodo de especialización */
  inheritanceOptions: Record<string, InheritanceOption>;
  /** Configuración por relación 1:1 */
  oneToOneOptions: Record<string, OneToOneOption>;
}

/**
 * Esquema Relacional Completo
 */
export interface RelationalSchema {
  tables: RelationalTable[];
  config: MappingConfig;
}
