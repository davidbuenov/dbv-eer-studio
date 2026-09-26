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
- Clave: \`key_att DNI -> EMPLEADO (50, 80)\`
- Derivado: \`derived_att Edad -> EMPLEADO (190, 80)\`
- Multivaluado: \`multivalued_att Telefono -> EMPLEADO (260, 80)\`
- De relación: \`att Fecha -> TRABAJA_EN (250, 120)\` (la flecha apunta a la relación). Si es clave (\`key_att\`) en una relación M:N o n-aria, forma parte de la PK de la tabla de la relación (ej. \`key_att Vuelta -> CIRCULA\`)

3) Relaciones
- Normal: \`rel TRABAJA_EN (250, 200)\` (centrada entre entidades)
- Identificativa: \`ident_rel POSEE (200, 350)\` (para entidad débil)

4) Conexiones
- Sintaxis: \`link ENTIDAD RELACION "CARDINALIDAD" [opcional:total]\`
- Ejemplo: \`link EMPLEADO TRABAJA_EN "N" [total]\`

5) Jerarquías
- Definir especialización: \`spec TIPO -> SUPERCLASE\` (TIPO: 'd' disjunta, 'o' solapada)
- Especialización definida por atributo: \`spec d -> EMPLEADO [TipoTrabajo]\` (el atributo definidor va entre corchetes; omítelos si la especialización es definida por el usuario)
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

### 📋 Ejemplo completo (sin solapes)
ent EMPLEADO (100, 200)
ent DEPARTAMENTO (450, 200)

// Atributos ARRIBA de EMPLEADO, espaciados cada 100px
key_att DNI -> EMPLEADO (0, 60)
att Nombre -> EMPLEADO (100, 60)
att Puesto -> EMPLEADO (200, 60)
att Salario -> EMPLEADO (300, 60)

// Atributos de DEPARTAMENTO
att NombreDept -> DEPARTAMENTO (400, 60)
att Ubicacion -> DEPARTAMENTO (500, 60)

// Relación centrada entre las dos entidades
rel TRABAJA_EN (275, 200)

link EMPLEADO TRABAJA_EN "N" [total]
link DEPARTAMENTO TRABAJA_EN "1"

### Tu Tarea
Genera el código EER Studio para el siguiente problema. Identifica correctamente claves, cardinalidades, jerarquías y entidades débiles. Posiciona siguiendo la guía de espaciado para evitar superposiciones. Usa nombres ≤15 caracteres.

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
- Key: \`key_att SSN -> EMPLOYEE (50, 80)\`
- Derived: \`derived_att Age -> EMPLOYEE (190, 80)\`
- Multivalued: \`multivalued_att Phone -> EMPLOYEE (260, 80)\`
- Relationship attribute: \`att Date -> WORKS_IN (250, 120)\` (the arrow points to the relationship). If it is a key (\`key_att\`) in an M:N or n-ary relationship, it becomes part of the PK of the relationship table (e.g. \`key_att Lap -> RACES\`)

3) Relationships
- Regular: \`rel WORKS_IN (250, 200)\` (centred between entities)
- Identifying: \`ident_rel OWNS (200, 350)\` (for a weak entity)

4) Connections
- Syntax: \`link ENTITY RELATIONSHIP "CARDINALITY" [optional:total]\`
- Example: \`link EMPLOYEE WORKS_IN "N" [total]\`

5) Hierarchies
- Define a specialization: \`spec TYPE -> SUPERCLASS\` (TYPE: 'd' disjoint, 'o' overlapping)
- Attribute-defined specialization: \`spec d -> EMPLOYEE [JobType]\` (the defining attribute goes in brackets; omit them if the specialization is user-defined)
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

### 📋 Complete example (no overlaps)
ent EMPLOYEE (100, 200)
ent DEPARTMENT (450, 200)

// Attributes ABOVE EMPLOYEE, spaced every 100px
key_att SSN -> EMPLOYEE (0, 60)
att Name -> EMPLOYEE (100, 60)
att Position -> EMPLOYEE (200, 60)
att Salary -> EMPLOYEE (300, 60)

// DEPARTMENT attributes
att DeptName -> DEPARTMENT (400, 60)
att Location -> DEPARTMENT (500, 60)

// Relationship centred between both entities
rel WORKS_IN (275, 200)

link EMPLOYEE WORKS_IN "N" [total]
link DEPARTMENT WORKS_IN "1"

### Your Task
Generate the EER Studio code for the following problem. Correctly identify keys, cardinalities, hierarchies and weak entities. Position elements following the spacing guide to avoid overlaps. Use names of ≤15 characters.

**Problem to model:**
[PASTE YOUR DATABASE PROBLEM HERE]`,
};

/** Texto completo del prompt en el idioma indicado. */
export function getAIPrompt(lang: Language): string {
  return PROMPTS[lang];
}
