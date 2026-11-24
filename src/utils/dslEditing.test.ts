// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { compileEER } from './compiler';
import {
  applyElementEdit,
  describeNodeForEdit,
  getOwnedLineIndices,
  renameReferences,
  replaceElementBlock,
  toDslIdentifier,
  suggestedAttributeOwner,
  attributeOwnerOptions,
  generateElementCode,
  type ElementEdit,
} from './dslEditing';
import { deleteNodesFromCode } from './deleteNode';

const CODE = [
  'ent EMPLEADO (400, 300)', //                  0
  'ent DEPARTAMENTO (700, 300)', //              1
  'key_att Dni -> EMPLEADO (350, 220)', //       2
  'att Nombre -> EMPLEADO (450, 220)', //        3
  'att Nombre -> DEPARTAMENTO (700, 220)', //    4
  'rel TRABAJA_PARA (550, 300)', //              5
  'link EMPLEADO TRABAJA_PARA "N" [total]', //   6
  'link DEPARTAMENTO TRABAJA_PARA "1"', //       7
  'att Horas -> TRABAJA_PARA (550, 380)', //     8
  'spec d -> EMPLEADO (400, 420)', //            9
  'ent INGENIERO (400, 550)', //                 10
  'link d INGENIERO', //                         11
].join('\n');

function compile(code: string) {
  const result = compileEER(code);
  expect(result.isValid).toBe(true);
  return result;
}

function nodeByLabel(code: string, label: string) {
  const { nodes } = compile(code);
  const node = nodes.find(n => n.label === label);
  expect(node, `nodo '${label}'`).toBeDefined();
  return node!;
}

describe('getOwnedLineIndices — líneas del DSL que pertenecen a un nodo', () => {
  it('una relación posee su declaración y sus enlaces con entidades, no los de sus atributos', () => {
    const { nodes, links } = compile(CODE);
    const rel = nodes.find(n => n.label === 'TRABAJA_PARA')!;
    expect(getOwnedLineIndices(rel, nodes, links)).toEqual([5, 6, 7]);
  });

  it('una especialización posee su declaración y sus enlaces con subclases', () => {
    const { nodes, links } = compile(CODE);
    const spec = nodes.find(n => n.type === 'specialization')!;
    expect(getOwnedLineIndices(spec, nodes, links)).toEqual([9, 11]);
  });

  it('una entidad solo posee su declaración', () => {
    const { nodes, links } = compile(CODE);
    expect(getOwnedLineIndices(nodes.find(n => n.label === 'EMPLEADO')!, nodes, links)).toEqual([0]);
  });
});

describe('renameReferences — renombrado por posiciones sintácticas', () => {
  it('renombra extremos de link y el nombre tras ->, sin tocar cardinalidades ni subcadenas', () => {
    const code = [
      'link EMPLEADO TRABAJA "N"',
      'att Nombre -> EMPLEADO (1, 2)',
      'spec d -> EMPLEADO [Tipo] (3, 4)',
      'ent EMPLEADO_TEMPORAL',
      'link EMPLEADO_TEMPORAL TRABAJA "EMPLEADO"',
    ].join('\n');
    expect(renameReferences(code, 'EMPLEADO', 'TRABAJADOR').split('\n')).toEqual([
      'link TRABAJADOR TRABAJA "N"',
      'att Nombre -> TRABAJADOR (1, 2)',
      'spec d -> TRABAJADOR [Tipo] (3, 4)',
      'ent EMPLEADO_TEMPORAL',
      'link EMPLEADO_TEMPORAL TRABAJA "EMPLEADO"',
    ]);
  });

  it('no toca los comentarios', () => {
    expect(renameReferences('// link EMPLEADO X', 'EMPLEADO', 'Y')).toBe('// link EMPLEADO X');
  });
});

describe('replaceElementBlock', () => {
  it('coloca el bloque nuevo en la primera línea propia y elimina el resto', () => {
    expect(replaceElementBlock('a\nb\nc\nd', [1, 3], 'X\nY')).toBe('a\nX\nY\nc');
  });
});

