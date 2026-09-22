// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { compileEER } from './compiler';

describe('compileEER — Compilador y Linter EER', () => {
  it('compila código vacío o solo comentarios sin errores', () => {
    const result = compileEER('// Comentario inicial\n\n-- Otro comentario\n');
    expect(result.isValid).toBe(true);
    expect(result.nodes).toHaveLength(0);
    expect(result.links).toHaveLength(0);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('detecta error bloqueante si una entidad no tiene nombre ("ent ")', () => {
    const code = 'ent EMPLEADO (100, 100)\nent \natt Nombre -> EMPLEADO';
    const result = compileEER(code);

    expect(result.isValid).toBe(false);
    const errorDiag = result.diagnostics.find(d => d.line === 2 && d.severity === 'error');
    expect(errorDiag).toBeDefined();
    expect(errorDiag?.code).toBe('MISSING_NODE_NAME');
    // Verifica que nunca se añade un nodo con id o label indefinido
    expect(result.nodes.every(n => Boolean(n.id) && Boolean(n.label))).toBe(true);
    expect(result.nodes).toHaveLength(2); // EMPLEADO y Nombre
  });

  it('detecta error bloqueante si una relación no tiene nombre ("rel")', () => {
    const code = 'ent EMPLEADO\nrel\n';
    const result = compileEER(code);

    expect(result.isValid).toBe(false);
    const errorDiag = result.diagnostics.find(d => d.line === 2);
    expect(errorDiag?.code).toBe('MISSING_NODE_NAME');
    expect(errorDiag?.messageKey).toBe('compiler.missingRelationshipName');
  });

  it('detecta error si un atributo tiene flecha pero no tiene entidad padre ("att Nombre ->")', () => {
    const code = 'ent EMPLEADO\natt Nombre ->';
    const result = compileEER(code);

    expect(result.isValid).toBe(false);
    const errorDiag = result.diagnostics.find(d => d.line === 2);
    expect(errorDiag?.code).toBe('MISSING_PARENT_ENTITY');
  });

  it('detecta error si un enlace está incompleto ("link EMPLEADO")', () => {
    const code = 'ent EMPLEADO\nlink EMPLEADO';
    const result = compileEER(code);

    expect(result.isValid).toBe(false);
    const errorDiag = result.diagnostics.find(d => d.line === 2);
    expect(errorDiag?.code).toBe('INCOMPLETE_LINK');
  });

  it('emite advertencia no bloqueante si un enlace referencia un nodo no declarado', () => {
    const code = 'ent EMPLEADO\nlink EMPLEADO NO_EXISTE "1:N"';
    const result = compileEER(code);

    // No es bloqueante (isValid sigue siendo true)
    expect(result.isValid).toBe(true);
    const warning = result.diagnostics.find(d => d.code === 'UNDECLARED_NODE_REFERENCE');
    expect(warning).toBeDefined();
    expect(warning?.params?.name).toBe('NO_EXISTE');
    // El enlace roto no se propaga al canvas para evitar errores de renderizado
    expect(result.links).toHaveLength(0);
  });

  it('emite advertencia si hay entidades duplicadas', () => {
    const code = 'ent CLIENTE (100, 100)\nent CLIENTE (200, 200)';
    const result = compileEER(code);

    expect(result.isValid).toBe(true);
    const warning = result.diagnostics.find(d => d.code === 'DUPLICATE_NODE_IDENTIFIER');
    expect(warning).toBeDefined();
    expect(warning?.params?.name).toBe('CLIENTE');
  });

  it('ignora directivas de layout relacional de archivos .eer sin generar error', () => {
    const code = 'ent CLIENTE (100, 100)\nrelational CLIENTE (300, 400)';
    const result = compileEER(code);

    expect(result.isValid).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.nodes).toHaveLength(1);
  });

  it('compila correctamente un diagrama completo válido', () => {
    const code = `
      ent EMPLEADO (100, 100)
      key_att DNI -> EMPLEADO
      att Nombre -> EMPLEADO
      rel TRABAJA_EN (300, 100)
      ent DEPARTAMENTO (500, 100)
      key_att Num_Depto -> DEPARTAMENTO
      link EMPLEADO TRABAJA_EN "N"
      link DEPARTAMENTO TRABAJA_EN "1" [total]
    `.trim();

    const result = compileEER(code);
    expect(result.isValid).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.nodes).toHaveLength(6); // EMPLEADO, DNI, Nombre, TRABAJA_EN, DEPARTAMENTO, Num_Depto
    expect(result.links.length).toBeGreaterThanOrEqual(4);
  });
});
