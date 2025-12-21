import { X } from 'lucide-react';

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
  if (!isOpen) return null;

  const promptText = `Actúa como un experto en diseño de bases de datos y generador de código para la herramienta "EER Studio". Tu tarea es analizar una descripción en lenguaje natural de un problema de requisitos de datos y convertirla en el código DSL (Domain Specific Language) específico que utiliza EER Studio para generar diagramas.

### Reglas de Sintaxis de EER Studio:

1. **Entidades:**
   - Fuertes: \`ent NOMBRE_ENTIDAD\`
   - Débiles: \`weak_ent NOMBRE_ENTIDAD\`
   - (Opcional) Puedes añadir coordenadas: \`ent USUARIO (100, 200)\`

2. **Atributos:**
   - Simple: \`att NombreAtributo -> ENTIDAD\`
   - Clave (identificador): \`key_att NombreAtributo -> ENTIDAD\`
   - Derivado: \`derived_att NombreAtributo -> ENTIDAD\`
   - Multivaluado: \`multivalued_att NombreAtributo -> ENTIDAD\`

3. **Relaciones:**
   - Normal: \`rel NOMBRE_RELACION\`
   - Identificativa (para entidades débiles): \`ident_rel NOMBRE_RELACION\`

4. **Conexiones (Links) y Cardinalidad:**
   - Sintaxis: \`link ENTIDAD RELACION "CARDINALIDAD"\`
   - Cardinalidades: "1", "N", "M"
   - Participación Total: \`link EMPLEADO TRABAJA_EN "N" [total]\`

5. **Jerarquías (Especialización/Generalización):**
   - Definir especialización: \`spec TIPO -> SUPERCLASE\`
     - TIPO: 'd' (disjunta) o 'o' (solapada)
   - Conectar subclases: \`link TIPO SUBCLASE\`
   - Ejemplo:
     \`\`\`
     spec d -> EMPLEADO
     link d SECRETARIA
     link d INGENIERO
     \`\`\`

6. **Uniones (Categorías):**
   - Definir unión: \`union u\`
   - Conectar superclases: \`link SUPERCLASE u\`
   - Conectar categoría: \`link u CATEGORIA\`

### Ejemplo:

**Input:** "Un empleado trabaja en un departamento. El empleado tiene DNI (clave) y Nombre. El departamento tiene un Nombre."

**Output:**
\`\`\`
// Entidades
ent EMPLEADO
ent DEPARTAMENTO

// Atributos
key_att DNI -> EMPLEADO
att Nombre -> EMPLEADO
att Nombre -> DEPARTAMENTO

// Relaciones
rel TRABAJA_EN
link EMPLEADO TRABAJA_EN "N" [total]
link DEPARTAMENTO TRABAJA_EN "1"
\`\`\`

### Tu Tarea:

Genera el código EER Studio para el siguiente problema. Identifica correctamente claves, cardinalidades, jerarquías y entidades débiles. Puedes sugerir coordenadas aproximadas para evitar superposiciones.

**Problema a modelar:**
[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">🤖 Prompt para tu IA</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="overflow-y-auto p-4 text-sm text-slate-700 space-y-4">
          <p className="text-slate-600">
            Usa este prompt con <strong>ChatGPT, Claude, Gemini</strong> u otra IA para generar código EER automáticamente.
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Copiar este prompt</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(promptText);
                }}
                className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
              >
                Copiar
              </button>
            </div>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-200 max-h-96">
{promptText}
            </pre>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2">📋 Instrucciones:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside text-slate-700">
              <li>Haz clic en "Copiar" para copiar el prompt</li>
              <li>Pégalo en ChatGPT, Claude, Gemini o tu IA favorita</li>
              <li>Reemplaza <code className="bg-white px-1 rounded text-xs">[AQUÍ PEGA TU PROBLEMA DE BASE DE DATOS]</code> con tu enunciado</li>
              <li>Copia el código generado por la IA</li>
              <li>Pégalo en el panel izquierdo de EER Studio</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
