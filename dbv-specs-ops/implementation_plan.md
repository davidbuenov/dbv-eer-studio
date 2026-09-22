---
dependencies:
  - "react: ^19.2.0"
  - "lucide-react: ^0.555.0"
risks:
  - "Falsos positivos de integridad referencial si el compilador relacional evalúa claves foráneas hacia tablas declaradas más abajo en el archivo (forward references)."
  - "Desincronización entre el arrastre visual de tablas y el texto del DSL si el DSL se encuentra en estado sintáctico inválido."
rollback_strategy: "Revertir el módulo relationalCompiler.ts y restaurar relationalParser.ts y EERDiagramer.tsx al commit v1.4.1."
---

# Plan de Implementación: Compilador, Linter y Diagnósticos del Modelo Relacional

Implementación del compilador sintáctico y semántico para el DSL de texto del Modelo Relacional (`table NOMBRE { ... }`), con diagnósticos interactivos en `CodePanel`, estrategia de resiliencia *Stale-while-error* (evitando que las tablas desaparezcan del canvas al editar) y advertencias pedagógicas docentes de integridad referencial y claves primarias.

## User Review Required

> [!IMPORTANT]
> - **Compilación multi-pasada para referencias hacia adelante (*forward references*)**:
>   Si una tabla `EMPLEADO` declara `FK -> DEPARTAMENTO(ID)` antes de que `table DEPARTAMENTO` aparezca escrita en el texto, el compilador registrará primero todas las tablas en un pase preliminar para **no emitir falsos positivos** de tabla inexistente.
> - **Resiliencia visual en arrastre**:
>   Si el alumno arrastra una tarjeta relacional en el canvas mientras el DSL contiene un error sintáctico transitorio, la posición se actualiza en memoria sin sobreescribir destructivamente el texto incompleto del alumno.

---

## Adversarial Architect Review

```xml
<architect_review>
  <builder>
    Proponemos crear <code>compileRelationalDSL(code)</code> con un pipeline de validación en dos niveles. Si el alumno borra el nombre de una tabla (ej. <code>table  {</code>) o se olvida de cerrar una llave <code>}</code>, la función marca <code>isValid: false</code> y emite diagnósticos con número de línea. En <code>EERDiagramer.tsx</code>, la vista relacional aplica <strong>Stale-while-error</strong> para mantener las tarjetas en pantalla sin parpadeos, y la barra inferior de <code>CodePanel</code> muestra el error con salto a la línea afectada.
  </builder>
  <adversary>
    Riesgo específico al dominio Relacional:
    1. ¿Qué ocurre con las <strong>referencias cruzadas y hacia adelante</strong> entre tablas? En modelos relacionales es habitual que la tabla <code>PEDIDO</code> esté escrita antes que <code>CLIENTE</code> o que existan relaciones 1:1 reflexivas/cruzadas. Si el linter valida la existencia de <code>TARGET_TABLE</code> línea a línea en una sola pasada, marcará falsos avisos de "tabla inexistente" en tablas perfectamente válidas.
    2. ¿Qué ocurre con las <strong>coordenadas visuales</strong> <code>[x: N, y: N]</code> y el arrastre de tablas? Si el alumno tiene un error de sintaxis en la línea 12 y arrastra la tabla de la línea 1 en el canvas, ¿el evento de arrastre llamará a <code>generateRelationalDSL</code> y borrará el código con error del alumno?
  </adversary>
  <builder>
    Resolución rigurosa:
    1. <strong>Compilación en dos pasadas</strong>: El Pase 1 analiza las cabeceras de todas las tablas (<code>table NOMBRE [x, y] {</code>) y cataloga todos los nombres de tabla y sus columnas. El Pase 2 valida las columnas, tipos y resuelve las restricciones de clave ajena (<code>foreignKeys</code>), comprobando que la tabla y columna destino existan. Esto elimina el 100% de falsos positivos por orden de declaración.
    2. <strong>Blindaje del generador de DSL en arrastre</strong>: Si <code>isRelationalValid === false</code>, el arrastre de tarjetas en el canvas actualiza la posición visual local en <code>relationalPositions</code>, pero <strong>no</strong> regenera el texto del DSL hasta que el alumno corrija los errores de sintaxis, protegiendo su texto en edición.
  </builder>
</architect_review>
```

