// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { eerToRelational } from './eerToRelational';
import type { NodeData, LinkData } from '../../types';
import { compileEER } from '../compiler';
import { generateRelationalDSL } from './relationalCodeGenerator';
import { compileRelationalDSL } from './relationalCompiler';

function node(partial: Partial<NodeData> & Pick<NodeData, 'id' | 'type' | 'label'>): NodeData {
  return { x: 0, y: 0, lineIndex: 0, ...partial };
}

function findTable(schema: ReturnType<typeof eerToRelational>, name: string) {
  const table = schema.tables.find(t => t.name === name);
  expect(table, `tabla '${name}' debería existir`).toBeDefined();
  return table!;
}

describe('eerToRelational — Paso 1: Entidades Fuertes', () => {
  it('crea una tabla con la clave primaria del atributo clave y las columnas de los atributos simples', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Cliente' }),
      node({ id: 'a1', type: 'key_attribute', label: 'id_cliente' }),
      node({ id: 'a2', type: 'attribute', label: 'nombre' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'a1' },
      { source: 'e1', target: 'a2' },
    ];

    const schema = eerToRelational(nodes, links);

    expect(schema.tables).toHaveLength(1);
    const cliente = findTable(schema, 'CLIENTE');
    const pk = cliente.columns.find(c => c.name === 'ID_CLIENTE');
    const attr = cliente.columns.find(c => c.name === 'NOMBRE');
    expect(pk?.isPrimaryKey).toBe(true);
    expect(attr?.isPrimaryKey).toBe(false);
  });

  it('genera una PK artificial si la entidad no declara ningún atributo clave', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Log' }),
      node({ id: 'a1', type: 'attribute', label: 'mensaje' }),
    ];
    const links: LinkData[] = [{ source: 'e1', target: 'a1' }];

    const schema = eerToRelational(nodes, links);

    const log = findTable(schema, 'LOG');
    expect(log.columns[0]!.name).toBe('ID_LOG');
    expect(log.columns[0]!.isPrimaryKey).toBe(true);
  });
});

