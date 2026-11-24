// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/*
 * Diagrama de referencia con todas las construcciones de la notación de Elmasri y Navathe
 * (§3.11 J). Se muestra en la pestaña "Sintaxis" de la ayuda y lo compila un test
 * (`elmasriReference.test.ts`) de punta a punta: así un hueco de notación aparece aquí antes
 * que en un examen, que es como se descubrieron los de la v1.8.0.
 */
export const ELMASRI_REFERENCE = `// Entidad fuerte: clave (subrayada), clave alternativa (UK),
// atributo compuesto, multivaluado y derivado
ent EMPLEADO (450, 300)
key_att Dni -> EMPLEADO (330, 200)
key_att Email -> EMPLEADO unique (450, 170)
att NombreCompleto -> EMPLEADO (580, 200)
att Nombre -> NombreCompleto (530, 100)
att Apellidos -> NombreCompleto (650, 100)
multivalued_att Telefono -> EMPLEADO (700, 290)
derived_att Edad -> EMPLEADO (690, 370)

// Entidad débil con clave parcial (subrayado discontinuo) y relación identificativa
weak_ent DEPENDIENTE (100, 300)
partial_key_att NombreDep -> DEPENDIENTE (80, 200)
ident_rel TIENE_DEP (260, 300)
link EMPLEADO TIENE_DEP "1"
link DEPENDIENTE TIENE_DEP "N" [total]

// Clave compuesta: un atributo clave con componentes
ent VUELO (900, 120)
key_att CodVuelo -> VUELO (1030, 60)
att NumVuelo -> CodVuelo (980, -20)
att FechaVuelo -> CodVuelo (1100, -20)

// Binarias 1:N y 1:1 con participación total y atributo de relación
ent DEPARTAMENTO (750, 560)
key_att Numero -> DEPARTAMENTO (880, 640)
rel TRABAJA_EN (600, 470)
link EMPLEADO TRABAJA_EN "N" [total]
link DEPARTAMENTO TRABAJA_EN "1"
att FechaInicio -> TRABAJA_EN (600, 560)
rel DIRIGE (750, 420)
link EMPLEADO DIRIGE "1"
link DEPARTAMENTO DIRIGE "1" [total]

// M:N con una entidad de clave compuesta
rel VIAJA (700, 150)
link EMPLEADO VIAJA "N"
link VUELO VIAJA "M"

// Recursiva con roles
rel SUPERVISA (300, 470)
link EMPLEADO SUPERVISA "1" role:Supervisor
link EMPLEADO SUPERVISA "N" role:Supervisado

// Ternaria
ent PROYECTO (1000, 450)
key_att CodProyecto -> PROYECTO (1120, 400)
ent PROVEEDOR (1000, 700)
key_att Cif -> PROVEEDOR (1120, 760)
rel SUMINISTRA (880, 580)
link PROVEEDOR SUMINISTRA "M"
link PROYECTO SUMINISTRA "N"
link DEPARTAMENTO SUMINISTRA "P"
att Cantidad -> SUMINISTRA (880, 680)

// Especialización total y disjunta, definida por atributo
spec d -> EMPLEADO [TipoTrabajo] (450, 640)
ent SECRETARIA (350, 760)
ent INGENIERO (550, 760)
link d SECRETARIA
link d INGENIERO

// Especialización parcial y solapada (línea simple)
spec o -> EMPLEADO partial (200, 560)
ent DIRECTIVO (100, 680)
ent SINDICALISTA (260, 680)
link o DIRECTIVO
link o SINDICALISTA

// Unión (categoría)
ent PERSONA (100, 900)
key_att IdPersona -> PERSONA (40, 980)
ent EMPRESA (300, 900)
key_att CifEmpresa -> EMPRESA (360, 980)
union u (200, 1000)
link PERSONA u
link EMPRESA u
ent PROPIETARIO (200, 1100)
link u PROPIETARIO [total]`;