---

## Proposed Changes

### 1. Capa de Tipos

#### [MODIFY] [compiler.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/types/compiler.ts)
- Ampliar `DiagnosticCode` con los códigos del DSL relacional:
  - `'MISSING_TABLE_NAME'`
  - `'UNCLOSED_TABLE_BLOCK'`
  - `'INVALID_COLUMN_DEFINITION'`
  - `'INVALID_FOREIGN_KEY_SYNTAX'`
  - `'UNDECLARED_TARGET_TABLE'`
  - `'UNDECLARED_TARGET_COLUMN'`
  - `'TABLE_WITHOUT_PK'`
  - `'DUPLICATE_TABLE_NAME'`
  - `'DUPLICATE_COLUMN_NAME'`
- Crear interfaz `CompileRelationalResult`:
  ```ts
  export interface CompileRelationalResult {
    isValid: boolean;
    schema: RelationalSchema;
    diagnostics: Diagnostic[];
  }
  ```

---

### 2. Motor de Compilación del DSL Relacional

#### [NEW] [relationalCompiler.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/utils/relational/relationalCompiler.ts)
- Función `compileRelationalDSL(code: string): CompileRelationalResult`:
  - **Pase 1 (Indexación de Tablas)**:
    - Detecta `table NOMBRE [x: N, y: N] {`.
    - Error si falta el nombre de tabla o si no abre llave.
    - Warning si el nombre de tabla está duplicado.
  - **Pase 2 (Análisis de Contenido de Tablas)**:
    - Valida cada columna: `NOMBRE TIPO [PK] [NOT NULL] [FK -> TABLA(COL)] [ON DELETE ...]`.
    - Detecta error si la sintaxis de `FK` está rota (ej: falta tabla destino, faltan paréntesis de columna o formato inválido).
    - Valida cierre de bloques: si el archivo termina sin `}`, emite error bloqueante `UNCLOSED_TABLE_BLOCK` en la línea de inicio de la tabla.
  - **Pase 3 (Linter Semántico e Integridad Referencial)**:
    - Valida que la tabla destino referenciada en cada FK exista en el esquema.
    - Valida que la columna destino exista dentro de la tabla destino.
    - Emite warning si una tabla no tiene ninguna columna `PK`.
    - Emite warning si hay columnas con nombres duplicados dentro de la misma tabla.
  - Retorna `{ isValid, schema, diagnostics }`.

#### [MODIFY] [relationalParser.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/utils/relational/relationalParser.ts)
- Hacer que `parseRelationalDSL(code)` delegue en `compileRelationalDSL(code).schema`.

---

### 3. Internacionalización (ES / EN)

#### [MODIFY] [es.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/i18n/es.ts) & [en.ts](file:///d:/Programacion/github-davidbuenov/eer-studio/src/i18n/en.ts)
- Nuevas claves para diagnósticos relacionales:
  - `compiler.relationalValid`: "Sintaxis relacional correcta" / "Relational syntax valid"
  - `compiler.tablesAndFKs`: "{{tables}} tablas, {{fks}} claves foráneas" / "{{tables}} tables, {{fks}} foreign keys"
  - `compiler.missingTableName`: "Se esperaba el nombre de la tabla tras 'table' (ej: table CLIENTE {)" / "Expected table name after 'table' (e.g. table CUSTOMER {)"
  - `compiler.unclosedTableBlock`: "La tabla '{{name}}' no tiene llave de cierre '}'" / "Table '{{name}}' is missing closing bracket '}'"
  - `compiler.invalidFKSyntax`: "Sintaxis de clave foránea inválida (formato esperado: FK -> TABLA(COLUMNA))" / "Invalid foreign key syntax (expected format: FK -> TABLE(COLUMN))"
  - `compiler.undeclaredTargetTable`: "La tabla '{{table}}' referenciada en la clave foránea no existe" / "Target table '{{table}}' referenced in foreign key does not exist"
  - `compiler.undeclaredTargetColumn`: "La columna '{{col}}' no existe en la tabla destino '{{table}}'" / "Target column '{{col}}' does not exist in table '{{table}}'"
  - `compiler.tableWithoutPK`: "La tabla '{{name}}' no tiene ninguna clave primaria (PK)" / "Table '{{name}}' has no primary key (PK)"
  - `compiler.duplicateTableName`: "El nombre de tabla '{{name}}' ya está declarado" / "Table name '{{name}}' has already been declared"
  - `compiler.duplicateColumnName`: "La columna '{{col}}' ya existe en la tabla '{{table}}'" / "Column '{{col}}' already exists in table '{{table}}'"

