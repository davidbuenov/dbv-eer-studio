// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { Language } from './language';
import { interpolate } from './translate';

/**
 * Claves del texto pedagógico generado por el motor eerToRelational.ts (9 Pasos).
 * Cada clave corresponde a un StepTrace concreto; los datos reales (nombres de
 * tabla/entidad) se interpolan vía `params` en tiempo de renderizado, nunca dentro
 * del motor de conversión (ver ADR "StepTrace pasa a datos estructurados" en memory.md).
 */
export type StepKey =
  | 'STEP1_STRONG_ENTITY'
  | 'STEP1_ATTR_PK'
  | 'STEP1_ATTR_COLUMN'
  | 'STEP1_DEFAULT_PK'
  | 'STEP2_WEAK_ENTITY'
  | 'STEP2_FK_OWNER'
  | 'STEP2_FK_CASCADE'
  | 'STEP2_PARTIAL_KEY'
  | 'STEP2_ATTRIBUTE'
  | 'STEP3_FK_ONE_TO_ONE'
  | 'STEP3_FK_CONSTRAINT'
  | 'STEP3_FK_CONSTRAINT_SET_NULL'
  | 'STEP3_ATTR'
  | 'STEP4_FK_ONE_TO_MANY'
  | 'STEP4_ATTR'
  | 'STEP4_FK_CONSTRAINT'
  | 'STEP4_FK_CONSTRAINT_SET_NULL'
  | 'STEP5_PK_FK'
  | 'STEP5_FK_CONSTRAINT'
  | 'STEP5_ATTR'
  | 'STEP5_ATTR_PK'
  | 'STEP5_BRIDGE_TABLE'
  | 'STEP6_FK_OWNER'
  | 'STEP6_VALUE'
  | 'STEP6_FK_CASCADE'
  | 'STEP6_TABLE'
  | 'STEP7_PK_EXCLUDED'
  | 'STEP7_PK_COMPONENT'
  | 'STEP7_FK_CONSTRAINT'
  | 'STEP7_ATTR'
  | 'STEP7_ATTR_PK'
  | 'STEP7_BRIDGE_TABLE'
  | 'STEP8A_PK_FK_INHERITED'
  | 'STEP8A_FK_LINK'
  | 'STEP8_DEFINING_ATTR'
  | 'STEP9_CATEGORY_TABLE'
  | 'STEP9_FK_CATEGORY'
  | 'STEP9_FK_CONSTRAINT'
  | 'DSL_TABLE';

interface StepEntry {
  title: string;
  description: string;
}

