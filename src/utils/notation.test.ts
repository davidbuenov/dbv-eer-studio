// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { compileEER } from './compiler';
import { eerToRelational } from './relational/eerToRelational';
import { relationalToSQL } from './relational/relationalToSQL';

/*
 * Notación EER añadida en la v1.8.0 (SPECIFICATIONS §3.11 B, D, E y L4), de punta a punta:
 * DSL → nodos/enlaces → modelo relacional → SQL. Todo es aditivo: sin las palabras nuevas, un
 * diagrama significa lo mismo que en la v1.7.0 (lo vigilan las instantáneas de `src/compat`).
 */

const tables = (code: string) => {
  const { nodes, links } = compileEER(code);
  return eerToRelational(nodes, links).tables;
};
const table = (code: string, name: string) => tables(code).find(t => t.name === name)!;

describe('Clave parcial de entidad débil (§3.11 B)', () => {
  const CODE = `ent EDIFICIO
key_att Codigo -> EDIFICIO
weak_ent AULA
partial_key_att Numero -> AULA
ident_rel TIENE
link EDIFICIO TIENE "1"
link AULA TIENE "N" [total]`;

  it('`partial_key_att` crea un nodo `partial_key_attribute`', () => {
    const { nodes, diagnostics } = compileEER(CODE);
    expect(nodes.find(n => n.label === 'Numero')?.type).toBe('partial_key_attribute');
    expect(diagnostics.filter(d => d.severity === 'error')).toEqual([]);
  });

  it('forma la PK de la tabla débil junto a la FK del propietario (Paso 2)', () => {
    const aula = table(CODE, 'AULA');
    expect(aula.columns.filter(c => c.isPrimaryKey).map(c => c.name)).toEqual(['EDIFICIO_CODIGO', 'NUMERO']);
  });

  it('da el mismo modelo que `key_att` en la entidad débil (compatibilidad)', () => {
    const shape = (code: string) =>
      tables(code).map(t => ({
        name: t.name,
        columns: t.columns.map(c => `${c.name}:${c.isPrimaryKey}:${c.isNullable}`),
        foreignKeys: t.foreignKeys.map(f => f.constraintName),
      }));
    expect(shape(CODE)).toEqual(shape(CODE.replace('partial_key_att', 'key_att')));
  });
});

describe('Especialización total y parcial (§3.11 D)', () => {
  const style = (code: string) => compileEER(code).links.find(l => l.target === 'd')?.style;

  it('sin palabra es total (doble línea), como en la v1.7.0', () => {
    expect(style('ent EMPLEADO\nspec d -> EMPLEADO')).toBe('double');
  });

  it('`partial` dibuja línea simple; `total` explícito, doble', () => {
    expect(style('ent EMPLEADO\nspec d -> EMPLEADO partial')).toBe('solid');
    expect(style('ent EMPLEADO\nspec d -> EMPLEADO total')).toBe('double');
    expect(compileEER('ent EMPLEADO\nspec d -> EMPLEADO partial').nodes.find(n => n.id === 'd')?.isPartial).toBe(true);
  });

  it('va después del atributo definidor y admite coordenadas', () => {
    const { nodes, links } = compileEER('ent EMPLEADO\nspec o -> EMPLEADO [Tipo] partial (400, 420)');
    expect(nodes.find(n => n.id === 'o')).toMatchObject({ definingAttribute: 'Tipo', isPartial: true, x: 400, y: 420 });
    expect(links[0]).toMatchObject({ style: 'solid', label: 'Tipo' });
  });

  it('cualquier otra palabra tras la superclase es un error', () => {
    const result = compileEER('ent EMPLEADO\nspec d -> EMPLEADO parcial');
    expect(result.isValid).toBe(false);
    expect(result.diagnostics.map(d => d.code)).toEqual(['INVALID_SPECIALIZATION_OPTION']);
  });
});

describe('Roles (§3.11 E)', () => {
  const supervisa = (card1: string, card2: string) => `ent EMPLEADO
key_att Dni -> EMPLEADO
rel SUPERVISA
link EMPLEADO SUPERVISA "${card1}" role:Supervisor
link EMPLEADO SUPERVISA "${card2}" role:Supervisado [total]`;

  it('`role:Nombre` se guarda en el enlace sin alterar cardinalidad ni participación', () => {
    const { links, diagnostics } = compileEER(supervisa('1', 'N'));
    expect(links.filter(l => l.target === 'SUPERVISA').map(l => [l.label, l.role, l.style])).toEqual([
      ['1', 'Supervisor', 'solid'],
      ['N', 'Supervisado', 'double'],
    ]);
    expect(diagnostics).toEqual([]);
  });

  it('rol vacío o con caracteres no válidos es un error', () => {
    expect(compileEER('ent A\nrel R\nlink A R "1" role:').diagnostics.map(d => d.code)).toEqual(['INVALID_ROLE']);
    expect(compileEER('ent A\nrel R\nlink A R "1" role:a-b').diagnostics.map(d => d.code)).toEqual(['INVALID_ROLE']);
  });

  it('M:N recursiva: el rol da nombre a cada FK (como Super_ssn en Elmasri)', () => {
    const rel = table(supervisa('N', 'M'), 'SUPERVISA');
    expect(rel.columns.map(c => c.name)).toEqual(['SUPERVISOR_DNI', 'SUPERVISADO_DNI']);
    expect(rel.foreignKeys.map(f => `${f.sourceColumnNames[0]}->${f.targetTableName}`)).toEqual([
      'SUPERVISOR_DNI->EMPLEADO',
      'SUPERVISADO_DNI->EMPLEADO',
    ]);
  });

  it('1:N recursiva: la FK toma el rol del lado 1 (el referenciado)', () => {
    expect(table(supervisa('1', 'N'), 'EMPLEADO').columns.map(c => c.name)).toEqual(['DNI', 'SUPERVISOR_DNI']);
  });
});

describe('Claves alternativas (§3.11 L4)', () => {
  it('`key_att X unique` es NOT NULL + UNIQUE y no entra en la PK', () => {
    const cliente = table(`ent CLIENTE
key_att Id -> CLIENTE
key_att Email -> CLIENTE unique`, 'CLIENTE');
    expect(cliente.columns.map(c => [c.name, c.isPrimaryKey, c.isNullable, c.isUnique])).toEqual([
      ['ID', true, false, true],
      ['EMAIL', false, false, true],
    ]);
  });

  it('una clave alternativa compuesta es un UNIQUE de tabla y llega al SQL', () => {
    const code = `ent PERSONA
key_att Dni -> PERSONA
key_att NombreCompleto -> PERSONA unique
att Nombre -> NombreCompleto
att Apellidos -> NombreCompleto`;
    const persona = table(code, 'PERSONA');
    expect(persona.uniqueConstraints).toEqual([['NOMBRE', 'APELLIDOS']]);
    expect(persona.columns.filter(c => c.isUnique && !c.isPrimaryKey)).toEqual([]);
    const { nodes, links } = compileEER(code);
    expect(relationalToSQL(eerToRelational(nodes, links), 'oracle')).toContain('UNIQUE (NOMBRE, APELLIDOS)');
  });

  it('varios `key_att` sin `unique` siguen formando una PK compuesta (v1.7.0)', () => {
    const circuito = table(`ent CIRCUITO
key_att Nombre -> CIRCUITO
key_att Fecha -> CIRCUITO`, 'CIRCUITO');
    expect(circuito.columns.filter(c => c.isPrimaryKey).map(c => c.name)).toEqual(['NOMBRE', 'FECHA']);
  });
});
