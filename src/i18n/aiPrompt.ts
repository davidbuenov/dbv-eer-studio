// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { Language } from './language';

/*
 * Prompt para generar DSL EER con una IA externa, en el idioma de la interfaz.
 *
 * Solo se traducen las instrucciones y los nombres de ejemplo: los comandos del DSL (`ent`,
 * `att`, `rel`, `link`, `spec`, `union`...) son idénticos en ambos idiomas, porque el compilador
 * no se traduce (lo verifica `aiPrompt.test.ts`).
 */

/** Marcador que el usuario sustituye por el enunciado de su problema. */
export const AI_PROMPT_PLACEHOLDER: Record<Language, string> = {
  es: '[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]',
  en: '[PASTE YOUR DATABASE PROBLEM HERE]',
};

const PROMPTS: Record<Language, string> = {
  es: `Actúa como un experto en diseño de bases de datos y generador de código para la herramienta "EER Studio". Tu tarea es analizar una descripción en lenguaje natural de un problema de requisitos de datos y convertirla en el código DSL (Domain Specific Language) específico que utiliza EER Studio para generar diagramas.

### Reglas de Sintaxis de EER Studio:

**IMPORTANTE:** Todos los elementos (entidades, atributos, relaciones, jerarquías) pueden llevar coordenadas opcionales: \`ELEMENTO NOMBRE (x, y)\`
**Longitud:** Usa nombres de entidades/atributos/relaciones con ≤15 caracteres para que quepan en las elipses/rectángulos.

1) Entidades
- Fuerte: \`ent EMPLEADO (100, 200)\`
- Débil: \`weak_ent CONTRATO (150, 350)\`

2) Atributos
- Simple: \`att Nombre -> EMPLEADO (120, 80)\` (alejado de la entidad)
- Clave: \`key_att DNI -> EMPLEADO (50, 80)\` (varios key_att en la misma entidad forman una clave compuesta)
- Clave alternativa: \`key_att Email -> EMPLEADO unique (50, 20)\` (UNIQUE NOT NULL, no forma la PK)
- Clave parcial de entidad débil: \`partial_key_att NumLinea -> LINEA (150, 420)\`
- Compuesto: \`att Direccion -> EMPLEADO (300, 80)\` y sus componentes \`att Calle -> Direccion (280, 20)\`, \`att Numero -> Direccion (340, 20)\`
- Derivado: \`derived_att Edad -> EMPLEADO (190, 80)\`
- Multivaluado: \`multivalued_att Telefono -> EMPLEADO (260, 80)\`
- De relación: \`att Fecha -> TRABAJA_EN (250, 120)\` (la flecha apunta a la relación). Si es clave (\`key_att\`) en una relación M:N o n-aria, forma parte de la PK de la tabla de la relación (ej. \`key_att Vuelta -> CIRCULA\`)

3) Relaciones
- Normal: \`rel TRABAJA_EN (250, 200)\` (centrada entre entidades)
- Identificativa: \`ident_rel POSEE (200, 350)\` (para entidad débil)

4) Conexiones
- Sintaxis: \`link ENTIDAD RELACION "CARDINALIDAD" [opcional:total]\`
- Ejemplo: \`link EMPLEADO TRABAJA_EN "N" [total]\`
- Rol (obligatorio en relaciones recursivas): \`link EMPLEADO SUPERVISA "1" role:Supervisor\` y \`link EMPLEADO SUPERVISA "N" role:Supervisado\`
- Relación ternaria: tres líneas link hacia la misma relación

5) Jerarquías
- Definir especialización: \`spec TIPO -> SUPERCLASE\` (TIPO: 'd' disjunta, 'o' solapada)
- Especialización definida por atributo: \`spec d -> EMPLEADO [TipoTrabajo]\` (el atributo definidor va entre corchetes; omítelos si la especialización es definida por el usuario)
- Especialización parcial (línea simple): \`spec o -> EMPLEADO partial\` (sin palabra es total, doble línea)
- Conectar subclases: \`link TIPO SUBCLASE\`

6) Uniones (categorías)
- Definir unión: \`union u\`
- Conectar superclases: \`link SUPERCLASE u\`
- Conectar categoría: \`link u CATEGORIA\`

### 📏 Guía de espaciado para evitar solapes
- Atributos en fila superior: Y = entidad_Y - 130 a -160; máx 4 por fila; X +100px entre atributos; si hay más, abre segunda fila superior 40–60px más arriba y resetea X.
- Atributos en laterales/columna: usa cuando haya >6 atributos; pon 3–4 a la izquierda (X = entidad_X - 130..140) y 3–4 a la derecha (X = entidad_X + 130..140); Y escalonado cada 70–80px.
- Entidades: separa 320–360px en X y 260–320px en Y; si una entidad tiene muchos atributos, súbela o bájala ±80–120px respecto a sus vecinas para evitar colisiones de filas.
- Relaciones: punto medio entre entidades; deja ≥180px de separación respecto a cada entidad si hay muchas aristas.

### 📋 Ejemplo completo (sin solapes, con toda la notación)
// ENTIDADES PRINCIPALES en una fila (y = 300), separadas ~400px
ent EMPLEADO (450, 300)
ent DEPARTAMENTO (850, 300)
ent PROYECTO (1250, 300)

// Atributos de EMPLEADO: clave, clave alternativa, compuesto, multivaluado y derivado
key_att Dni -> EMPLEADO (300, 160)
key_att Email -> EMPLEADO unique (400, 160)
att NomCompleto -> EMPLEADO (510, 160)
att Nombre -> NomCompleto (460, 60)
att Apellidos -> NomCompleto (570, 60)
multivalued_att Telefono -> EMPLEADO (300, 60)
derived_att Edad -> EMPLEADO (200, 160)

// Entidad débil con clave parcial y su relación identificativa
weak_ent DEPENDIENTE (80, 300)
partial_key_att NombreDep -> DEPENDIENTE (80, 160)
ident_rel TIENE_DEP (265, 300)
link EMPLEADO TIENE_DEP "1"
link DEPENDIENTE TIENE_DEP "N" [total]

// Atributos de DEPARTAMENTO y PROYECTO
key_att Numero -> DEPARTAMENTO (800, 160)
att NombreDept -> DEPARTAMENTO (910, 160)
key_att CodProyecto -> PROYECTO (1250, 160)

// 1:N con participación total y atributo de la relación
rel TRABAJA_EN (650, 300)
link EMPLEADO TRABAJA_EN "N" [total]
link DEPARTAMENTO TRABAJA_EN "1"
att Horas -> TRABAJA_EN (650, 190)

// 1:1 (un empleado dirige un departamento)
rel DIRIGE (650, 460)
link EMPLEADO DIRIGE "1"
link DEPARTAMENTO DIRIGE "1" [total]
att FechaInicio -> DIRIGE (650, 560)

// 1:N entre DEPARTAMENTO y PROYECTO
rel CONTROLA (1050, 300)
link DEPARTAMENTO CONTROLA "1"
link PROYECTO CONTROLA "N" [total]

// Relación recursiva: los roles indican el papel de cada participación
rel SUPERVISA (250, 500)
link EMPLEADO SUPERVISA "1" role:Supervisor
link EMPLEADO SUPERVISA "N" role:Supervisado

// Relación ternaria (tres participantes)
ent PROVEEDOR (1250, 600)
key_att Cif -> PROVEEDOR (1380, 600)
rel SUMINISTRA (1050, 480)
link PROVEEDOR SUMINISTRA "M"
link PROYECTO SUMINISTRA "N"
link DEPARTAMENTO SUMINISTRA "P"
att Cantidad -> SUMINISTRA (1050, 590)

// Especialización total y disjunta, definida por el atributo TipoTrabajo
spec d -> EMPLEADO [TipoTrabajo] (300, 700)
ent SECRETARIA (190, 830)
ent INGENIERO (390, 830)
link d SECRETARIA
link d INGENIERO

// Especialización parcial y solapada (no todo empleado es directivo o sindicalista)
spec o -> EMPLEADO partial (650, 700)
ent DIRECTIVO (560, 830)
ent SINDICALISTA (750, 830)
link o DIRECTIVO
link o SINDICALISTA

// Unión (categoría): un propietario es una persona o una empresa
ent PERSONA (900, 900)
key_att IdPersona -> PERSONA (800, 1000)
ent EMPRESA (1200, 900)
key_att CifEmpresa -> EMPRESA (1300, 1000)
union u (1050, 1000)
link PERSONA u
link EMPRESA u
ent PROPIETARIO (1050, 1120)
link u PROPIETARIO [total]

### Tu Tarea
Genera el código EER Studio para el siguiente problema. Identifica correctamente claves (simples, compuestas y alternativas), claves parciales de entidades débiles, cardinalidades y participación total, roles en relaciones recursivas, relaciones de grado mayor que dos, jerarquías (disjunta/solapada, total/parcial) y uniones. Usa solo la notación que el enunciado justifique. Posiciona siguiendo la guía de espaciado para evitar superposiciones. Usa nombres ≤15 caracteres.

**Problema a modelar:**
[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]`,
  en: `Act as an expert in database design and as a code generator for the "EER Studio" tool. Your task is to analyse a natural-language description of a data requirements problem and turn it into the specific DSL (Domain Specific Language) code that EER Studio uses to draw diagrams.

### EER Studio Syntax Rules:

**IMPORTANT:** Every element (entities, attributes, relationships, hierarchies) can take optional coordinates: \`ELEMENT NAME (x, y)\`
**Length:** Use entity/attribute/relationship names of ≤15 characters so they fit inside the ellipses/rectangles.
**Keywords:** the DSL commands (\`ent\`, \`att\`, \`rel\`, \`link\`, \`spec\`, \`union\`…) are fixed and must NOT be translated. Element names may be in any language.

1) Entities
- Strong: \`ent EMPLOYEE (100, 200)\`
- Weak: \`weak_ent CONTRACT (150, 350)\`

2) Attributes
- Simple: \`att Name -> EMPLOYEE (120, 80)\` (away from the entity)
- Key: \`key_att SSN -> EMPLOYEE (50, 80)\` (several key_att on the same entity form a composite key)
- Alternate key: \`key_att Email -> EMPLOYEE unique (50, 20)\` (UNIQUE NOT NULL, not part of the PK)
- Partial key of a weak entity: \`partial_key_att LineNo -> LINE (150, 420)\`
- Composite: \`att Address -> EMPLOYEE (300, 80)\` and its components \`att Street -> Address (280, 20)\`, \`att Number -> Address (340, 20)\`
- Derived: \`derived_att Age -> EMPLOYEE (190, 80)\`
- Multivalued: \`multivalued_att Phone -> EMPLOYEE (260, 80)\`
- Relationship attribute: \`att Date -> WORKS_IN (250, 120)\` (the arrow points to the relationship). If it is a key (\`key_att\`) in an M:N or n-ary relationship, it becomes part of the PK of the relationship table (e.g. \`key_att Lap -> RACES\`)

3) Relationships
- Regular: \`rel WORKS_IN (250, 200)\` (centred between entities)
- Identifying: \`ident_rel OWNS (200, 350)\` (for a weak entity)

4) Connections
- Syntax: \`link ENTITY RELATIONSHIP "CARDINALITY" [optional:total]\`
- Example: \`link EMPLOYEE WORKS_IN "N" [total]\`
- Role (required in recursive relationships): \`link EMPLOYEE SUPERVISES "1" role:Supervisor\` and \`link EMPLOYEE SUPERVISES "N" role:Supervisee\`
- Ternary relationship: three link lines to the same relationship

5) Hierarchies
- Define a specialization: \`spec TYPE -> SUPERCLASS\` (TYPE: 'd' disjoint, 'o' overlapping)
- Attribute-defined specialization: \`spec d -> EMPLOYEE [JobType]\` (the defining attribute goes in brackets; omit them if the specialization is user-defined)
- Partial specialization (single line): \`spec o -> EMPLOYEE partial\` (without the word it is total, double line)
- Connect subclasses: \`link TYPE SUBCLASS\`

6) Unions (categories)
- Define a union: \`union u\`
- Connect superclasses: \`link SUPERCLASS u\`
- Connect the category: \`link u CATEGORY\`

### 📏 Spacing guide to avoid overlaps
- Attributes in a top row: Y = entity_Y - 130 to -160; max 4 per row; X +100px between attributes; if there are more, open a second top row 40–60px higher and reset X.
- Attributes on the sides/column: use it when there are >6 attributes; put 3–4 on the left (X = entity_X - 130..140) and 3–4 on the right (X = entity_X + 130..140); stagger Y every 70–80px.
- Entities: separate them 320–360px in X and 260–320px in Y; if an entity has many attributes, move it up or down ±80–120px relative to its neighbours to avoid row collisions.
- Relationships: midpoint between entities; leave ≥180px from each entity if there are many edges.

### 📋 Complete example (no overlaps, with the whole notation)
// MAIN ENTITIES in one row (y = 300), ~400px apart
ent EMPLOYEE (450, 300)
ent DEPARTMENT (850, 300)
ent PROJECT (1250, 300)

// EMPLOYEE attributes: key, alternate key, composite, multivalued and derived
key_att Ssn -> EMPLOYEE (300, 160)
key_att Email -> EMPLOYEE unique (400, 160)
att FullName -> EMPLOYEE (510, 160)
att FirstName -> FullName (460, 60)
att LastName -> FullName (570, 60)
multivalued_att Phone -> EMPLOYEE (300, 60)
derived_att Age -> EMPLOYEE (200, 160)

// Weak entity with a partial key and its identifying relationship
weak_ent DEPENDENT (80, 300)
partial_key_att DepName -> DEPENDENT (80, 160)
ident_rel HAS_DEP (265, 300)
link EMPLOYEE HAS_DEP "1"
link DEPENDENT HAS_DEP "N" [total]

// DEPARTMENT and PROJECT attributes
key_att Number -> DEPARTMENT (800, 160)
att DeptName -> DEPARTMENT (910, 160)
key_att ProjCode -> PROJECT (1250, 160)

// 1:N with total participation and a relationship attribute
rel WORKS_IN (650, 300)
link EMPLOYEE WORKS_IN "N" [total]
link DEPARTMENT WORKS_IN "1"
att Hours -> WORKS_IN (650, 190)

// 1:1 (an employee manages a department)
rel MANAGES (650, 460)
link EMPLOYEE MANAGES "1"
link DEPARTMENT MANAGES "1" [total]
att StartDate -> MANAGES (650, 560)

// 1:N between DEPARTMENT and PROJECT
rel CONTROLS (1050, 300)
link DEPARTMENT CONTROLS "1"
link PROJECT CONTROLS "N" [total]

// Recursive relationship: roles state the part played by each participation
rel SUPERVISES (250, 500)
link EMPLOYEE SUPERVISES "1" role:Supervisor
link EMPLOYEE SUPERVISES "N" role:Supervisee

// Ternary relationship (three participants)
ent SUPPLIER (1250, 600)
key_att TaxId -> SUPPLIER (1380, 600)
rel SUPPLIES (1050, 480)
link SUPPLIER SUPPLIES "M"
link PROJECT SUPPLIES "N"
link DEPARTMENT SUPPLIES "P"
att Quantity -> SUPPLIES (1050, 590)

// Total, disjoint specialization defined by the JobType attribute
spec d -> EMPLOYEE [JobType] (300, 700)
ent SECRETARY (190, 830)
ent ENGINEER (390, 830)
link d SECRETARY
link d ENGINEER

// Partial, overlapping specialization (not every employee is a manager or a union rep)
spec o -> EMPLOYEE partial (650, 700)
ent MANAGER (560, 830)
ent UNION_REP (750, 830)
link o MANAGER
link o UNION_REP

// Union (category): an owner is a person or a company
ent PERSON (900, 900)
key_att PersonId -> PERSON (800, 1000)
ent COMPANY (1200, 900)
key_att CompanyId -> COMPANY (1300, 1000)
union u (1050, 1000)
link PERSON u
link COMPANY u
ent OWNER (1050, 1120)
link u OWNER [total]

### Your Task
Generate the EER Studio code for the following problem. Correctly identify keys (simple, composite and alternate), partial keys of weak entities, cardinalities and total participation, roles in recursive relationships, relationships of degree higher than two, hierarchies (disjoint/overlapping, total/partial) and unions. Only use the notation the problem justifies. Position elements following the spacing guide to avoid overlaps. Use names of ≤15 characters.

**Problem to model:**
[PASTE YOUR DATABASE PROBLEM HERE]`,
};

/** Texto completo del prompt en el idioma indicado. */
export function getAIPrompt(lang: Language): string {
  return PROMPTS[lang];
}