const stepsEs: Record<StepKey, StepEntry> = {
  STEP1_STRONG_ENTITY: {
    title: 'Paso 1: Mapeado de Entidades Fuertes',
    description: "Se crea la tabla '{{tableName}}' para la entidad fuerte '{{entityLabel}}'. Se mapean los atributos simples y componentes simples de compuestos.",
  },
  STEP1_ATTR_PK: {
    title: 'Paso 1: Atributo de Entidad Fuerte',
    description: "Clave Primaria (PK) derivada del atributo clave '{{attrLabel}}'.",
  },
  STEP1_ATTR_COLUMN: {
    title: 'Paso 1: Atributo de Entidad Fuerte',
    description: "Columna derivada del atributo '{{attrLabel}}'.",
  },
  STEP1_DEFAULT_PK: {
    title: 'Paso 1: Clave Primaria por Defecto',
    description: "Se genera la columna PK '{{defaultKeyName}}' al no detectarse atributo clave explícito en la entidad.",
  },
  STEP2_WEAK_ENTITY: {
    title: 'Paso 2: Mapeado de Entidades Débiles',
    description: "Se crea la tabla '{{tableName}}' para la entidad débil '{{weakEntityLabel}}'. Incluye la PK de la entidad propietaria como FK y forma su PK compuesta con su clave parcial.",
  },
  STEP2_FK_OWNER: {
    title: 'Paso 2: FK Propagada del Propietario',
    description: "Clave ajena propagada desde la entidad propietaria '{{ownerTableName}}'.",
  },
  STEP2_FK_CASCADE: {
    title: 'Paso 2: Restricción FK con CASCADE',
    description: 'ON DELETE CASCADE justificado: la entidad débil no tiene existencia propia sin su propietaria, así que al borrar la propietaria se borran sus débiles.',
  },
  STEP2_PARTIAL_KEY: {
    title: 'Paso 2: Clave Parcial / Atributo',
    description: "Clave parcial (discriminador) de la entidad débil '{{weakEntityLabel}}'.",
  },
  STEP2_ATTRIBUTE: {
    title: 'Paso 2: Clave Parcial / Atributo',
    description: "Atributo de la entidad débil '{{weakEntityLabel}}'.",
  },
  STEP3_FK_ONE_TO_ONE: {
    title: 'Paso 3: FK en Relación Binaria 1:1',
    description: "Clave ajena propagada para modelar la relación 1:1 '{{relLabel}}'. Contiene restricción UNIQUE.",
  },
  STEP3_FK_CONSTRAINT: {
    title: 'Paso 3: Restricción FK 1:1 (NO ACTION)',
    description: "FK obligatoria (participación total) de '{{targetTableName}}' hacia '{{sourceTableName}}' con ON DELETE NO ACTION: no se puede borrar la fila de '{{sourceTableName}}' mientras tenga su pareja obligatoria.",
  },
  STEP3_FK_CONSTRAINT_SET_NULL: {
    title: 'Paso 3: Restricción FK 1:1 (SET NULL)',
    description: "FK opcional (participación parcial) de '{{targetTableName}}' hacia '{{sourceTableName}}' con ON DELETE SET NULL: al borrar la fila referenciada, la pareja pierde el vínculo pero sigue existiendo.",
  },
  STEP3_ATTR: {
    title: 'Paso 3: Atributo de Relación 1:1',
    description: "Atributo de la relación 1:1 '{{relLabel}}' migrado a la tabla que recibe la FK '{{tableName}}'.",
  },
  STEP4_FK_ONE_TO_MANY: {
    title: 'Paso 4: FK en Relación Binaria 1:N',
    description: "Propagación de la clave primaria de la tabla del lado 1 '{{tableOneName}}' como FK en la tabla del lado N '{{tableManyName}}'.",
  },
  STEP4_ATTR: {
    title: 'Paso 4: Atributo de Relación 1:N',
    description: "Atributo de la relación 1:N migrado a la tabla del lado N '{{tableName}}'.",
  },
  STEP4_FK_CONSTRAINT: {
    title: 'Paso 4: Restricción FK 1:N (NO ACTION)',
    description: "FK obligatoria (participación total del lado N) hacia '{{tableOneName}}' con ON DELETE NO ACTION: no se puede borrar una fila de '{{tableOneName}}' mientras tenga filas asociadas en '{{tableManyName}}' (hay que reasignarlas antes).",
  },
  STEP4_FK_CONSTRAINT_SET_NULL: {
    title: 'Paso 4: Restricción FK 1:N (SET NULL)',
    description: "FK opcional (participación parcial del lado N) hacia '{{tableOneName}}' con ON DELETE SET NULL: al borrar la fila de '{{tableOneName}}', las filas de '{{tableManyName}}' siguen existiendo sin vínculo.",
  },
  STEP5_PK_FK: {
    title: 'Paso 5: Componente PK/FK M:N (Entidad {{side}})',
    description: "Clave ajena participante de '{{tableName}}' formando la PK compuesta de la tabla puente M:N.",
  },
  STEP5_FK_CONSTRAINT: {
    title: 'Paso 5: Restricción FK M:N (NO ACTION)',
    description: "Integridad referencial a '{{tableName}}' con ON DELETE NO ACTION: no se puede borrar una fila de '{{tableName}}' mientras participe en la relación; borrar esos vínculos debe ser una decisión explícita.",
  },
  STEP5_ATTR: {
    title: 'Paso 5: Atributo Propio M:N',
    description: 'Atributo de la relación muchos-a-muchos incorporado como columna en la tabla puente.',
  },
  STEP5_ATTR_PK: {
    title: 'Paso 5: Atributo Clave de la Relación M:N',
    description: "El atributo clave '{{attrLabel}}' de la relación '{{relLabel}}' forma parte de la PK de la tabla puente: la misma pareja de entidades puede relacionarse varias veces, distinguidas por '{{attrLabel}}'.",
  },
  STEP5_BRIDGE_TABLE: {
    title: 'Paso 5: Mapeado de Relaciones M:N Binarias',
    description: "Se crea la tabla puente '{{bridgeTableName}}' para representar la relación muchos-a-muchos. Su PK es la unión de las FKs de ambas entidades.",
  },
  STEP6_FK_OWNER: {
    title: 'Paso 6: FK Propietario de Atributo Multivalorado',
    description: 'Clave ajena de la entidad propietaria formando parte de la PK de la tabla del atributo multivalor.',
  },
  STEP6_VALUE: {
    title: 'Paso 6: Valor del Atributo Multivalorado',
    description: 'Columna que almacena cada uno de los múltiples valores asociados a la entidad.',
  },
  STEP6_FK_CASCADE: {
    title: 'Paso 6: Restricción FK con CASCADE',
    description: 'ON DELETE CASCADE para eliminar los valores multivalorados al borrar la entidad propietaria.',
  },
  STEP6_TABLE: {
    title: 'Paso 6: Mapeado de Atributos Multivalorados',
    description: "Se crea la tabla independiente '{{tableName}}' para evitar violar la Primera Forma Normal (1FN).",
  },
  STEP7_PK_EXCLUDED: {
    title: 'Paso 7 (N-aria): FK excluida de la PK por cardinalidad 1',
    description: "Clave ajena de '{{tableName}}' excluida de la PK por su restricción de cardinalidad 1 en la relación n-aria '{{relLabel}}'.",
  },
  STEP7_PK_COMPONENT: {
    title: 'Paso 7 (N-aria): Componente de la PK Compuesta',
    description: "Clave ajena de '{{tableName}}' participante de la PK compuesta de la relación n-aria '{{relLabel}}'.",
  },
  STEP7_FK_CONSTRAINT: {
    title: 'Paso 7: Restricción FK N-aria (NO ACTION)',
    description: "Integridad referencial a '{{tableName}}' con ON DELETE NO ACTION: no se puede borrar una fila de '{{tableName}}' mientras participe en la relación.",
  },
  STEP7_ATTR: {
    title: 'Paso 7: Atributo Propio de la Relación N-aria',
    description: 'Atributo de la relación n-aria incorporado como columna en la tabla de relación.',
  },
  STEP7_ATTR_PK: {
    title: 'Paso 7: Atributo Clave de la Relación N-aria',
    description: "El atributo clave '{{attrLabel}}' de la relación '{{relLabel}}' forma parte de la PK de la tabla de relación.",
  },
  STEP7_BRIDGE_TABLE: {
    title: 'Paso 7: Mapeado de Relaciones N-arias (n > 2)',
    description: "Se crea la tabla de relación '{{bridgeTableName}}' para representar la relación n-aria entre {{count}} entidades. Su PK es la combinación de las FKs de las entidades sin restricción de cardinalidad 1.",
  },
  STEP8A_PK_FK_INHERITED: {
    title: 'Paso 8 (Opción 8A): PK/FK de Superclase Heredada',
    description: "Clave heredada de la superclase '{{superTableName}}' actuando como PK y FK en la subclase.",
  },
  STEP8A_FK_LINK: {
    title: 'Paso 8 (Opción 8A): Enlace de Herencia FK',
    description: "Restricción de herencia asociando la subclase '{{subTableName}}' a su superclase '{{superTableName}}' con ON DELETE CASCADE: la fila de la subclase es parte de la misma entidad que la de la superclase.",
  },
  STEP8_DEFINING_ATTR: {
    title: 'Paso 8: Atributo Definidor de la Especialización',
    description: "Columna del atributo definidor '{{attrLabel}}' en la superclase '{{superTableName}}': su valor determina a qué subclase pertenece cada fila (especialización definida por atributo).",
  },
  STEP9_CATEGORY_TABLE: {
    title: 'Paso 9: Mapeado de Categoría (Tipo de Unión)',
    description: "Se crea la tabla de categoría '{{categoryTableName}}' con su clave sustituta artificial como PK.",
  },
  STEP9_FK_CATEGORY: {
    title: 'Paso 9: FK de Categoría de Unión (Caso 9.1)',
    description: "Clave ajena que vincula la superclase '{{superTableName}}' con la categoría sustituta '{{categoryTableName}}'.",
  },
  STEP9_FK_CONSTRAINT: {
    title: 'Paso 9: Restricción FK de Categoría',
    description: "Integridad referencial que asocia la superclase a la categoría '{{categoryTableName}}'.",
  },
  DSL_TABLE: {
    title: 'Tabla Relacional DSL',
    description: "Tabla '{{tableName}}' definida mediante DSL de texto relacional.",
  },
};

