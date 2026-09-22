---
dependencies:
  - "react: ^19.2.0"
  - "lucide-react: ^0.555.0"
risks:
  - "Divergencia entre la generación bidireccional de código desde el canvas y las reglas del compilador EER."
  - "Retención de estado obsoleto en Stale-while-error si un error sintáctico oculta un cambio semántico intencionado."
rollback_strategy: "Revertir los commits del branch o restaurar parser.ts y useEERParser.ts al commit previo a la introducción del compilador."
---

# Plan de Implementación: Compilador EER, Tolerancia a Fallos y Red de Seguridad Zero-Crash

Implementación de un compilador y linter de dos niveles para el DSL EER, con estrategia de resiliencia *Stale-while-error*, barra de estado y diagnósticos pedagógicos en `CodePanel`, defensas contra datos indefinidos en `parser.ts` y `eerToRelational.ts`, y `ErrorBoundary` global en React.

## User Review Required

> [!IMPORTANT]
> - **Estrategia Stale-while-error**: Mientras haya errores de sintaxis bloqueantes en el editor (ej. al escribir `ent ` o borrar un nombre), el Canvas EER y el Modelo Relacional conservarán en pantalla el último diagrama válido.
> - **Internacionalización**: Todos los mensajes pedagógicos del compilador (`error` y `warning`) dispondrán de soporte bilingüe en español e inglés (`src/i18n/es.ts`, `src/i18n/en.ts`).

---

## Adversarial Architect Review

```xml
<architect_review>
  <builder>
    Proponemos desacoplar la validación léxica/sintáctica del cálculo visual y relacional creando un módulo <code>compileEER(code)</code>. Si la compilación falla (por ejemplo, al dejar una <code>entity</code> sin nombre), el hook <code>useEERParser</code> congela los <code>nodes</code> y <code>links</code> en su último estado válido, mientras que la barra inferior de <code>CodePanel</code> notifica el error exacto con el número de línea. Adicionalmente, blindamos <code>eerToRelational</code> con defensas nulas en <code>sanitizeName</code> e instalamos un <code>ErrorBoundary</code> en React.
  </builder>
  <adversary>
    Riesgo específico al dominio EER: ¿Qué ocurre si el usuario tiene un diagrama con <code>identifying_relationship</code> y <code>weak_entity</code>, pero mientras edita deja el <code>link</code> a medias o renombra la entidad fuerte propietaria? Si el linter clasifica ese enlace roto solo como un <code>warning</code> semántico y permite la regeneración, <code>eerToRelational</code> en su Paso 2 intentará resolver el propietario de la entidad débil mediante <code>getNeighborNodeIds</code>, no encontrará ninguna tabla propietaria y podría generar una PK incompleta o una tabla puente espuria. Además, si el usuario borra por completo el texto del editor para empezar de cero, ¿la política Stale-while-error impedirá que el canvas se limpie porque un archivo vacío o una línea en blanco se interprete como estado no válido?
  </adversary>
  <builder>
    Resolución rigurosa:
    1. Un documento vacío o compuesto solo por comentarios y espacios en blanco es formalmente <strong>válido</strong> (emite 0 nodos, 0 enlaces y 0 errores). En ese caso, la política Stale-while-error no retiene nada y limpia el canvas inmediatamente como se espera.
    2. El Paso 2 de <code>eerToRelational</code> ya dispone de defensas contra entidades débiles huérfanas documentadas en la Fase 3 previa. No obstante, para enlaces rotos, el linter advertirá al alumno: <em>"El enlace hace referencia a un nodo no declarado"</em>, y en el motor de compilación, los enlaces que apunten a nodos inexistentes se descartarán del grafo de <code>links</code> activos hasta que ambos extremos existan.
    3. Para evitar cualquier excepción en <code>eerToRelational</code>, <code>sanitizeName</code> devolverá <code>_SIN_NOMBRE</code> si recibe un valor nulo o vacío, y cualquier acceso a propiedades de nodos se protegerá con optional chaining.
  </builder>
</architect_review>
```

---

## Proposed Changes

### 1. Capa de Tipos y Diagnósticos

