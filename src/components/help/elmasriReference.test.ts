// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { ELMASRI_REFERENCE } from './elmasriReference';
import { compileEER } from '../../utils/compiler';
import { eerToRelational } from '../../utils/relational/eerToRelational';
import { generateRelationalDSL } from '../../utils/relational/relationalCodeGenerator';
import { compileRelationalDSL } from '../../utils/relational/relationalCompiler';
import { relationalToSQL } from '../../utils/relational/relationalToSQL';

/*
 * Repaso de la notación de Elmasri (§3.11 J): el diagrama de referencia recorre todas las
 * construcciones de la notación de punta a punta. Si algo no se puede expresar, dibujar o mapear,
 * este test lo dice antes que un alumno.
 */

const compiled = compileEER(ELMASRI_REFERENCE);
const schema = eerToRelational(compiled.nodes, compiled.links);
const table = (name: string) => schema.tables.find(t => t.name === name)!;
const node = (label: string) => compiled.nodes.find(n => n.label === label)!;
const linkBetween = (a: string, b: string) =>
  compiled.links.filter(l => (l.source === node(a).id && l.target === node(b).id) || (l.source === node(b).id && l.target === node(a).id));

describe('Diagrama de referencia de Elmasri (§3.11 J)', () => {
  it('compila sin errores ni avisos', () => {
    expect(compiled.diagnostics).toEqual([]);
  });

  it('contiene todos los tipos de nodo de la notación', () => {
    expect(new Set(compiled.nodes.map(n => n.type))).toEqual(
      new Set([
        'entity',
        'weak_entity',
        'relationship',
        'identifying_relationship',
        'attribute',
        'key_attribute',
        'partial_key_attribute',
        'derived_attribute',
        'multivalued_attribute',
        'specialization',
        'union',
      ])
    );
  });

  it('dibuja cada construcción con su estilo', () => {
    expect(linkBetween('EMPLEADO', 'd')[0]?.style).toBe('double'); // especialización total
    expect(linkBetween('EMPLEADO', 'o')[0]?.style).toBe('solid'); // especialización parcial
    expect(linkBetween('EMPLEADO', 'SUPERVISA').map(l => l.role)).toEqual(['Supervisor', 'Supervisado']);
    expect(linkBetween('NombreCompleto', 'Nombre')).toHaveLength(1); // compuesto → componente
    expect(node('Email').isUnique).toBe(true);
    expect(compiled.links.filter(l => l.target === 'SUMINISTRA' || l.source === 'SUMINISTRA')).toHaveLength(4); // 3 entidades + atributo
  });

  it('el modelo relacional no tiene columnas ni restricciones repetidas en ninguna tabla', () => {
    schema.tables.forEach(t => {
      const columns = t.columns.map(c => c.name);
      const constraints = t.foreignKeys.map(f => f.constraintName);
      expect(new Set(columns).size, `columnas de ${t.name}`).toBe(columns.length);
      expect(new Set(constraints).size, `restricciones de ${t.name}`).toBe(constraints.length);
    });
  });

  it('mapea cada construcción según Elmasri', () => {
    const pk = (name: string) => table(name).columns.filter(c => c.isPrimaryKey).map(c => c.name);
    expect(table('EMPLEADO').columns.map(c => c.name)).toEqual(expect.arrayContaining(['DNI', 'EMAIL', 'NOMBRE', 'APELLIDOS']));
    expect(table('EMPLEADO').columns.map(c => c.name)).not.toContain('NOMBRECOMPLETO');
    expect(pk('DEPENDIENTE')).toEqual(['EMPLEADO_DNI', 'NOMBREDEP']);
    expect(pk('VUELO')).toEqual(['NUMVUELO', 'FECHAVUELO']);
    expect(table('SUPERVISA')).toBeUndefined(); // 1:N recursiva: FK en EMPLEADO
    expect(table('EMPLEADO').columns.map(c => c.name)).toContain('SUPERVISOR_DNI');
    expect(table('SUMINISTRA').foreignKeys).toHaveLength(3);
    expect(table('VIAJA').foreignKeys.find(f => f.targetTableName === 'VUELO')?.sourceColumnNames).toEqual([
      'VUELO_NUMVUELO',
      'VUELO_FECHAVUELO',
    ]);
  });

  it('la ida y vuelta por el DSL relacional no da errores ni avisos', () => {
    const back = compileRelationalDSL(generateRelationalDSL(schema));
    expect(back.diagnostics).toEqual([]);
  });

  it('el SQL de Oracle incluye la clave alternativa, el UNIQUE de la 1:1 y la FK compuesta', () => {
    const sql = relationalToSQL(schema, 'oracle');
    expect(sql).toContain('UNIQUE (EMAIL)');
    expect(sql).toMatch(/UNIQUE \(DIRIGE_EMPLEADO_DNI\)/);
    expect(sql).toContain('FOREIGN KEY (VUELO_NUMVUELO, VUELO_FECHAVUELO) REFERENCES VUELO (NUMVUELO, FECHAVUELO)');
  });
});
