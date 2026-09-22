// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { NodeData, LinkData } from './index';

/**
 * Severidad de un diagnóstico emitido por el compilador / linter
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

/**
 * Códigos formales de diagnóstico del DSL EER
 */
export type DiagnosticCode =
  | 'MISSING_NODE_NAME'
  | 'MISSING_PARENT_ENTITY'
  | 'INCOMPLETE_LINK'
  | 'UNDECLARED_NODE_REFERENCE'
  | 'DUPLICATE_NODE_IDENTIFIER'
  | 'UNKNOWN_COMMAND'
  | 'INVALID_COORDINATES';

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