describe('applyElementEdit — edición desde el formulario', () => {
  it('renombrar una entidad actualiza declaración, enlaces, atributos y especializaciones', () => {
    const { nodes, links } = compile(CODE);
    const node = nodes.find(n => n.label === 'EMPLEADO')!;
    const result = applyElementEdit(CODE, node, nodes, links, { kind: 'entity', name: 'TRABAJADOR', isWeak: false });

    expect(result).not.toMatch(/\bEMPLEADO\b/);
    expect(result).toContain('ent TRABAJADOR (400, 300)');
    expect(result).toContain('link TRABAJADOR TRABAJA_PARA "N" [total]');
    expect(result).toContain('key_att Dni -> TRABAJADOR');
    expect(result).toContain('spec d -> TRABAJADOR (400, 420)');
    expect(compileEER(result).isValid).toBe(true);
  });

  it('marca una entidad como débil sin mover sus coordenadas', () => {
    const { nodes, links } = compile(CODE);
    const node = nodes.find(n => n.label === 'DEPARTAMENTO')!;
    const result = applyElementEdit(CODE, node, nodes, links, { kind: 'entity', name: 'DEPARTAMENTO', isWeak: true });
    expect(result.split('\n')[1]).toBe('weak_ent DEPARTAMENTO (700, 300)');
  });

  it('cambia cardinalidades y participación de una relación sin duplicar sus enlaces', () => {
    const { nodes, links } = compile(CODE);
    const rel = nodes.find(n => n.label === 'TRABAJA_PARA')!;
    const result = applyElementEdit(CODE, rel, nodes, links, {
      kind: 'relationship',
      name: 'TRABAJA_EN',
      isIdentifying: false,
      ends: [
        { entity: 'EMPLEADO', cardinality: 'N', isTotal: false },
        { entity: 'DEPARTAMENTO', cardinality: 'M', isTotal: true },
      ],
    });

    const compiled = compile(result);
    const relLinks = compiled.links.filter(l => l.target === 'TRABAJA_EN' || l.source === 'TRABAJA_EN');
    expect(result.match(/^link .*TRABAJA_EN/gm)).toHaveLength(2);
    expect(result).toContain('link DEPARTAMENTO TRABAJA_EN "M" [total]');
    expect(result).toContain('att Horas -> TRABAJA_EN'); // el atributo de la relación sigue colgando de ella
    expect(relLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('renombrar un atributo homónimo no altera el de la otra entidad', () => {
    const { nodes, links } = compile(CODE);
    const nombreEmpleado = nodes.find(n => n.label === 'Nombre' && n.parentEntity === 'EMPLEADO')!;
    const result = applyElementEdit(CODE, nombreEmpleado, nodes, links, {
      kind: 'attribute', name: 'NombreCompleto', attrType: 'simple', owner: 'EMPLEADO',
    });
    expect(result).toContain('att NombreCompleto -> EMPLEADO (450, 220)');
    expect(result).toContain('att Nombre -> DEPARTAMENTO (700, 220)');
  });

  it('añade el atributo definidor a una especialización', () => {
    const { nodes, links } = compile(CODE);
    const spec = nodes.find(n => n.type === 'specialization')!;
    const result = applyElementEdit(CODE, spec, nodes, links, {
      kind: 'specialization', specType: 'd', superclass: 'EMPLEADO', subclasses: ['INGENIERO'], definingAttribute: 'TipoTrabajo', isTotal: true,
    });
    expect(result).toContain('spec d -> EMPLEADO [TipoTrabajo] (400, 420)');
    expect(nodeByLabel(result, 'd').definingAttribute).toBe('TipoTrabajo');
  });

  it('marca una especialización como parcial: escribe `partial` y la arista pasa a simple (§3.11 D)', () => {
    const { nodes, links } = compile(CODE);
    const spec = nodes.find(n => n.type === 'specialization')!;
    const result = applyElementEdit(CODE, spec, nodes, links, {
      ...(describeNodeForEdit(spec, nodes, links) as Extract<ElementEdit, { kind: 'specialization' }>),
      isTotal: false,
    });
    expect(result).toContain('spec d -> EMPLEADO partial (400, 420)');
    const compiled = compile(result);
    expect(compiled.links.find(l => l.source === 'EMPLEADO' && l.target === 'd')?.style).toBe('solid');
    expect(describeNodeForEdit(compiled.nodes.find(n => n.type === 'specialization')!, compiled.nodes, compiled.links))
      .toMatchObject({ isTotal: false });
  });

  it('convierte una relación binaria en ternaria con roles (§3.11 I y E)', () => {
    const { nodes, links } = compile(CODE);
    const rel = nodes.find(n => n.label === 'TRABAJA_PARA')!;
    const result = applyElementEdit(CODE, rel, nodes, links, {
      kind: 'relationship',
      name: 'TRABAJA_PARA',
      isIdentifying: false,
      ends: [
        { entity: 'EMPLEADO', cardinality: 'N', isTotal: true, role: 'Trabajador' },
        { entity: 'DEPARTAMENTO', cardinality: '1', isTotal: false },
        { entity: 'EMPLEADO', cardinality: 'M', isTotal: false, role: 'Jefe' },
      ],
    });

    expect(result).toContain('link EMPLEADO TRABAJA_PARA "N" role:Trabajador [total]');
    expect(result).toContain('link EMPLEADO TRABAJA_PARA "M" role:Jefe');
    const compiled = compile(result);
    const relNode = compiled.nodes.find(n => n.label === 'TRABAJA_PARA')!;
    const description = describeNodeForEdit(relNode, compiled.nodes, compiled.links);
    expect(description).toMatchObject({ kind: 'relationship' });
    expect((description as Extract<ElementEdit, { kind: 'relationship' }>).ends.map(e => `${e.entity}:${e.role ?? ''}`)).toEqual([
      'EMPLEADO:Trabajador',
      'DEPARTAMENTO:',
      'EMPLEADO:Jefe',
    ]);
  });

  it('una clave alternativa y una clave parcial se escriben y se releen (§3.11 L4 y B)', () => {
    const { nodes, links } = compile(CODE);
    const dni = nodes.find(n => n.label === 'Dni')!;
    const result = applyElementEdit(CODE, dni, nodes, links, {
      kind: 'attribute', name: 'Dni', attrType: 'key', owner: 'EMPLEADO', isUnique: true,
    });
    expect(result).toContain('key_att Dni -> EMPLEADO unique (350, 220)');
    const compiled = compile(result);
    expect(compiled.nodes.find(n => n.label === 'Dni')).toMatchObject({ type: 'key_attribute', isUnique: true });

    const partial = applyElementEdit(CODE, dni, nodes, links, {
      kind: 'attribute', name: 'Dni', attrType: 'partial_key', owner: 'EMPLEADO',
    });
    expect(partial).toContain('partial_key_att Dni -> EMPLEADO (350, 220)');
    expect(compile(partial).nodes.find(n => n.label === 'Dni')?.type).toBe('partial_key_attribute');
  });

  it('describir y volver a aplicar sin cambios deja un diagrama equivalente (ida y vuelta)', () => {
    const { nodes, links } = compile(CODE);
    nodes
      .filter(n => ['entity', 'relationship', 'specialization', 'key_attribute'].includes(n.type))
      .forEach(node => {
        const result = applyElementEdit(CODE, node, nodes, links, describeNodeForEdit(node, nodes, links));
        const before = compile(CODE);
        const after = compile(result);
        expect(after.nodes.map(n => `${n.type}:${n.label}:${n.x},${n.y}`).sort())
          .toEqual(before.nodes.map(n => `${n.type}:${n.label}:${n.x},${n.y}`).sort());
        expect(after.links.map(l => `${l.source}>${l.target}:${l.label}:${l.style}`).sort())
          .toEqual(before.links.map(l => `${l.source}>${l.target}:${l.label}:${l.style}`).sort());
      });
  });
});

describe('Atributos compuestos y propietario sugerido desde el formulario', () => {
  const COMPOSITE = `ent CLIENTE (300, 300)
att Direccion -> CLIENTE (400, 200)
att Calle -> Direccion (350, 100)
att Numero (450, 100)
link Direccion Numero
ent PROVEEDOR (700, 300)
att Nombre -> CLIENTE (200, 200)
att Nombre -> PROVEEDOR (700, 200)
rel COMPRA (500, 300)`;

  it('sugiere como propietario la entidad, relación o atributo seleccionado', () => {
    const { nodes } = compile(COMPOSITE);
    const byLabel = (label: string) => nodes.find(n => n.label === label);
    expect(suggestedAttributeOwner(byLabel('CLIENTE'), nodes)).toBe('CLIENTE');
    expect(suggestedAttributeOwner(byLabel('COMPRA'), nodes)).toBe('COMPRA');
    expect(suggestedAttributeOwner(byLabel('Direccion'), nodes)).toBe('Direccion');
    expect(suggestedAttributeOwner(byLabel('Nombre'), nodes)).toBeUndefined(); // nombre repetido: ambiguo
    expect(suggestedAttributeOwner(undefined, nodes)).toBeUndefined();
  });

  it('ofrece los atributos como propietarios, con su dueño y marcando los ambiguos', () => {
    const { nodes, links } = compile(COMPOSITE);
    const options = attributeOwnerOptions(nodes, links);
    expect(options.find(o => o.label === 'Direccion')).toMatchObject({ label: 'Direccion', ownerLabel: 'CLIENTE', ambiguous: false });
    expect(options.find(o => o.label === 'Calle')).toMatchObject({ ownerLabel: 'Direccion' });
    expect(options.find(o => o.label === 'Numero')).toMatchObject({ ownerLabel: 'Direccion' }); // colgado con `link`
    expect(options.filter(o => o.label === 'Nombre').every(o => o.ambiguous)).toBe(true);
    // El atributo en edición no puede colgar de sí mismo.
    const direccion = nodes.find(n => n.label === 'Direccion')!;
    expect(attributeOwnerOptions(nodes, links, direccion.id).some(o => o.label === 'Direccion')).toBe(false);
  });

  it('crear un componente desde el formulario lo cuelga del compuesto (y el relacional lo expande)', () => {
    const { nodes, links } = compile(COMPOSITE);
    const component = generateElementCode({ kind: 'attribute', name: 'Piso', attrType: 'simple', owner: 'Direccion' }, 500, 100);
    expect(component).toBe('att Piso -> Direccion (500, 100)');
    const result = compile(`${COMPOSITE}\n${component}`);
    const direccion = result.nodes.find(n => n.label === 'Direccion')!;
    expect(result.nodes.find(n => n.label === 'Piso')?.parentEntity).toBe(direccion.id);
    expect(describeNodeForEdit(nodes.find(n => n.label === 'Numero')!, nodes, links)).toMatchObject({ owner: 'Direccion' });
  });
});

describe('describeNodeForEdit', () => {
  it('lee entidades, cardinalidades y participación de una relación binaria', () => {
    const { nodes, links } = compile(CODE);
    const rel = nodes.find(n => n.label === 'TRABAJA_PARA')!;
    expect(describeNodeForEdit(rel, nodes, links)).toEqual({
      kind: 'relationship',
      name: 'TRABAJA_PARA',
      isIdentifying: false,
      ends: [
        { entity: 'EMPLEADO', cardinality: 'N', isTotal: true },
        { entity: 'DEPARTAMENTO', cardinality: '1', isTotal: false },
      ],
    });
  });

  it('lee el propietario de un atributo de relación', () => {
    const { nodes, links } = compile(CODE);
    const horas = nodes.find(n => n.label === 'Horas')!;
    expect(describeNodeForEdit(horas, nodes, links)).toMatchObject({ kind: 'attribute', owner: 'TRABAJA_PARA' });
  });
});

describe('deleteNodesFromCode — borrado múltiple', () => {
  it('borrar un atributo homónimo solo elimina el suyo', () => {
    const { nodes } = compile(CODE);
    const target = nodes.find(n => n.label === 'Nombre' && n.parentEntity === 'DEPARTAMENTO')!;
    const result = deleteNodesFromCode(CODE, [target], nodes);
    expect(result).toContain('att Nombre -> EMPLEADO');
    expect(result).not.toContain('att Nombre -> DEPARTAMENTO');
  });

  it('borra varios nodos y sus referencias de una vez', () => {
    const { nodes } = compile(CODE);
    const targets = nodes.filter(n => ['DEPARTAMENTO', 'INGENIERO'].includes(n.label));
    const result = deleteNodesFromCode(CODE, targets, nodes);
    expect(result).not.toMatch(/\bDEPARTAMENTO\b|\bINGENIERO\b/);
    expect(compileEER(result).isValid).toBe(true);
  });

  it('borra una clave parcial (partial_key_att)', () => {
    const code = 'weak_ent DEPENDIENTE\npartial_key_att NombreDep -> DEPENDIENTE (100, 220)';
    const { nodes } = compileEER(code);
    const target = nodes.find(n => n.label === 'NombreDep')!;
    expect(deleteNodesFromCode(code, [target], nodes)).not.toContain('NombreDep');
  });

  it('borrar un compuesto homónimo se lleva sus componentes, no los pasa al otro', () => {
    const code = [
      'ent CLIENTE',
      'ent PROVEEDOR',
      'att Direccion -> CLIENTE',
      'att Calle -> Direccion',
      'att Direccion -> PROVEEDOR',
      'att Numero -> Direccion',
    ].join('\n');
    const { nodes } = compileEER(code);
    const clienteDir = nodes.find(n => n.label === 'Direccion' && n.parentEntity === 'CLIENTE')!;
    const result = deleteNodesFromCode(code, [clienteDir], nodes);
    expect(result).not.toContain('att Direccion -> CLIENTE');
    expect(result).not.toContain('att Calle -> Direccion');
    expect(result).toContain('att Direccion -> PROVEEDOR');
    expect(result).toContain('att Numero -> Direccion');
  });
});

describe('toDslIdentifier', () => {
  it('convierte espacios en guiones bajos para no romper la línea del DSL', () => {
    expect(toDslIdentifier('  Fecha de alta ')).toBe('Fecha_de_alta');
  });

  it('neutraliza caracteres con significado en el DSL y conserva las tildes', () => {
    expect(toDslIdentifier('A->B "x" (1, 2)')).toBe('A__B__x___1__2_');
    expect(toDslIdentifier('Categoría')).toBe('Categoría');
  });
});