#### [NEW] [compiler.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/types/compiler.ts)
- Definición de tipos:
  - `DiagnosticSeverity = 'error' | 'warning' | 'info'`
  - `DiagnosticCode`: códigos formales tipados (ej: `MISSING_NODE_NAME`, `INCOMPLETE_ARROW`, `INCOMPLETE_LINK`, `UNKNOWN_COMMAND`, `UNDECLARED_NODE_REFERENCE`, etc.).
  - `Diagnostic`: `{ line: number; column?: number; severity: DiagnosticSeverity; code: DiagnosticCode; messageKey: string; params?: Record<string, string | number>; rawMessage?: string }`.
  - `CompileResult`: `{ isValid: boolean; nodes: NodeData[]; links: LinkData[]; diagnostics: Diagnostic[] }`.

---

### 2. Motor de Compilación y Validación

#### [NEW] [compiler.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/utils/compiler.ts)
- Función `compileEER(code: string): CompileResult`:
  - Análisis línea a línea con índice 1-indexed para el usuario.
  - Comprobaciones sintácticas bloqueantes (`severity: 'error'`):
    - Comandos de nodo sin nombre (`ent`, `weak_ent`, `rel`, `ident_rel`, `att`, `key_att`, `derived_att`, `multivalued_attribute`, `multivalued_att`).
    - Atributos con flecha sin entidad padre (`att Nombre ->`).
    - Enlaces incompletos (`link`, `link Origen`).
    - Coordenadas no numéricas o mal cerradas.
  - Comprobaciones semánticas (`severity: 'warning'`):
    - Enlace a un nodo que no ha sido declarado.
    - Identificador de entidad/relación duplicado.
  - Solo construye y devuelve `NodeData` si el nombre es válido (garantiza `id` y `label` definidos y no vacíos).
  - Descarta enlaces hacia nodos inexistentes para evitar alimentar enlaces huérfanos a `eerToRelational`.

---

### 3. Red de Seguridad Defensiva en Motores Existentes

#### [MODIFY] [parser.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/utils/parser.ts)
- Agregar guardas defensivas en `parseCode`: si `parts[1]` es falsy, no generar el nodo ni inyectar `id: undefined`.

#### [MODIFY] [eerToRelational.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/utils/relational/eerToRelational.ts)
- Modificar `sanitizeName(name?: string)` para que compruebe `if (!name || typeof name !== 'string') return '_SIN_NOMBRE';`.
- Envolver la ejecución del transformador en salvaguardas para garantizar que nunca lance una excepción al exterior.

---

### 4. Hook React con Tolerancia a Fallos (Stale-while-error)

#### [MODIFY] [useEERParser.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/hooks/useEERParser.ts)
- Integrar `compileEER(code)`.
- Manejar referencias a `lastValidNodesRef` y `lastValidLinksRef`.
- Si `isValid === true`: actualizar nodos, enlaces y los refs del último estado válido.
- Si `isValid === false` y hay errores bloqueantes: retener `lastValidNodesRef.current` y `lastValidLinksRef.current` para que el Canvas y el Modelo Relacional sigan renderizando sin mutar bruscamente.
- Exponer `{ nodes, links, setNodes, diagnostics, isValid }`.

---

### 5. Límite de Errores React y Preservación de Estado

#### [NEW] [ErrorBoundary.tsx](file:///d:/Programacion/github-davidbuenov/eer-studio/src/components/ErrorBoundary.tsx)
- Componente de clase React `ErrorBoundary` con métodos `getDerivedStateFromError` y `componentDidCatch`.
- En caso de error inesperado:
  - Muestra una pantalla amigable de rescate (sin perder el trabajo del alumno).
  - Guarda automáticamente el contenido del editor en `localStorage` (`eer_studio_emergency_backup`).
  - Proporciona botones para "Copiar código DSL al portapapeles", "Recargar aplicación" o "Restaurar estado anterior".

#### [MODIFY] [App.tsx](file:///d:/Programacion/github-davidbuenov/eer-studio/src/App.tsx)
- Envolver `<EERDiagrammer />` con `<ErrorBoundary>`.

---

### 6. Interfaz de Usuario: Barra de Diagnósticos en `CodePanel`

#### [MODIFY] [CodePanel.tsx](file:///d:/Programacion/github-davidbuenov/eer-studio/src/components/CodePanel.tsx)
- Añadir sección inferior (footer bar):
  - Estado OK: icono verde de verificación (`CheckCircle2`), texto: `Sintaxis correcta (N entidades, M relaciones)`.
  - Estado Error: icono ámbar/rojo (`AlertTriangle` / `AlertCircle`), texto: `Línea {line}: {message}`.
  - Clic en el diagnóstico: colocar el cursor del textarea en la línea del error o seleccionarla.
