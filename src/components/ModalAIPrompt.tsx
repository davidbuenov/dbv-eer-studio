import { X } from 'lucide-react';
import { useLanguage } from '../i18n/language';

interface ModalAIPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal para mostrar el prompt de IA para generar código EER automáticamente
 * 
 * Proporciona un prompt estructurado que se puede usar con ChatGPT, Claude, Gemini, etc.
 */
export function ModalAIPrompt({ isOpen, onClose }: ModalAIPromptProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const promptText = `Actúa como un experto en diseño de bases de datos y generador de código para la herramienta "EER Studio". Tu tarea es analizar una descripción en lenguaje natural de un problema de requisitos de datos y convertirla en el código DSL (Domain Specific Language) específico que utiliza EER Studio para generar diagramas.

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

3) Relaciones
- Normal: \`rel TRABAJA_EN (250, 200)\` (centrada entre entidades)
- Identificativa: \`ident_rel POSEE (200, 350)\` (para entidad débil)

4) Conexiones
- Sintaxis: \`link ENTIDAD RELACION "CARDINALIDAD" [opcional:total]\`
- Ejemplo: \`link EMPLEADO TRABAJA_EN "N" [total]\`

5) Jerarquías
- Definir especialización: \`spec TIPO -> SUPERCLASE\` (TIPO: 'd' disjunta, 'o' solapada)
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
[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{t('modalAIPrompt.title')}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="overflow-y-auto p-4 text-sm text-slate-700 space-y-4">
          <p className="text-slate-600">
            {t('modalAIPrompt.intro')}
          </p>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('modalAIPrompt.copyLabel')}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(promptText);
                }}
                className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
              >
                {t('modalAIPrompt.copyButton')}
              </button>
            </div>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-200 max-h-96">
{promptText}
            </pre>
            <p className="mt-2 text-[11px] text-slate-400 italic">{t('modalAIPrompt.note')}</p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2">{t('modalAIPrompt.instructionsTitle')}</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside text-slate-700">
              <li>{t('modalAIPrompt.step1')}</li>
              <li>{t('modalAIPrompt.step2')}</li>
              <li>{t('modalAIPrompt.step3.pre')} <code className="bg-white px-1 rounded text-xs">[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]</code> {t('modalAIPrompt.step3.post')}</li>
              <li>{t('modalAIPrompt.step4')}</li>
              <li>{t('modalAIPrompt.step5')}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
