// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { eerToRelational } from './eerToRelational';
import type { NodeData, LinkData } from '../../types';

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