- Soporte para recibir `diagnostics: Diagnostic[]` y `isValid: boolean` desde `EERDiagramer.tsx`.

#### [MODIFY] [EERDiagramer.tsx](file:///d:/Programacion/github-davidbuenov/eer-studio/src/EERDiagramer.tsx)
- Conectar `diagnostics` y `isValid` de `useEERParser` con `CodePanel`.
- Envolver la sincronización de `eerToRelational` en un bloque `try/catch` defensivo.

---

### 7. Internacionalización (ES / EN)

#### [MODIFY] [es.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/i18n/es.ts) & [en.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/i18n/en.ts)
- Claves de mensajes del compilador:
  - `compiler.valid`: "Sintaxis correcta" / "Syntax valid"
  - `compiler.entitiesAndRelations`: "{entities} entidades, {relations} relaciones" / "{entities} entities, {relations} relationships"
  - `compiler.missingEntityName`: "Se esperaba el nombre de la entidad tras '{command}' (ej: {command} CLIENTE)" / "Expected entity name after '{command}' (e.g. {command} CUSTOMER)"
  - `compiler.missingRelationshipName`: "Se esperaba el nombre de la relación tras '{command}' (ej: {command} COMPRA)" / "Expected relationship name after '{command}' (e.g. {command} PURCHASES)"
  - `compiler.missingAttributeName`: "Se esperaba el nombre del atributo tras '{command}'" / "Expected attribute name after '{command}'"
  - `compiler.incompleteAttributeArrow`: "Falta la entidad padre tras '->' (ej: att {name} -> ENTIDAD)" / "Missing parent entity after '->' (e.g. att {name} -> ENTITY)"
  - `compiler.incompleteLink`: "Falta el nodo origen o destino en el enlace (ej: link ENTIDAD RELACION)" / "Missing source or target node in link (e.g. link ENTITY RELATION)"
  - `compiler.unknownCommand`: "Comando '{command}' no reconocido" / "Unrecognized command '{command}'"
  - `compiler.undeclaredReference`: "El nodo '{name}' referenciado en el enlace no está declarado" / "Node '{name}' referenced in link is not declared"
  - `compiler.duplicateNode`: "El identificador '{name}' ya ha sido declarado" / "Identifier '{name}' has already been declared"

---

## Verification Plan

### Automated Tests
- Ejecutar suite de pruebas con Vitest:
  ```bash
  npm test
  ```
- Crear fichero de tests unitarios: `src/utils/compiler.test.ts`:
  - Prueba 1: Código con entidad sin nombre (`ent ` o `ent`) genera `isValid: false`, diagnóstico en la línea correspondiente y ningún nodo con `id: undefined`.
  - Prueba 2: Atributo sin padre (`att DNI ->`) genera error en esa línea.
  - Prueba 3: Enlace con solo un argumento (`link EMPLEADO`) genera error.
  - Prueba 4: Código válido devuelve `isValid: true` y genera la lista correcta de nodos y enlaces.
  - Prueba 5: Documento vacío devuelve `isValid: true` con 0 nodos y 0 errores.
  - Prueba 6: `sanitizeName` maneja `undefined`, `""`, `null` y cadenas raras sin lanzar excepciones.

### Manual Verification
1. Arrancar dev server: `npm run dev`.
2. En el editor de texto, borrar el nombre de una entidad existente (ej. dejar `ent `):
   - Verificar que la aplicación **no se reinicia**.
   - Verificar que en el pie de `CodePanel` aparece el mensaje: `⚠️ Línea X: Se esperaba el nombre de la entidad tras 'ent'`.
   - Verificar que el Canvas y el Modelo Relacional conservan la vista anterior sin parpadear ni romperse.
3. Escribir un nuevo nombre de entidad (ej: `ent PROVEEDOR`):
   - Verificar que el error desaparece de inmediato y se muestra `✓ Sintaxis correcta`.
   - Verificar que el Canvas y el Modelo Relacional se actualizan con la nueva entidad.
4. Cambiar de idioma a English:
   - Verificar que los mensajes de error y la barra se muestran en inglés correctamente.
