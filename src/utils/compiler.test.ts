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

describe('compileEER — v1.6.0: atributo definidor, lineIndex de enlaces y anti-solapamiento', () => {
  it('parsea el atributo definidor de una especialización y lo rotula en la arista con la superclase', () => {
    const result = compileEER('ent EMPLEADO\nspec d -> EMPLEADO [TipoTrabajo] (400, 420)');
    const spec = result.nodes.find(n => n.type === 'specialization');
    expect(result.isValid).toBe(true);
    expect(spec?.definingAttribute).toBe('TipoTrabajo');
    expect(spec?.x).toBe(400);
    expect(result.links.find(l => l.source === 'EMPLEADO' && l.target === spec?.id)?.label).toBe('TipoTrabajo');
  });

  it('sin corchetes la especialización es definida por el usuario (sin atributo definidor)', () => {
    const result = compileEER('ent EMPLEADO\nspec d -> EMPLEADO');
    expect(result.nodes.find(n => n.type === 'specialization')?.definingAttribute).toBeUndefined();
  });

  it('marca error bloqueante si los corchetes del atributo definidor están vacíos', () => {
    const result = compileEER('ent EMPLEADO\nspec d -> EMPLEADO []');
    expect(result.isValid).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('INVALID_DEFINING_ATTRIBUTE');
  });

  it('cada enlace conoce la línea que lo declara', () => {
    const result = compileEER('ent A\nent B\nrel R\n\nlink A R "1"\nlink B R "N"');
    expect(result.links.map(l => l.lineIndex)).toEqual([4, 5]);
  });

  it('desplaza +100 px en X un atributo pegado con las mismas coordenadas que otro nodo', () => {
    const result = compileEER('ent E (0, 0)\natt A -> E (100, 100)\natt B -> E (100, 100)\natt C -> E (100, 100)');
    const positions = result.nodes.filter(n => n.type === 'attribute').map(n => `${n.x},${n.y}`);
    expect(positions).toEqual(['100,100', '200,100', '300,100']);
  });

  it('no desplaza atributos cercanos pero no idénticos (posición intencionada)', () => {
    const result = compileEER('ent E (0, 0)\natt A -> E (100, 100)\natt B -> E (130, 100)');
    expect(result.nodes.find(n => n.label === 'B')?.x).toBe(130);
  });

  it('advierte de un atributo clave en una relación 1:N, pero no en una M:N', () => {
    const base = 'ent PILOTO\nent TRAMO\nrel CIRCULA\nkey_att Vuelta -> CIRCULA\n';
    const oneToMany = compileEER(base + 'link PILOTO CIRCULA "1"\nlink TRAMO CIRCULA "N"');
    const manyToMany = compileEER(base + 'link PILOTO CIRCULA "N"\nlink TRAMO CIRCULA "M"');
    expect(oneToMany.diagnostics.map(d => d.code)).toContain('KEY_ATTRIBUTE_ON_NON_MN_RELATIONSHIP');
    expect(oneToMany.isValid).toBe(true);
    expect(manyToMany.diagnostics).toHaveLength(0);
  });
});
