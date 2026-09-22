// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema } from '../../types/relational';
import { compileRelationalDSL } from './relationalCompiler';

/**
 * Parsea un bloque de código en lenguaje DSL de texto relacional a una estructura RelationalSchema.
 * Soporta coordenadas visuales [x: N, y: N], claves primarias (PK), foráneas (FK -> TABLA(COL)) y nulabilidad.
 * Delega la compilación y validación formal en compileRelationalDSL.
 */
export function parseRelationalDSL(code: string): RelationalSchema {
  return compileRelationalDSL(code).schema;
}