const stepsEn: Record<StepKey, StepEntry> = {
  STEP1_STRONG_ENTITY: {
    title: 'Step 1: Strong Entity Mapping',
    description: "Table '{{tableName}}' is created for the strong entity '{{entityLabel}}'. Simple attributes and simple components of composite attributes are mapped.",
  },
  STEP1_ATTR_PK: {
    title: 'Step 1: Strong Entity Attribute',
    description: "Primary Key (PK) derived from the key attribute '{{attrLabel}}'.",
  },
  STEP1_ATTR_COLUMN: {
    title: 'Step 1: Strong Entity Attribute',
    description: "Column derived from the attribute '{{attrLabel}}'.",
  },
  STEP1_DEFAULT_PK: {
    title: 'Step 1: Default Primary Key',
    description: "PK column '{{defaultKeyName}}' is generated because no explicit key attribute was found on the entity.",
  },
  STEP2_WEAK_ENTITY: {
    title: 'Step 2: Weak Entity Mapping',
    description: "Table '{{tableName}}' is created for the weak entity '{{weakEntityLabel}}'. It includes the owner entity's PK as an FK and combines it with its partial key to form its composite PK.",
  },
  STEP2_FK_OWNER: {
    title: "Step 2: FK Propagated from Owner",
    description: "Foreign key propagated from the owner entity '{{ownerTableName}}'.",
  },
  STEP2_FK_CASCADE: {
    title: 'Step 2: FK Constraint with CASCADE',
    description: 'ON DELETE CASCADE is justified: the weak entity has no existence of its own without its owner, so deleting the owner deletes its weak entities.',
  },
  STEP2_PARTIAL_KEY: {
    title: 'Step 2: Partial Key / Attribute',
    description: "Partial key (discriminator) of the weak entity '{{weakEntityLabel}}'.",
  },
  STEP2_ATTRIBUTE: {
    title: 'Step 2: Partial Key / Attribute',
    description: "Attribute of the weak entity '{{weakEntityLabel}}'.",
  },
  STEP3_FK_ONE_TO_ONE: {
    title: 'Step 3: FK in 1:1 Binary Relationship',
    description: "Foreign key propagated to model the 1:1 relationship '{{relLabel}}'. It carries a UNIQUE constraint.",
  },
  STEP3_FK_CONSTRAINT: {
    title: 'Step 3: 1:1 FK Constraint (NO ACTION)',
    description: "Mandatory FK (total participation) from '{{targetTableName}}' to '{{sourceTableName}}' with ON DELETE NO ACTION: the '{{sourceTableName}}' row cannot be deleted while its mandatory partner exists.",
  },
  STEP3_FK_CONSTRAINT_SET_NULL: {
    title: 'Step 3: 1:1 FK Constraint (SET NULL)',
    description: "Optional FK (partial participation) from '{{targetTableName}}' to '{{sourceTableName}}' with ON DELETE SET NULL: deleting the referenced row unlinks its partner, which keeps existing.",
  },
  STEP3_ATTR: {
    title: 'Step 3: 1:1 Relationship Attribute',
    description: "Attribute of the 1:1 relationship '{{relLabel}}' migrated to the table holding the FK '{{tableName}}'.",
  },
  STEP4_FK_ONE_TO_MANY: {
    title: 'Step 4: FK in 1:N Binary Relationship',
    description: "Primary key of the table on the 1 side '{{tableOneName}}' is propagated as an FK on the table on the N side '{{tableManyName}}'.",
  },
  STEP4_ATTR: {
    title: 'Step 4: 1:N Relationship Attribute',
    description: "Attribute of the 1:N relationship migrated to the table on the N side '{{tableName}}'.",
  },
  STEP4_FK_CONSTRAINT: {
    title: 'Step 4: 1:N FK Constraint (NO ACTION)',
    description: "Mandatory FK (total participation of the N side) to '{{tableOneName}}' with ON DELETE NO ACTION: a '{{tableOneName}}' row cannot be deleted while it has related rows in '{{tableManyName}}' (they must be reassigned first).",
  },
  STEP4_FK_CONSTRAINT_SET_NULL: {
    title: 'Step 4: 1:N FK Constraint (SET NULL)',
    description: "Optional FK (partial participation of the N side) to '{{tableOneName}}' with ON DELETE SET NULL: when the '{{tableOneName}}' row is deleted, the '{{tableManyName}}' rows keep existing without a link.",
  },
  STEP5_PK_FK: {
    title: 'Step 5: M:N PK/FK Component (Entity {{side}})',
    description: "Participating foreign key of '{{tableName}}' forming the composite PK of the M:N bridge table.",
  },
  STEP5_FK_CONSTRAINT: {
    title: 'Step 5: M:N FK Constraint (NO ACTION)',
    description: "Referential integrity to '{{tableName}}' with ON DELETE NO ACTION: a '{{tableName}}' row cannot be deleted while it takes part in the relationship; removing those links must be an explicit decision.",
  },
  STEP5_ATTR: {
    title: 'Step 5: M:N Own Attribute',
    description: 'Attribute of the many-to-many relationship added as a column in the bridge table.',
  },
  STEP5_ATTR_PK: {
    title: 'Step 5: M:N Relationship Key Attribute',
    description: "Key attribute '{{attrLabel}}' of the relationship '{{relLabel}}' is part of the bridge table's PK: the same pair of entities can be related several times, told apart by '{{attrLabel}}'.",
  },
  STEP5_BRIDGE_TABLE: {
    title: 'Step 5: Binary M:N Relationship Mapping',
    description: "Bridge table '{{bridgeTableName}}' is created to represent the many-to-many relationship. Its PK is the union of the FKs of both entities.",
  },
  STEP6_FK_OWNER: {
    title: 'Step 6: Owner FK of Multivalued Attribute',
    description: "Foreign key of the owner entity forming part of the PK of the multivalued attribute's table.",
  },
  STEP6_VALUE: {
    title: 'Step 6: Multivalued Attribute Value',
    description: 'Column storing each of the multiple values associated with the entity.',
  },
  STEP6_FK_CASCADE: {
    title: 'Step 6: FK Constraint with CASCADE',
    description: 'ON DELETE CASCADE removes the multivalued values when the owner entity is deleted.',
  },
  STEP6_TABLE: {
    title: 'Step 6: Multivalued Attribute Mapping',
    description: "An independent table '{{tableName}}' is created to avoid violating First Normal Form (1NF).",
  },
  STEP7_PK_EXCLUDED: {
    title: 'Step 7 (N-ary): FK Excluded from PK by Cardinality 1',
    description: "Foreign key of '{{tableName}}' excluded from the PK due to its cardinality-1 constraint in the n-ary relationship '{{relLabel}}'.",
  },
  STEP7_PK_COMPONENT: {
    title: 'Step 7 (N-ary): Composite PK Component',
    description: "Foreign key of '{{tableName}}' participating in the composite PK of the n-ary relationship '{{relLabel}}'.",
  },
  STEP7_FK_CONSTRAINT: {
    title: 'Step 7: N-ary FK Constraint (NO ACTION)',
    description: "Referential integrity to '{{tableName}}' with ON DELETE NO ACTION: a '{{tableName}}' row cannot be deleted while it takes part in the relationship.",
  },
  STEP7_ATTR: {
    title: 'Step 7: N-ary Relationship Own Attribute',
    description: 'Attribute of the n-ary relationship added as a column in the relationship table.',
  },
  STEP7_ATTR_PK: {
    title: 'Step 7: N-ary Relationship Key Attribute',
    description: "Key attribute '{{attrLabel}}' of the relationship '{{relLabel}}' is part of the relationship table's PK.",
  },
  STEP7_BRIDGE_TABLE: {
    title: 'Step 7: N-ary Relationship Mapping (n > 2)',
    description: "Relationship table '{{bridgeTableName}}' is created to represent the n-ary relationship among {{count}} entities. Its PK is the combination of the FKs of the entities without a cardinality-1 constraint.",
  },
  STEP8A_PK_FK_INHERITED: {
    title: 'Step 8 (Option 8A): Inherited Superclass PK/FK',
    description: "Key inherited from the superclass '{{superTableName}}' acting as PK and FK in the subclass.",
  },
  STEP8A_FK_LINK: {
    title: 'Step 8 (Option 8A): Inheritance FK Link',
    description: "Inheritance constraint linking the subclass '{{subTableName}}' to its superclass '{{superTableName}}' with ON DELETE CASCADE: the subclass row is part of the same entity as the superclass row.",
  },
  STEP8_DEFINING_ATTR: {
    title: 'Step 8: Specialization Defining Attribute',
    description: "Column for the defining attribute '{{attrLabel}}' in the superclass '{{superTableName}}': its value determines which subclass each row belongs to (attribute-defined specialization).",
  },
  STEP9_CATEGORY_TABLE: {
    title: 'Step 9: Category Mapping (Union Type)',
    description: "Category table '{{categoryTableName}}' is created with its artificial surrogate key as PK.",
  },
  STEP9_FK_CATEGORY: {
    title: 'Step 9: Union Category FK (Case 9.1)',
    description: "Foreign key linking the superclass '{{superTableName}}' to the surrogate category '{{categoryTableName}}'.",
  },
  STEP9_FK_CONSTRAINT: {
    title: 'Step 9: Category FK Constraint',
    description: "Referential integrity linking the superclass to the category '{{categoryTableName}}'.",
  },
  DSL_TABLE: {
    title: 'DSL Relational Table',
    description: "Table '{{tableName}}' defined via the relational text DSL.",
  },
};