---

### 4. Integración en UI y Tolerancia a Fallos (EERDiagramer.tsx)

#### [MODIFY] [EERDiagramer.tsx](file:///d:/Programacion/github-davidbuenov/eer-studio/src/EERDiagramer.tsx)
- Estado de diagnósticos relacionales:
  - `relationalDiagnostics: Diagnostic[]`
  - `isRelationalValid: boolean`
  - `lastValidRelationalSchemaRef`
- En `handleRelationalCodeChange`:
  - Ejecutar `compileRelationalDSL(newDSL)`.
  - Si `result.isValid`: actualizar `relationalSchema` y guardar en `lastValidRelationalSchemaRef`.
  - Si `!result.isValid`: retener el último esquema válido en pantalla para evitar que desaparezcan las tablas.
- En la pestaña `activeTab === 'relational'`:
  - Pasar a `<CodePanel />`:
    - `diagnostics={relationalDiagnostics}`
    - `isValid={isRelationalValid}`
    - `elementCount={{ entities: relationalSchema.tables.length, relations: totalForeignKeys }}`

---

## Verification Plan

### Automated Tests
- Ejecutar tests existentes y nuevos:
  ```bash
  npm test
  ```
- Crear fichero `src/utils/relational/relationalCompiler.test.ts`:
  - Test 1: Tabla sin nombre (`table {`) detecta error bloqueante.
  - Test 2: Bloque sin llave de cierre `}` detecta `UNCLOSED_TABLE_BLOCK`.
  - Test 3: Sintaxis de FK rota (`FK -> TABLA`) sin paréntesis detecta `INVALID_FOREIGN_KEY_SYNTAX`.
  - Test 4: Referencia hacia adelante (*forward reference*) entre dos tablas válidas no emite falsos positivos.
  - Test 5: FK hacia tabla no existente emite advertencia `UNDECLARED_TARGET_TABLE`.
  - Test 6: Tabla sin PK emite advertencia `TABLE_WITHOUT_PK`.
  - Test 7: Código válido devuelve `isValid: true` y genera el esquema relacional con tablas, columnas y FKs correctas.

### Manual Verification
1. Arrancar `npm run dev` y abrir `http://localhost:5173/`.
2. Ir a la pestaña **Modelo Relacional**.
3. Verificar que la barra inferior muestra: `✓ Sintaxis relacional correcta (N tablas, M claves foráneas)`.
4. En el editor de texto relacional, borrar el nombre de una tabla (ej: cambiar `table EMPLEADO {` por `table  {`):
   - Verificar que la tarjeta de la tabla **no desaparece** del canvas (Stale-while-error).
   - Verificar que la barra inferior muestra en rojo: `⚠️ Línea X: Se esperaba el nombre de la tabla tras 'table'`.
   - Clic en la barra para comprobar que selecciona la línea del error.
5. Restaurar el nombre y escribir una FK inválida (`FK -> INVENTADA(ID)`):
   - Verificar que la barra muestra el aviso en ámbar/amarillo sobre la tabla inexistente.
6. Cambiar el idioma a English y verificar que todos los diagnósticos se leen correctamente en inglés.
