// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { NodeData, LinkData } from './index';
import type { RelationalSchema } from './relational';

/**
 * Severidad de un diagnóstico emitido por el compilador / linter
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

/**
 * Códigos formales de diagnóstico del DSL EER y DSL Relacional
 */
export type DiagnosticCode =
  // Códigos EER
  | 'MISSING_NODE_NAME'
  | 'MISSING_PARENT_ENTITY'
  | 'INCOMPLETE_LINK'
  | 'UNDECLARED_NODE_REFERENCE'
  | 'DUPLICATE_NODE_IDENTIFIER'
  | 'UNKNOWN_COMMAND'
  | 'INVALID_COORDINATES'
  | 'INVALID_DEFINING_ATTRIBUTE'
  | 'KEY_ATTRIBUTE_ON_NON_MN_RELATIONSHIP'
  // Códigos Relacionales
  | 'MISSING_TABLE_NAME'
  | 'UNCLOSED_TABLE_BLOCK'
  | 'INVALID_COLUMN_DEFINITION'
  | 'INVALID_FOREIGN_KEY_SYNTAX'
  | 'UNDECLARED_TARGET_TABLE'
  | 'UNDECLARED_TARGET_COLUMN'
  | 'TABLE_WITHOUT_PK'
  | 'DUPLICATE_TABLE_NAME'
  | 'DUPLICATE_COLUMN_NAME'
  | 'INVALID_REFERENTIAL_ACTION';

/**
 * Diagnóstico individual en una línea del código fuente
 */
export interface Diagnostic {
  line: number; // 1-indexed para interfaz de usuario
  column?: number;
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  messageKey: string;
  params?: Record<string, string | number>;
  rawMessage?: string;
}

/**
 * Resultado de compilación del código DSL EER
 */
export interface CompileResult {
  isValid: boolean; // false si existen errores bloqueantes (severity === 'error')
  nodes: NodeData[];
  links: LinkData[];
  diagnostics: Diagnostic[];
}

/**
 * Resultado de compilación del código DSL Relacional
 */
export interface CompileRelationalResult {
  isValid: boolean; // false si existen errores bloqueantes (severity === 'error')
  schema: RelationalSchema;
  diagnostics: Diagnostic[];
}