const stepDictionaries: Record<Language, Record<StepKey, StepEntry>> = {
  es: stepsEs,
  en: stepsEn,
};

/**
 * Resumen teórico fijo de los 9 pasos formales (contenido pedagógico estático,
 * independiente de cualquier instancia concreta de tabla/columna).
 */
export type FormalStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const formalStepsEs: Record<FormalStepNumber, StepEntry> = {
  1: {
    title: 'Paso 1: Entidades Fuertes',
    description: 'Por cada tipo de entidad fuerte E, se crea una relación (tabla) R. Los atributos simples se incluyen directamente como columnas. La clave primaria de E se convierte en la PK de R.',
  },
  2: {
    title: 'Paso 2: Entidades Débiles',
    description: 'Se crea una tabla para la entidad débil W. Se propaga la PK de la entidad propietaria como FK y se combina con la clave parcial de W para formar su PK compuesta. La FK usa ON DELETE CASCADE porque W no puede existir sin su propietaria.',
  },
  3: {
    title: 'Paso 3: Relaciones Binarias 1:1',
    description: 'Se elige la relación con participación total e incluye como FK la clave primaria de la otra tabla, marcándola con restricción UNIQUE. FK obligatoria ⇒ ON DELETE NO ACTION; FK opcional ⇒ ON DELETE SET NULL.',
  },
  4: {
    title: 'Paso 4: Relaciones Binarias 1:N',
    description: 'Se propaga la clave primaria de la tabla del lado 1 como clave ajena (FK) en la tabla del lado N. Los atributos de la relación migran al lado N. Participación total del lado N ⇒ FK NOT NULL con ON DELETE NO ACTION (no se borra un departamento con profesores); parcial ⇒ ON DELETE SET NULL. CASCADE no procede: borraría entidades independientes.',
  },
  5: {
    title: 'Paso 5: Relaciones Binarias M:N',
    description: 'Se crea una tabla puente de correspondencia. Su PK es la combinación de las FKs que referencian a las dos entidades participantes más los atributos clave de la relación. Las FKs usan ON DELETE NO ACTION.',
  },
  6: {
    title: 'Paso 6: Atributos Multivalorados',
    description: 'Para cada atributo multivalor se crea una tabla independiente con la PK del propietario y el valor del atributo (evitando violar la 1FN).',
  },
  7: {
    title: 'Paso 7: Relaciones n-arias (n > 2)',
    description: 'Se crea una tabla de relación n-vías que incluye las PKs de todas las entidades participantes como claves ajenas (con ON DELETE NO ACTION). Los atributos clave de la relación se suman a la PK.',
  },
  8: {
    title: 'Paso 8: Especialización y Generalización',
    description: 'Se aplican las opciones de herencia: 8A (varias tablas con FK a la superclase), 8B (tablas solo por subclase), 8C (tabla única con discriminador) u 8D (banderas booleanas). Si la especialización es definida por atributo (spec d -> SUPER [ATRIBUTO]), el atributo definidor es una columna de la superclase.',
  },
  9: {
    title: 'Paso 9: Categorías (Tipos de Unión)',
    description: 'Se crea una tabla de categoría con clave sustituta artificial (Caso 9.1) o PK unificada compartida (Caso 9.2).',
  },
};

