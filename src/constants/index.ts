/**
 * Expresión regular para extraer coordenadas (x, y) del código
 */
export const COORD_REGEX = /\(\s*(-?\d+),\s*(-?\d+)\s*\)/;

/**
 * Código de ejemplo que se muestra al iniciar la aplicación
 */
export const SAMPLE_CODE = `// Ejemplo con coordenadas persistentes
// Arrastra los nodos y verás cómo cambian los números (x, y)

// Entidades
ent EMPLEADO (400, 300)
ent DEPARTAMENTO (700, 300)
ent PROYECTO (700, 500)
weak_ent DEPENDIENTE (100, 300)

// Atributos Empleado
key_att Dni -> EMPLEADO (350, 220)
att Nombre -> EMPLEADO (450, 220)
derived_att Edad -> EMPLEADO (400, 180)

// Relaciones
rel TRABAJA_PARA (550, 300)
link EMPLEADO TRABAJA_PARA "N"
link DEPARTAMENTO TRABAJA_PARA "1"

rel CONTROLA (700, 400)
link DEPARTAMENTO CONTROLA "1"
link PROYECTO CONTROLA "N"

// Entidad Débil y Relación Identificativa
ident_rel TIENE_DEP (250, 300)
link EMPLEADO TIENE_DEP "1"
link DEPENDIENTE TIENE_DEP "N" [total]

// Jerarquía (EER Cap 4)
spec d -> EMPLEADO [TipoTrabajo] (400, 420)
ent SECRETARIA (280, 550)
ent INGENIERO (400, 550)
ent TECNICO (520, 550)

link d SECRETARIA
link d INGENIERO
link d TECNICO

// Unión / Categoría
// Para categorías, definimos las superclases primero
ent PERSONA (100, 650)
ent BANCO (300, 650)
ent EMPRESA (500, 650)

union u (300, 750)
link PERSONA u
link BANCO u
link EMPRESA u

ent PROPIETARIO (300, 850)
link u PROPIETARIO [total]
`;

/**
 * Configuración del canvas
 */
export const CANVAS_CONFIG = {
  DEFAULT_SCALE: 0.8,
  CENTER_X: 400,
  CENTER_Y: 300,
  SPIRAL_RADIUS: 250,
  SPIRAL_INCREMENT: 0.6,
  SPIRAL_GROWTH: 15,
} as const;

/**
 * Configuración visual de los nodos
 */
export const NODE_STYLES = {
  STROKE_COLOR: '#334155',
  STROKE_WIDTH: 2,
  FILL_COLOR: '#ffffff',
  TEXT_COLOR: '#0f172a',
} as const;
