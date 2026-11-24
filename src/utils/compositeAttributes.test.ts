// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { compileEER } from './compiler';
import { eerToRelational } from './relational/eerToRelational';

/*
 * Atributos compuestos (SPECIFICATIONS §3.11 C). Hasta la v1.7.0 el compilador guardaba en el
 * enlace la ETIQUETA del compuesto (`Direccion`), pero los atributos tienen id con sufijo
 * (`Direccion_2`) y tanto el dibujo (`LinkRenderer`) como el motor relacional buscan por id:
 * la línea no se dibujaba y el compuesto se mapeaba como una sola columna.
 */

const CLIENTE = `ent CLIENTE
key_att DNI -> CLIENTE
att Direccion -> CLIENTE
att Calle -> Direccion
att Numero -> Direccion`;

const columnsOf = (code: string, table: string) => {
  const { nodes, links } = compileEER(code);
  return eerToRelational(nodes, links).tables.find(t => t.name === table)?.columns.map(c => c.name);
};

describe('Atributos compuestos (§3.11 C)', () => {
  it('los extremos de enlace y parentEntity apuntan al id real del compuesto', () => {
    const { nodes, links, diagnostics } = compileEER(CLIENTE);
    const ids = new Set(nodes.map(n => n.id));
    const direccion = nodes.find(n => n.label === 'Direccion')!;

    expect(links.every(l => ids.has(l.source) && ids.has(l.target))).toBe(true);
    expect(links.filter(l => l.source === direccion.id).map(l => l.target)).toHaveLength(2);
    expect(nodes.find(n => n.label === 'Calle')?.parentEntity).toBe(direccion.id);
    expect(diagnostics).toHaveLength(0);
  });

  it('el compuesto se sustituye por sus componentes en la tabla (Elmasri, Paso 1)', () => {
    expect(columnsOf(CLIENTE, 'CLIENTE')).toEqual(['DNI', 'CALLE', 'NUMERO']);
  });

  it('también con `link COMPUESTO COMPONENTE`', () => {
    const code = `ent CLIENTE
key_att DNI -> CLIENTE
att Direccion -> CLIENTE
att Calle
link Direccion Calle`;
    expect(columnsOf(code, 'CLIENTE')).toEqual(['DNI', 'CALLE']);
  });

  it('compuesto dentro de compuesto se expande hasta las hojas', () => {
    const code = `${CLIENTE}
att Piso -> Numero
att Letra -> Numero`;
    expect(columnsOf(code, 'CLIENTE')).toEqual(['DNI', 'CALLE', 'PISO', 'LETRA']);
  });

  it('una clave compuesta (key_att con componentes) forma la PK con sus componentes', () => {
    const code = `ent CIRCUITO
key_att Clave -> CIRCUITO
att Nombre -> Clave
att Fecha -> Clave`;
    const { nodes, links } = compileEER(code);
    const table = eerToRelational(nodes, links).tables.find(t => t.name === 'CIRCUITO')!;
    expect(table.columns.filter(c => c.isPrimaryKey).map(c => c.name)).toEqual(['NOMBRE', 'FECHA']);
  });

  it('una etiqueta de atributo ambigua se resuelve al último declarado antes y avisa', () => {
    const code = `ent CLIENTE
att Direccion -> CLIENTE
ent PROVEEDOR
att Direccion -> PROVEEDOR
att Calle -> Direccion`;
    const { nodes, diagnostics } = compileEER(code);
    const segunda = nodes.filter(n => n.label === 'Direccion')[1]!;

    expect(nodes.find(n => n.label === 'Calle')?.parentEntity).toBe(segunda.id);
    expect(diagnostics.map(d => d.code)).toEqual(['AMBIGUOUS_ATTRIBUTE_REFERENCE']);
    expect(diagnostics[0]?.severity).toBe('warning');
  });

  it('las referencias a entidades y especializaciones no cambian (primero por id, luego por etiqueta)', () => {
    const code = `ent EMPLEADO
spec d -> EMPLEADO
ent INGENIERO
link d INGENIERO`;
    const { links } = compileEER(code);
    expect(links.map(l => `${l.source}>${l.target}`)).toEqual(['EMPLEADO>d', 'd>INGENIERO']);
  });
});