describe('eerToRelational — Paso 2: Entidades Débiles', () => {
  it('propaga la PK del propietario como FK y la combina con la clave parcial', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Pedido' }),
      node({ id: 'a1', type: 'key_attribute', label: 'id_pedido' }),
      node({ id: 'we1', type: 'weak_entity', label: 'Linea_Pedido' }),
      node({ id: 'a2', type: 'key_attribute', label: 'numero_linea' }),
      node({ id: 'r1', type: 'identifying_relationship', label: 'contiene' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'a1' },
      { source: 'we1', target: 'a2' },
      { source: 'we1', target: 'r1' },
      { source: 'r1', target: 'e1' },
    ];

    const schema = eerToRelational(nodes, links);

    const linea = findTable(schema, 'LINEA_PEDIDO');
    const fkCol = linea.columns.find(c => c.name === 'PEDIDO_ID_PEDIDO');
    const partialKey = linea.columns.find(c => c.name === 'NUMERO_LINEA');

    expect(fkCol?.isPrimaryKey).toBe(true);
    expect(fkCol?.isForeignKey).toBe(true);
    expect(partialKey?.isPrimaryKey).toBe(true);
    expect(linea.foreignKeys).toHaveLength(1);
    expect(linea.foreignKeys[0]!.targetTableName).toBe('PEDIDO');
    expect(linea.foreignKeys[0]!.onDelete).toBe('CASCADE');
  });

  it('no crea una tabla puente espuria para la relación identificativa (ya consumida por el Paso 2)', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Pedido' }),
      node({ id: 'a1', type: 'key_attribute', label: 'id_pedido' }),
      node({ id: 'we1', type: 'weak_entity', label: 'Linea_Pedido' }),
      node({ id: 'a2', type: 'key_attribute', label: 'numero_linea' }),
      node({ id: 'r1', type: 'identifying_relationship', label: 'contiene' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'a1' },
      { source: 'we1', target: 'a2' },
      { source: 'we1', target: 'r1' },
      { source: 'r1', target: 'e1' },
    ];

    const schema = eerToRelational(nodes, links);

    // Solo PEDIDO y LINEA_PEDIDO: la relación identificativa no genera tabla propia.
    expect(schema.tables.map(t => t.name).sort()).toEqual(['LINEA_PEDIDO', 'PEDIDO']);
  });

  it('no duplica la FK del propietario cuando la relación identificativa lleva cardinalidad 1:N', () => {
    // Reproduce el caso real del ejemplo por defecto (EMPLEADO / TIENE_DEP / DEPENDIENTE):
    // con cardinalidades declaradas, el bucle genérico de relaciones reprocesaba la
    // relación identificativa como un 1:N normal (Paso 4) y propagaba la FK por segunda vez.
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Empleado' }),
      node({ id: 'a1', type: 'key_attribute', label: 'dni' }),
      node({ id: 'we1', type: 'weak_entity', label: 'Dependiente' }),
      node({ id: 'a2', type: 'key_attribute', label: 'nombre_dep' }),
      node({ id: 'r1', type: 'identifying_relationship', label: 'tiene_dep' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'a1' },
      { source: 'we1', target: 'a2' },
      { source: 'e1', target: 'r1', label: '1' },
      { source: 'we1', target: 'r1', label: 'N', style: 'double' },
    ];

    const schema = eerToRelational(nodes, links);

    const dependiente = findTable(schema, 'DEPENDIENTE');
    const fkCols = dependiente.columns.filter(c => c.name === 'EMPLEADO_DNI');

    expect(fkCols).toHaveLength(1);
    expect(dependiente.foreignKeys).toHaveLength(1);
    // Los ids deben ser únicos (se usan como `key` de React en RelationalViewer).
    const colIds = dependiente.columns.map(c => c.id);
    expect(new Set(colIds).size).toBe(colIds.length);
  });

  it('entidad débil sin atributos propios: la PK queda formada solo por la FK del propietario', () => {
    // Caso degenerado admitido por el editor: sin clave parcial, la regla formal del Paso 2
    // no puede completarse (PK = FK propietario + clave parcial), así que la PK resultante
    // es únicamente la FK del propietario. Se documenta el comportamiento real del motor.
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Empleado' }),
      node({ id: 'a1', type: 'key_attribute', label: 'dni' }),
      node({ id: 'we1', type: 'weak_entity', label: 'Dependiente' }),
      node({ id: 'r1', type: 'identifying_relationship', label: 'tiene_dep' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'a1' },
      { source: 'e1', target: 'r1', label: '1' },
      { source: 'we1', target: 'r1', label: 'N', style: 'double' },
    ];

    const schema = eerToRelational(nodes, links);

    const dependiente = findTable(schema, 'DEPENDIENTE');
    expect(dependiente.columns).toHaveLength(1);
    expect(dependiente.columns[0]!.name).toBe('EMPLEADO_DNI');
    expect(dependiente.columns[0]!.isPrimaryKey).toBe(true);
    expect(dependiente.columns[0]!.isForeignKey).toBe(true);
    expect(dependiente.foreignKeys).toHaveLength(1);
  });
});

