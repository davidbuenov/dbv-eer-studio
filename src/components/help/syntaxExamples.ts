// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { TranslationKey } from '../../i18n/es';

/*
 * Ejemplos de la pestaña "Sintaxis" como datos, no como JSX: así `syntaxExamples.test.ts`
 * compila cada uno. La guía anterior llegó a mostrar comandos que el compilador no reconoce
 * (`entity`, `att DNI [key]`, `FK UNIQUE`) y ningún test lo detectaba.
 */

export interface SyntaxExample {
  code: string;
  descKey: TranslationKey;
  /** `false` en ejemplos abreviados con "..." que no son DSL completo por sí mismos. */
  compiles?: boolean;
}

export interface SyntaxSection {
  titleKey: TranslationKey;
  examples: SyntaxExample[];
}

export const EER_SYNTAX: SyntaxSection[] = [
  {
    titleKey: 'modalHelp.eer.entitiesTitle',
    examples: [
      { code: 'ent EMPLEADO (100, 150)', descKey: 'modalHelp.eer.entity.desc' },
      { code: 'weak_ent DEPENDIENTE', descKey: 'modalHelp.eer.weakEntity.desc' },
      { code: 'rel TRABAJA_EN', descKey: 'modalHelp.eer.relationship.desc' },
      { code: 'ident_rel TIENE_DEP', descKey: 'modalHelp.eer.identRel.desc' },
    ],
  },
  {
    titleKey: 'modalHelp.eer.attributesTitle',
    examples: [
      { code: 'att Nombre -> EMPLEADO', descKey: 'modalHelp.eer.attrSimple.desc' },
      { code: 'key_att DNI -> EMPLEADO', descKey: 'modalHelp.eer.attrKey.desc' },
      { code: 'derived_att Edad -> EMPLEADO', descKey: 'modalHelp.eer.attrDerived.desc' },
      { code: 'multivalued_att Telefono -> EMPLEADO', descKey: 'modalHelp.eer.attrMultivalued.desc' },
      { code: 'key_att Vuelta -> CIRCULA', descKey: 'modalHelp.eer.attrRelationship.desc' },
    ],
  },
  {
    titleKey: 'modalHelp.eer.connectionsTitle',
    examples: [
      { code: 'link EMPLEADO TRABAJA_EN "N"', descKey: 'modalHelp.eer.link.desc' },
      { code: 'link DEPARTAMENTO TRABAJA_EN "1" [total]', descKey: 'modalHelp.eer.linkTotal.desc' },
    ],
  },
  {
    titleKey: 'modalHelp.eer.hierarchyTitle',
    examples: [
      { code: 'spec d -> EMPLEADO', descKey: 'modalHelp.eer.spec.desc' },
      { code: 'spec d -> EMPLEADO [TipoTrabajo]', descKey: 'modalHelp.eer.specDefining.desc' },
      { code: 'link d INGENIERO', descKey: 'modalHelp.eer.specLink.desc' },
      { code: 'union u', descKey: 'modalHelp.eer.union.desc' },
      { code: 'link PERSONA u', descKey: 'modalHelp.eer.unionSuper.desc' },
      { code: 'link u PROPIETARIO', descKey: 'modalHelp.eer.unionCategory.desc' },
    ],
  },
];

export const RELATIONAL_SYNTAX: SyntaxSection[] = [
  {
    titleKey: 'modalHelp.rel.tablesTitle',
    examples: [
      { code: 'table EMPLEADO [x: 60, y: 60] { ... }', descKey: 'modalHelp.rel.tableCoords.desc', compiles: false },
      { code: 'table DEPARTAMENTO { ... }', descKey: 'modalHelp.rel.tableAuto.desc', compiles: false },
    ],
  },
  {
    titleKey: 'modalHelp.rel.columnsTitle',
    examples: [
      { code: 'DNI NUMBER(10) PK', descKey: 'modalHelp.rel.colPK.desc' },
      { code: 'NOMBRE VARCHAR2(100) NOT NULL', descKey: 'modalHelp.rel.colNotNull.desc' },
      { code: 'FECHA_INGRESO DATE', descKey: 'modalHelp.rel.colNullable.desc' },
    ],
  },
  {
    titleKey: 'modalHelp.rel.fkTitle',
    examples: [
      { code: 'DEPT_ID NUMBER(10) FK -> DEPARTAMENTO(NUMERO)', descKey: 'modalHelp.rel.fkRegular.desc' },
      { code: 'EMP_ID NUMBER(10) PK FK -> EMPLEADO(ID) ON DELETE CASCADE', descKey: 'modalHelp.rel.fkPk.desc' },
    ],
  },
  {
    titleKey: 'modalHelp.rel.constraintsTitle',
    examples: [
      { code: 'DEPT_ID NUMBER(10) NOT NULL FK -> DEPARTAMENTO(NUMERO) ON DELETE NO ACTION', descKey: 'modalHelp.rel.fkMandatory.desc' },
      { code: 'COCHE_ID NUMBER(10) FK -> COCHE(MATRICULA) ON DELETE SET NULL', descKey: 'modalHelp.rel.cascade.desc' },
    ],
  },
];
