// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, expect, it } from 'vitest';
import HOTEL_EXAMPLE from '../../ejemplos/202511ER_Hotel.eer?raw';
import { SAMPLE_CODE } from '../constants';
import { EER_SYNTAX } from '../components/help/syntaxExamples';
import { compileEER } from '../utils/compiler';
import { eerToRelational } from '../utils/relational/eerToRelational';
import { generateRelationalDSL } from '../utils/relational/relationalCodeGenerator';
import { relationalToSQL } from '../utils/relational/relationalToSQL';

/*
 * Red de seguridad de compatibilidad con la v1.7.0 (SPECIFICATIONS §3.11 A).
 *
 * Las instantáneas se generaron con el código de la v1.7.0, antes de cualquier cambio de la
 * v1.8.0. Un diagrama existente debe compilar igual y producir el mismo modelo relacional y el
 * mismo SQL. Si una instantánea cambia, el diff debe corresponder a una corrección listada en
 * `implementation_plan.md` (y entonces se actualiza con `vitest -u` de forma consciente).
 * La posición de las tablas (autolayout) y la fecha del SQL se excluyen: no son semántica.
 */

// Ejemplos EER de la ayuda tal como eran en la v1.7.0 (fijados aquí: la ayuda crece con cada versión).
const HELP_EXAMPLES = [
  'ent EMPLEADO (100, 150)',
  'weak_ent DEPENDIENTE',
  'rel TRABAJA_EN',
  'ident_rel TIENE_DEP',
  'att Nombre -> EMPLEADO',
  'key_att DNI -> EMPLEADO',
  'derived_att Edad -> EMPLEADO',
  'multivalued_att Telefono -> EMPLEADO',
  'key_att Vuelta -> CIRCULA',
  'link EMPLEADO TRABAJA_EN "N"',
  'link DEPARTAMENTO TRABAJA_EN "1" [total]',
  'spec d -> EMPLEADO',
  'spec d -> EMPLEADO [TipoTrabajo]',
  'link d INGENIERO',
  'union u',
  'link PERSONA u',
  'link u PROPIETARIO',
].join('\n');

it('los ejemplos de la v1.7.0 siguen en la ayuda', () => {
  const current = EER_SYNTAX.flatMap(section => section.examples.map(e => e.code));
  expect(HELP_EXAMPLES.split('\n').filter(code => !current.includes(code))).toEqual([]);
});

const FIXTURES: Record<string, string> = {
  sampleCode: SAMPLE_CODE,
  helpExamples: HELP_EXAMPLES,
  hotelTemplate: HOTEL_EXAMPLE,
};

function describeModel(code: string) {
  const compiled = compileEER(code);
  const schema = eerToRelational(compiled.nodes, compiled.links);

  return {
    isValid: compiled.isValid,
    diagnostics: compiled.diagnostics.map(d => `${d.line}:${d.severity}:${d.code}`),
    nodes: compiled.nodes.map(n => [n.id, n.type, n.label, n.parentEntity ?? '', n.definingAttribute ?? ''].join(' | ')),
    links: compiled.links.map(l => [l.source, l.target, l.label ?? '', l.style ?? ''].join(' | ')),
    tables: schema.tables.map(t => ({
      name: t.name,
      columns: t.columns.map(c =>
        [c.name, c.dataType, c.isPrimaryKey ? 'PK' : '', c.isForeignKey ? 'FK' : '', c.isNullable ? 'NULL' : 'NOT NULL', c.isUnique ? 'UNIQUE' : '']
          .filter(Boolean)
          .join(' '),
      ),
      foreignKeys: t.foreignKeys.map(
        f => `${f.constraintName} (${f.sourceColumnNames.join(', ')}) -> ${f.targetTableName}(${f.targetColumnNames.join(', ')}) ${f.onDelete}`,
      ),
    })),
    relationalDSL: generateRelationalDSL(schema).replace(/\s*\[x:\s*-?\d+,\s*y:\s*-?\d+\]/g, ''),
    sql: relationalToSQL(schema, 'oracle').replace(/^.*(Fecha de Generación|Generated on).*$/gm, '<fecha>'),
  };
}

describe('Compatibilidad con la v1.7.0 (§3.11 A)', () => {
  it.each(Object.entries(FIXTURES))('%s produce el mismo modelo', (_name, code) => {
    expect(describeModel(code)).toMatchSnapshot();
  });
});