describe('eerToRelational — Idempotencia y filtrado de atributos', () => {
  it('no emite dos restricciones FK con el mismo nombre si dos nodos spec alcanzan la misma subclase', () => {
    // Dos especializaciones sobre la misma superclase que comparten subclase: sin el
    // `addForeignKey` idempotente se emitían dos CONSTRAINT homónimos y el DDL de Oracle
    // no compilaba.
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Empleado' }),
      node({ id: 'k1', type: 'key_attribute', label: 'dni' }),
      node({ id: 'e2', type: 'entity', label: 'Ingeniero' }),
      node({ id: 's1', type: 'specialization', label: 'd' }),
      node({ id: 's2', type: 'specialization', label: 'd2' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e1', target: 's1' },
      { source: 's1', target: 'e2' },
      { source: 'e1', target: 's2' },
      { source: 's2', target: 'e2' },
    ];

    const schema = eerToRelational(nodes, links);

    const ingeniero = findTable(schema, 'INGENIERO');
    const names = ingeniero.foreignKeys.map(fk => fk.constraintName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('ignora atributos derivados y multivaluados también cuando cuelgan de una relación', () => {
    // Los Pasos 1 y 2 ya los descartaban; los Pasos 4/5/7 no, así que un atributo
    // derivado sobre una relación se materializaba como columna real.
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Alumno' }),
      node({ id: 'k1', type: 'key_attribute', label: 'expediente' }),
      node({ id: 'e2', type: 'entity', label: 'Curso' }),
      node({ id: 'k2', type: 'key_attribute', label: 'codigo' }),
      node({ id: 'r1', type: 'relationship', label: 'matricula' }),
      node({ id: 'a1', type: 'attribute', label: 'nota' }),
      node({ id: 'a2', type: 'derived_attribute', label: 'apto' }),
      node({ id: 'a3', type: 'multivalued_attribute', label: 'tutoria' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e2', target: 'k2' },
      { source: 'e1', target: 'r1', label: 'N' },
      { source: 'e2', target: 'r1', label: 'M' },
      { source: 'r1', target: 'a1' },
      { source: 'r1', target: 'a2' },
      { source: 'r1', target: 'a3' },
    ];

    const schema = eerToRelational(nodes, links);

    const matricula = findTable(schema, 'MATRICULA');
    const colNames = matricula.columns.map(c => c.name);
    expect(colNames).toContain('NOTA');
    expect(colNames).not.toContain('APTO');
    expect(colNames).not.toContain('TUTORIA');
  });
});

describe('eerToRelational — Relaciones Binarias (Pasos 3, 4 y 5)', () => {
  it('Paso 3 (1:1): propaga la PK del lado no-total como FK UNIQUE en el lado total', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Persona' }),
      node({ id: 'k1', type: 'key_attribute', label: 'dni' }),
      node({ id: 'e2', type: 'entity', label: 'Pasaporte' }),
      node({ id: 'k2', type: 'key_attribute', label: 'numero' }),
      node({ id: 'r1', type: 'relationship', label: 'posee' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e2', target: 'k2' },
      { source: 'e1', target: 'r1', label: '1', style: 'double' },
      { source: 'r1', target: 'e2', label: '0..1' },
    ];

    const schema = eerToRelational(nodes, links);

    const persona = findTable(schema, 'PERSONA');
    const fk = persona.columns.find(c => c.isForeignKey);
    expect(fk?.isUnique).toBe(true);
    expect(persona.foreignKeys[0]!.targetTableName).toBe('PASAPORTE');
  });

  it('Paso 4 (1:N): propaga la PK del lado 1 como FK en el lado N', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Departamento' }),
      node({ id: 'k1', type: 'key_attribute', label: 'id_departamento' }),
      node({ id: 'e2', type: 'entity', label: 'Empleado' }),
      node({ id: 'k2', type: 'key_attribute', label: 'id_empleado' }),
      node({ id: 'r1', type: 'relationship', label: 'trabaja_en' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e2', target: 'k2' },
      { source: 'e1', target: 'r1', label: '1' },
      { source: 'r1', target: 'e2', label: 'N' },
    ];

    const schema = eerToRelational(nodes, links);

    const empleado = findTable(schema, 'EMPLEADO');
    const fk = empleado.columns.find(c => c.name === 'DEPARTAMENTO_ID_DEPARTAMENTO');
    expect(fk?.isForeignKey).toBe(true);
    expect(fk?.isPrimaryKey).toBe(false);
    expect(empleado.foreignKeys[0]!.targetTableName).toBe('DEPARTAMENTO');

    const departamento = findTable(schema, 'DEPARTAMENTO');
    expect(departamento.foreignKeys).toHaveLength(0);
  });

  it('Paso 5 (M:N): crea tabla puente con PK compuesta de las FKs de ambas entidades', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Estudiante' }),
      node({ id: 'k1', type: 'key_attribute', label: 'id_estudiante' }),
      node({ id: 'e2', type: 'entity', label: 'Curso' }),
      node({ id: 'k2', type: 'key_attribute', label: 'id_curso' }),
      node({ id: 'r1', type: 'relationship', label: 'matricula' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e2', target: 'k2' },
      { source: 'e1', target: 'r1', label: 'N' },
      { source: 'r1', target: 'e2', label: 'M' },
    ];

    const schema = eerToRelational(nodes, links);

    expect(schema.tables).toHaveLength(3);
    const bridge = findTable(schema, 'MATRICULA');
    expect(bridge.columns.every(c => c.isPrimaryKey && c.isForeignKey)).toBe(true);
    expect(bridge.foreignKeys).toHaveLength(2);
    const targets = bridge.foreignKeys.map(fk => fk.targetTableName).sort();
    expect(targets).toEqual(['CURSO', 'ESTUDIANTE']);
  });
});

describe('eerToRelational — Paso 7: Relaciones N-arias (n > 2)', () => {
  it('crea una tabla de relación con PK compuesta por las FKs de las entidades sin cardinalidad 1', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Proveedor' }),
      node({ id: 'k1', type: 'key_attribute', label: 'id_proveedor' }),
      node({ id: 'e2', type: 'entity', label: 'Pieza' }),
      node({ id: 'k2', type: 'key_attribute', label: 'id_pieza' }),
      node({ id: 'e3', type: 'entity', label: 'Proyecto' }),
      node({ id: 'k3', type: 'key_attribute', label: 'id_proyecto' }),
      node({ id: 'r1', type: 'relationship', label: 'suministra' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e2', target: 'k2' },
      { source: 'e3', target: 'k3' },
      { source: 'e1', target: 'r1', label: 'N' },
      { source: 'r1', target: 'e2', label: 'N' },
      { source: 'r1', target: 'e3', label: 'N' },
    ];

    const schema = eerToRelational(nodes, links);

    const bridge = findTable(schema, 'SUMINISTRA');
    expect(bridge.foreignKeys).toHaveLength(3);
    expect(bridge.columns.every(c => c.isPrimaryKey && c.isForeignKey)).toBe(true);
    const targets = bridge.foreignKeys.map(fk => fk.targetTableName).sort();
    expect(targets).toEqual(['PIEZA', 'PROVEEDOR', 'PROYECTO']);
  });

  it('excluye de la PK la FK de la entidad con restricción de cardinalidad 1', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Proveedor' }),
      node({ id: 'k1', type: 'key_attribute', label: 'id_proveedor' }),
      node({ id: 'e2', type: 'entity', label: 'Pieza' }),
      node({ id: 'k2', type: 'key_attribute', label: 'id_pieza' }),
      node({ id: 'e3', type: 'entity', label: 'Proyecto' }),
      node({ id: 'k3', type: 'key_attribute', label: 'id_proyecto' }),
      node({ id: 'r1', type: 'relationship', label: 'suministra' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e2', target: 'k2' },
      { source: 'e3', target: 'k3' },
      { source: 'e1', target: 'r1', label: 'N' },
      { source: 'r1', target: 'e2', label: 'N' },
      { source: 'r1', target: 'e3', label: '1' },
    ];

    const schema = eerToRelational(nodes, links);

    const bridge = findTable(schema, 'SUMINISTRA');
    const fkProyecto = bridge.columns.find(c => c.name === 'PROYECTO_ID_PROYECTO');
    const fkProveedor = bridge.columns.find(c => c.name === 'PROVEEDOR_ID_PROVEEDOR');

    expect(fkProyecto?.isPrimaryKey).toBe(false);
    expect(fkProyecto?.isForeignKey).toBe(true);
    expect(fkProveedor?.isPrimaryKey).toBe(true);
  });
});

describe('eerToRelational — Paso 6: Atributos Multivalorados', () => {
  it('crea una tabla independiente con FK al propietario y el valor como parte de la PK', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Empleado' }),
      node({ id: 'k1', type: 'key_attribute', label: 'id_empleado' }),
      node({ id: 'a1', type: 'multivalued_attribute', label: 'telefono' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e1', target: 'a1' },
    ];

    const schema = eerToRelational(nodes, links);

    const telefonos = findTable(schema, 'EMPLEADO_TELEFONO');
    expect(telefonos.columns.every(c => c.isPrimaryKey)).toBe(true);
    expect(telefonos.foreignKeys[0]!.targetTableName).toBe('EMPLEADO');
    expect(telefonos.foreignKeys[0]!.onDelete).toBe('CASCADE');
  });
});

describe('eerToRelational — Paso 8: Especialización/Generalización (Opción 8A)', () => {
  it('propaga la PK de la superclase como PK/FK en cada subclase', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Vehiculo' }),
      node({ id: 'k1', type: 'key_attribute', label: 'matricula' }),
      node({ id: 'e2', type: 'entity', label: 'Coche' }),
      node({ id: 's1', type: 'specialization', label: 'd' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e1', target: 's1' },
      { source: 's1', target: 'e2' },
    ];

    const schema = eerToRelational(nodes, links);

    const coche = findTable(schema, 'COCHE');
    const inheritedPk = coche.columns.find(c => c.name === 'MATRICULA');
    expect(inheritedPk?.isPrimaryKey).toBe(true);
    expect(inheritedPk?.isForeignKey).toBe(true);
    expect(coche.foreignKeys[0]!.targetTableName).toBe('VEHICULO');
  });

  it('retira la PK sintética de la subclase al heredar la PK de la superclase y propaga la PK heredada a relaciones', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Empleado' }),
      node({ id: 'k1', type: 'key_attribute', label: 'dni' }),
      node({ id: 'e2', type: 'entity', label: 'Ingeniero' }),
      node({ id: 's1', type: 'specialization', label: 'd' }),
      node({ id: 'e3', type: 'entity', label: 'Proyecto' }),
      node({ id: 'k3', type: 'key_attribute', label: 'id_proyecto' }),
      node({ id: 'r1', type: 'relationship', label: 'supervisa' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e1', target: 's1' },
      { source: 's1', target: 'e2' },
      { source: 'e3', target: 'k3' },
      { source: 'e2', target: 'r1', label: '1' },
      { source: 'r1', target: 'e3', label: 'N' },
    ];

    const schema = eerToRelational(nodes, links);

    const ingeniero = findTable(schema, 'INGENIERO');
    const pkNames = ingeniero.columns.filter(c => c.isPrimaryKey).map(c => c.name);
    expect(pkNames).toEqual(['DNI']);
    expect(ingeniero.columns.find(c => c.name === 'ID_INGENIERO')).toBeUndefined();

    const proyecto = findTable(schema, 'PROYECTO');
    const fkCol = proyecto.columns.find(c => c.name === 'INGENIERO_DNI');
    expect(fkCol?.isForeignKey).toBe(true);
    expect(proyecto.foreignKeys[0]!.targetColumnNames).toEqual(['DNI']);
  });
});

describe('eerToRelational — Paso 9: Tipos de Unión (Categoría)', () => {
  it('añade una FK nullable en cada superclase apuntando a la tabla de categoría', () => {
    const nodes: NodeData[] = [
      node({ id: 'e1', type: 'entity', label: 'Persona' }),
      node({ id: 'k1', type: 'key_attribute', label: 'dni' }),
      node({ id: 'e2', type: 'entity', label: 'Empresa' }),
      node({ id: 'k2', type: 'key_attribute', label: 'cif' }),
      node({ id: 'e3', type: 'entity', label: 'Propietario' }),
      node({ id: 'k3', type: 'key_attribute', label: 'id_propietario' }),
      node({ id: 'u1', type: 'union', label: 'u' }),
    ];
    const links: LinkData[] = [
      { source: 'e1', target: 'k1' },
      { source: 'e2', target: 'k2' },
      { source: 'e3', target: 'k3' },
      { source: 'u1', target: 'e3' },
      { source: 'e1', target: 'u1' },
      { source: 'e2', target: 'u1' },
    ];

    const schema = eerToRelational(nodes, links);

    const persona = findTable(schema, 'PERSONA');
    const empresa = findTable(schema, 'EMPRESA');
    const fkPersona = persona.foreignKeys.find(fk => fk.targetTableName === 'PROPIETARIO');
    const fkEmpresa = empresa.foreignKeys.find(fk => fk.targetTableName === 'PROPIETARIO');

    expect(fkPersona?.onDelete).toBe('SET NULL');
    expect(fkEmpresa?.onDelete).toBe('SET NULL');
  });
});

// ---------------------------------------------------------------------------
// v1.6.0 — Propuestas de Enrique Soler Castillo (SPECIFICATIONS.md §3.7.A/B).
// Se parte del DSL real (compileEER) para cubrir también la ida y vuelta con el compilador.
// ---------------------------------------------------------------------------

function schemaFromDSL(code: string) {
  const compiled = compileEER(code);
  expect(compiled.isValid).toBe(true);
  return eerToRelational(compiled.nodes, compiled.links);
}

const CIRCULA = `
ent PILOTO
key_att Id_Piloto -> PILOTO
ent TRAMO
key_att Id_Tramo -> TRAMO
rel CIRCULA
link PILOTO CIRCULA "N"
link TRAMO CIRCULA "M"
key_att Vuelta -> CIRCULA
att Tiempo -> CIRCULA
`;

describe('eerToRelational — atributos clave de relación (Pasos 5 y 7)', () => {
  it('Paso 5: el atributo clave de la relación M:N entra en la PK de la tabla puente', () => {
    const circula = findTable(schemaFromDSL(CIRCULA), 'CIRCULA');
    const pk = circula.columns.filter(c => c.isPrimaryKey).map(c => c.name);
    expect(pk).toEqual(['PILOTO_ID_PILOTO', 'TRAMO_ID_TRAMO', 'VUELTA']);
    expect(circula.columns.find(c => c.name === 'VUELTA')?.isNullable).toBe(false);
    expect(circula.columns.find(c => c.name === 'VUELTA')?.stepTrace?.stepKey).toBe('STEP5_ATTR_PK');
    expect(circula.columns.find(c => c.name === 'TIEMPO')?.isPrimaryKey).toBe(false);
  });

  it('Paso 7: el atributo clave de una relación n-aria entra en la PK', () => {
    const schema = schemaFromDSL(`
ent A
ent B
ent C
rel R
link A R "N"
link B R "N"
link C R "N"
key_att Turno -> R
`);
    const r = findTable(schema, 'R');
    expect(r.columns.find(c => c.name === 'TURNO')?.isPrimaryKey).toBe(true);
    expect(r.foreignKeys.every(fk => fk.onDelete === 'NO ACTION')).toBe(true);
  });

  it('Paso 4: un atributo clave en una 1:N no altera la PK de la tabla del lado N', () => {
    const schema = schemaFromDSL(CIRCULA.replace('"M"', '"1"'));
    const piloto = findTable(schema, 'PILOTO');
    expect(piloto.columns.filter(c => c.isPrimaryKey).map(c => c.name)).toEqual(['ID_PILOTO']);
    expect(piloto.columns.some(c => c.name === 'CIRCULA_VUELTA')).toBe(true);
  });
});

describe('eerToRelational — política ON DELETE por paso', () => {
  const DEPTO = (profesorTotal: boolean) => `
ent DEPARTAMENTO
key_att Id_Depto -> DEPARTAMENTO
ent PROFESOR
key_att Id_Prof -> PROFESOR
rel PERTENECE
link DEPARTAMENTO PERTENECE "1"
link PROFESOR PERTENECE "N"${profesorTotal ? ' [total]' : ''}
`;

  it('Paso 4 con participación total del lado N: FK NOT NULL y NO ACTION (no se borra un departamento con profesores)', () => {
    const profesor = findTable(schemaFromDSL(DEPTO(true)), 'PROFESOR');
    expect(profesor.foreignKeys[0]!.onDelete).toBe('NO ACTION');
    expect(profesor.columns.find(c => c.isForeignKey)?.isNullable).toBe(false);
    expect(profesor.foreignKeys[0]!.stepTrace?.stepKey).toBe('STEP4_FK_CONSTRAINT');
  });

  it('Paso 4 con participación parcial: FK nullable y SET NULL', () => {
    const profesor = findTable(schemaFromDSL(DEPTO(false)), 'PROFESOR');
    expect(profesor.foreignKeys[0]!.onDelete).toBe('SET NULL');
    expect(profesor.columns.find(c => c.isForeignKey)?.isNullable).toBe(true);
    expect(profesor.foreignKeys[0]!.stepTrace?.stepKey).toBe('STEP4_FK_CONSTRAINT_SET_NULL');
  });

  it('Paso 5: las FKs de la tabla puente usan NO ACTION', () => {
    const circula = findTable(schemaFromDSL(CIRCULA), 'CIRCULA');
    expect(circula.foreignKeys.map(fk => fk.onDelete)).toEqual(['NO ACTION', 'NO ACTION']);
  });

  it('Pasos 2 y 6 mantienen CASCADE (dependencia existencial)', () => {
    const schema = schemaFromDSL(`
ent PEDIDO
key_att Id_Pedido -> PEDIDO
multivalued_att Telefono -> PEDIDO
weak_ent LINEA
key_att Num -> LINEA
ident_rel CONTIENE
link PEDIDO CONTIENE "1"
link LINEA CONTIENE "N" [total]
`);
    expect(findTable(schema, 'LINEA').foreignKeys[0]!.onDelete).toBe('CASCADE');
    expect(findTable(schema, 'PEDIDO_TELEFONO').foreignKeys[0]!.onDelete).toBe('CASCADE');
  });

  it('Paso 3: la FK va al lado total aunque sea el segundo enlace, es NOT NULL y migra los atributos de la relación', () => {
    const schema = schemaFromDSL(`
ent PERSONA
key_att Dni -> PERSONA
ent PASAPORTE
key_att Numero -> PASAPORTE
rel POSEE
link PERSONA POSEE "1"
link PASAPORTE POSEE "1" [total]
att Fecha_Emision -> POSEE
`);
    const pasaporte = findTable(schema, 'PASAPORTE');
    expect(pasaporte.foreignKeys[0]!.targetTableName).toBe('PERSONA');
    expect(pasaporte.foreignKeys[0]!.onDelete).toBe('NO ACTION');
    expect(pasaporte.columns.find(c => c.isForeignKey)?.isNullable).toBe(false);
    expect(pasaporte.columns.some(c => c.name === 'POSEE_FECHA_EMISION')).toBe(true);
  });

  it('Paso 3 sin participación total: FK nullable con SET NULL', () => {
    const schema = schemaFromDSL('ent A\nent B\nrel R\nlink A R "1"\nlink B R "1"');
    const b = findTable(schema, 'B');
    expect(b.foreignKeys[0]!.onDelete).toBe('SET NULL');
    expect(b.columns.find(c => c.isForeignKey)?.isNullable).toBe(true);
  });
});

describe('eerToRelational — atributo definidor de la especialización (Paso 8)', () => {
  const SPEC = (defining: string, extra = '') => `
ent EMPLEADO
key_att Dni -> EMPLEADO
${extra}
spec d -> EMPLEADO${defining}
ent INGENIERO
link d INGENIERO
`;

  it('añade el atributo definidor como columna de la superclase', () => {
    const empleado = findTable(schemaFromDSL(SPEC(' [TipoTrabajo]')), 'EMPLEADO');
    const col = empleado.columns.find(c => c.name === 'TIPOTRABAJO');
    expect(col?.stepTrace?.stepKey).toBe('STEP8_DEFINING_ATTR');
    expect(col?.isPrimaryKey).toBe(false);
  });

  it('no duplica la columna si el alumno ya declaró el atributo en la superclase', () => {
    const empleado = findTable(schemaFromDSL(SPEC(' [TipoTrabajo]', 'att TipoTrabajo -> EMPLEADO')), 'EMPLEADO');
    expect(empleado.columns.filter(c => c.name === 'TIPOTRABAJO')).toHaveLength(1);
  });

  it('sin atributo definidor (definida por el usuario) no se genera discriminante', () => {
    const empleado = findTable(schemaFromDSL(SPEC('')), 'EMPLEADO');
    expect(empleado.columns.map(c => c.name)).toEqual(['DNI']);
  });
});

describe('Ida y vuelta EER → DSL relacional → compilador', () => {
  it('conserva la acción ON DELETE y la nulabilidad de cada FK', () => {
    const schema = schemaFromDSL(`
ent DEPARTAMENTO
key_att Id_Depto -> DEPARTAMENTO
ent PROFESOR
key_att Id_Prof -> PROFESOR
ent COCHE
key_att Matricula -> COCHE
rel PERTENECE
link DEPARTAMENTO PERTENECE "1"
link PROFESOR PERTENECE "N" [total]
rel USA
link PROFESOR USA "1"
link COCHE USA "N"
`);
    const recompiled = compileRelationalDSL(generateRelationalDSL(schema));
    expect(recompiled.isValid).toBe(true);

    const describeFKs = (tables: typeof schema.tables) =>
      tables.flatMap(t => t.foreignKeys.map(fk => {
        const col = t.columns.find(c => c.name === fk.sourceColumnNames[0]);
        return `${t.name}.${fk.sourceColumnNames[0]}:${fk.onDelete}:${col?.isNullable}`;
      })).sort();

    expect(describeFKs(recompiled.schema.tables)).toEqual(describeFKs(schema.tables));
  });
});