const formalStepsEn: Record<FormalStepNumber, StepEntry> = {
  1: {
    title: 'Step 1: Strong Entities',
    description: 'For each strong entity type E, a relation (table) R is created. Simple attributes are included directly as columns. The primary key of E becomes the PK of R.',
  },
  2: {
    title: 'Step 2: Weak Entities',
    description: "A table is created for the weak entity W. The owner entity's PK is propagated as an FK and combined with W's partial key to form its composite PK. The FK uses ON DELETE CASCADE because W cannot exist without its owner.",
  },
  3: {
    title: 'Step 3: 1:1 Binary Relationships',
    description: 'The relationship with total participation is chosen and the primary key of the other table is included as an FK, marked with a UNIQUE constraint. Mandatory FK ⇒ ON DELETE NO ACTION; optional FK ⇒ ON DELETE SET NULL.',
  },
  4: {
    title: 'Step 4: 1:N Binary Relationships',
    description: 'The primary key of the table on the 1 side is propagated as a foreign key (FK) on the table on the N side. Attributes of the relationship migrate to the N side. Total participation of the N side ⇒ NOT NULL FK with ON DELETE NO ACTION (a department with lecturers cannot be deleted); partial ⇒ ON DELETE SET NULL. CASCADE does not apply: it would delete independent entities.',
  },
  5: {
    title: 'Step 5: M:N Binary Relationships',
    description: 'A bridge (correspondence) table is created. Its PK is the combination of the FKs referencing the two participating entities plus the key attributes of the relationship. The FKs use ON DELETE NO ACTION.',
  },
  6: {
    title: 'Step 6: Multivalued Attributes',
    description: 'For each multivalued attribute, an independent table is created with the owner\'s PK and the attribute value (avoiding a 1NF violation).',
  },
  7: {
    title: 'Step 7: N-ary Relationships (n > 2)',
    description: 'An n-way relationship table is created including the PKs of all participating entities as foreign keys (with ON DELETE NO ACTION). Key attributes of the relationship are added to the PK.',
  },
  8: {
    title: 'Step 8: Specialization and Generalization',
    description: 'Inheritance options are applied: 8A (multiple tables with FK to the superclass), 8B (tables only per subclass), 8C (single table with discriminator), or 8D (boolean flags). If the specialization is attribute-defined (spec d -> SUPER [ATTRIBUTE]), the defining attribute is a column of the superclass.',
  },
  9: {
    title: 'Step 9: Categories (Union Types)',
    description: 'A category table is created with an artificial surrogate key (Case 9.1) or a shared unified PK (Case 9.2).',
  },
};

const formalStepDictionaries: Record<Language, Record<FormalStepNumber, StepEntry>> = {
  es: formalStepsEs,
  en: formalStepsEn,
};

/**
 * Traduce e interpola un StepTrace pedagógico (instancia concreta con nombres reales).
 */
export function translateStep(lang: Language, stepKey: StepKey, params?: Record<string, string>): StepEntry {
  const entry = stepDictionaries[lang][stepKey];
  return {
    title: interpolate(entry.title, params),
    description: interpolate(entry.description, params),
  };
}

/**
 * Solo el título de un StepTrace. Lo usa el pie de cada tarjeta del Modelo Relacional,
 * que se re-renderiza en cada frame de arrastre: interpolar además la descripción
 * (más larga y con más marcadores) sería trabajo íntegramente descartado.
 */
export function translateStepTitle(lang: Language, stepKey: StepKey, params?: Record<string, string>): string {
  return interpolate(stepDictionaries[lang][stepKey].title, params);
}

/**
 * Devuelve el resumen teórico fijo (sin interpolación) de uno de los 9 pasos formales.
 */
export function translateFormalStep(lang: Language, step: FormalStepNumber): StepEntry {
  return formalStepDictionaries[lang][step];
}
