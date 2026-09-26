# 📋 Especificaciones: eer-studio

> **Fase:** `/spec` (Especificación)
> **Estado:** Validado (Requisitos ampliados con feedback universitario: Oracle SQL, Ayuda Pedagógica de 9 Pasos, DSL Relacional bidireccional con coordenadas)
> **Última Revisión:** 2026-09-26 (§3.7 — v1.6.0)

---

## 🎯 1. Contexto y Objetivos
- **Problema:** Diseñar diagramas Entidad-Relación Extendido (EER) es el primer paso conceptual en asignaturas de Bases de Datos Universitarias. Los alumnos y profesores necesitan entender pedagógicamente y transformar de forma rigurosa sus modelos EER a **modelos relacionales lógicos** y **código físico SQL DDL (especialmente Oracle SQL)**, además de disponer de edición bidireccional código DSL ↔ canvas tanto para EER como para el Modelo Relacional. `[AMPLIADO]`
- **Objetivo (Éxito):** Una suite docente de modelado de bases de datos 100% cliente que permita:
  1. Diseñar el diagrama EER mediante DSL bidireccional y Canvas interactivo con coordenadas.
  2. Transformar automáticamente el EER a un Modelo Relacional lógico aplicando los 9 pasos formales (`dbv-specs-ops/docs/eer-to-relational-mapping.md`) mostrando una **Ayuda Educativa Guiada / Inspector de Pasos** para alumnos.
  3. Visualizar y editar el Modelo Relacional resultante tanto en Canvas/Diagrama como en su propio **DSL de texto relacional** con soporte de coordenadas.
  4. Exportar el esquema a scripts SQL DDL orientados a **Oracle SQL (dialecto principal universitario)**, además de PostgreSQL, MySQL, SQLite y ANSI SQL.
  5. Generar un diagrama EER conceptual a partir de un modelo relacional (Ingeniería Inversa).
  6. Empaquetar la aplicación en un binario de escritorio nativo con `dbv-tauri-starter` (Tauri v2 + Rust).

## 👥 2. Usuarios y Escenarios
- **Perfil de Usuario:** Estudiantes y profesores de asignaturas de Bases de Datos de la Universidad, ingenieros de datos y desarrolladores.
- **Escenarios Clave:**
  - *Escenario A (EER a Relacional con Ayuda Pedagógica):* El alumno convierte un diagrama EER y abre el panel de ayuda para ver qué regla formal (Pasos 1 al 9) se aplicó en cada tabla y clave foránea.
  - *Escenario B (Edición Bidireccional Texto ↔ Diagrama Relacional):* El alumno o profesor escribe o ajusta el DSL relacional (incluyendo coordenadas de tablas) y el diagrama relacional se actualiza al instante (y viceversa).
  - *Escenario C (Exportación a Oracle SQL):* El alumno genera el script `.sql` listo para ejecutar en el entorno Oracle SQL de la universidad (o PostgreSQL/MySQL/SQLite).
  - *Escenario D (Ingeniería Inversa & Escritorio):* Importación de esquema relacional a EER y ejecución en app nativa de escritorio vía `dbv-tauri-starter`.

## ✨ 3. Funcionalidades Principales (Requisitos)

### 3.1. Mapeo Conceptual a Lógico (EER ➔ Modelo Relacional) & Ayuda Universitaria
- [ ] **Motor de Conversión de 9 Pasos Formales** (`dbv-specs-ops/docs/eer-to-relational-mapping.md`):
  - **Paso 1:** Entidades Fuertes ➔ Tablas + PK.
  - **Paso 2:** Entidades Débiles ➔ PK combinada + FK con `ON DELETE CASCADE` (dependencia existencial; ver política completa en §3.7).
  - **Paso 3:** Relaciones 1:1 Binarias (FK propagada / Mezclada / Cruzada).
  - **Paso 4:** Relaciones 1:N Binarias ➔ Propagación de FK a lado N.
  - **Paso 5:** Relaciones M:N Binarias ➔ Tabla puente de correspondencia.
  - **Paso 6:** Atributos Multivalorados ➔ Tabla independiente.
  - **Paso 7:** Relaciones N-arias ($n > 2$) ➔ Tabla de $N$-vías.
  - **Paso 8:** Especializaciones ➔ Opciones 8A, 8B, 8C, 8D.
  - **Paso 9:** Categorías / Uniones ➔ Caso 9.1 y Caso 9.2.
- [ ] **Modulo de Ayuda Pedagógica e Inspector de 9 Pasos:** Panel/Modal interactivo donde los alumnos ven la justificación teórica de cada paso del algoritmo aplicado a sus entidades.

### 3.2. Editor Bidireccional Texto (DSL) ↔ Canvas del Modelo Relacional
- [ ] **DSL de Texto Relacional con Coordenadas:** Código legible donde se especifican tablas, columnas, PKs, FKs y coordenadas `(x, y)` visuales.
- [ ] **Sincronización Bidireccional Canvas ↔ DSL Relacional:** Arrastrar una tabla en el canvas actualiza sus coordenadas en el DSL relacional; modificar el DSL regenera el esquema visual.

### 3.3. Exportador a Oracle SQL DDL e Ingeniería Inversa
- [ ] **Generador SQL DDL con prioridad en Oracle SQL:** Generación de scripts `.sql` limpios optimizados para Oracle SQL (con `CONSTRAINT`, `VARCHAR2`, `NUMBER`, `CASCADE CONSTRAINTS`), además de PostgreSQL, MySQL, SQLite y ANSI.
- [ ] **Ingeniería Inversa (Relacional ➔ EER):** Conversión automática de esquemas relacionales a diagramas conceptuales EER.

### 3.4. Navegación por Pestañas y Vistas
- [ ] **Navegación Superior por Pestañas:** `[Diagrama EER]` | `[Modelo Relacional]` | `[Vista SQL DDL]` con opción de activar vista dividida (side-by-side).

### 3.5. Compilación, Linter EER y Tolerancia a Fallos (Zero-Crash & Stale-while-error)
- [x] **Compilador y Linter EER**: Validación sintáctica y semántica de dos niveles previa a la propagación a Canvas y Modelo Relacional.
- [x] **Estrategia Stale-while-error:** Conserva congelado el último estado válido del diagrama EER ante errores transitorios.
- [x] **Barra de Diagnósticos Informativa en `CodePanel`:** Indicador inferior visual con icono, severidad y mensaje internacionalizado (ES/EN).
- [x] **Red de Seguridad en Profundidad:** `ErrorBoundary` en React, guardas en `parser.ts` y sanitización segura en `eerToRelational.ts`.

### 3.6. Compilador, Linter y Diagnósticos del Modelo Relacional (DSL Relacional) `[NUEVO]`
- [ ] **Compilador y Linter Relacional (`compileRelationalDSL`)**:
  - **Nivel 1 (Errores Bloqueantes):** Detección de tablas sin nombre (`table `), bloques no cerrados (falta `}`), columnas con sintaxis corrupta, claves foráneas con formato incompleto (`FK -> TABLA` sin columna destino o sin paréntesis) y opciones de cascada no válidas.
  - **Nivel 2 (Advertencias Pedagógicas / Semánticas):** Integridad referencial (FK que apunta a una tabla o columna no declarada), tablas sin clave primaria (`PK`), identificadores de tabla duplicados y columnas duplicadas dentro de una misma tabla.
- [ ] **Estrategia Stale-while-error en Modelo Relacional:**
  - Evitar la desaparición inmediata de tarjetas en el canvas relacional (*visual flickering*) mientras el alumno edita o renombra tablas en el DSL.
  - Retener el último `RelationalSchema` válido hasta que la sintaxis vuelva a compilar correctamente.
- [ ] **Barra de Diagnósticos en `CodePanel` (Pestaña Relacional):**
  - Barra inferior con icono y estado en vivo (`✓ Sintaxis relacional correcta (N tablas, M claves foráneas)` o `⚠️ Línea X: Error explicativo`).
  - Navegación interactiva al hacer clic en el mensaje de error para posicionar el cursor en la línea correspondiente.
- [ ] **Internacionalización:** Soporte completo en español e inglés (`es.ts`/`en.ts`) para todos los diagnósticos del modelo relacional.

### 3.7. Usabilidad del Editor EER y Rigor del Mapeo (v1.6.0) `[NUEVO]`
> Origen: propuestas del colaborador **Enrique Soler Castillo** tras probar la app con un caso real (PILOTO / TRAMO / CIRCULA).

**A. Rigor del mapeo EER ➔ Relacional**
- [ ] **Atributos clave de relación en la PK:** un `key_att` colgado de una relación M:N (Paso 5) o n-aria (Paso 7) forma parte de la PK compuesta de la tabla de relación y es `NOT NULL` (ej. `CIRCULA(PILOTO_ID, TRAMO_ID, VUELTA)`). En relaciones 1:1 / 1:N un atributo clave no tiene sentido formal: se mapea como columna normal y el linter EER emite la advertencia `KEY_ATTRIBUTE_ON_NON_MN_RELATIONSHIP`.
- [ ] **Atributos de relaciones 1:1 (Paso 3):** migran a la tabla que recibe la FK (hoy se perdían).
- [ ] **Política `ON DELETE` según la semántica del paso** (sustituye al `CASCADE` universal):

  | Origen de la FK | `ON DELETE` | Nulabilidad de la FK |
  | --- | --- | --- |
  | Paso 2 (entidad débil), Paso 6 (multivalorado), Paso 8A (subclase) | `CASCADE` — dependencia existencial | `NOT NULL` (forma parte de la PK) |
  | Paso 3 / Paso 4 con participación **parcial** del lado que recibe la FK | `SET NULL` | Nullable |
  | Paso 3 / Paso 4 con participación **total** del lado que recibe la FK | `NO ACTION` — impide borrar el padre con hijos (ej. un departamento con profesores) | `NOT NULL` |
  | Paso 5 (tabla puente M:N) y Paso 7 (n-aria) | `NO ACTION` | `NOT NULL` (forma parte de la PK) |
  | Paso 9 (categoría) | `SET NULL` | Nullable |

- [ ] **Paso 3 (1:1):** la FK se coloca en el lado de participación total (sea el primero o el segundo enlace); si ninguno es total, en el segundo, nullable.
- [ ] **DSL relacional y SQL respetan la acción referencial elegida:** `ON DELETE CASCADE | SET NULL | RESTRICT | NO ACTION` se genera y se parsea en el DSL relacional (omitida ⇒ `NO ACTION`, el valor por defecto del estándar SQL). El SQL la emite en cada dialecto; en **Oracle**, que solo admite `CASCADE` y `SET NULL`, `NO ACTION`/`RESTRICT` se expresan omitiendo la cláusula. Las FK `NOT NULL` que no son PK se marcan `NOT NULL` en el DSL relacional para que la nulabilidad sobreviva al ida-y-vuelta.
- [ ] **Textos pedagógicos corregidos:** la Guía de 9 Pasos, el Inspector y la documentación explican *por qué* cada paso usa su acción referencial, en lugar de presentar `CASCADE` como regla general.

**B. Atributo definidor en especializaciones**
- [ ] **Sintaxis `spec d -> EMPLEADO [TIPO]`:** el nombre entre corchetes declara una especialización **definida por atributo** (Elmasri); sin corchetes es **definida por el usuario** (no hay discriminante). Corchetes vacíos o con un identificador inválido ⇒ error `INVALID_DEFINING_ATTRIBUTE`.
- [ ] **Representación visual:** el atributo definidor se muestra como etiqueta sobre la arista superclase–círculo.
- [ ] **Mapeo (Paso 8A):** si la superclase no declara ya ese atributo, se añade como columna de la tabla de la superclase (traza `STEP8_DEFINING_ATTR`). Sin atributo definidor no se genera columna discriminante.
- [ ] **Formulario visual:** campo opcional *Atributo definidor* al crear/editar una especialización.

**C. Productividad en el canvas EER**
- [ ] **Atributos de relación desde el canvas:** el selector de "elemento propietario" del formulario de atributo incluye relaciones además de entidades.
- [ ] **"Añadir y crear otro":** en el formulario de atributo, un segundo botón inserta el atributo y deja el formulario abierto con la misma entidad y tipo, un nombre nuevo y la posición desplazada +100 px en X.
- [ ] **Anti-solapamiento de atributos:** al crear un atributo en el canvas, si su posición choca con otro nodo, se desplaza +100 px en X hasta encontrar hueco. En el DSL, un atributo pegado con **exactamente las mismas coordenadas** que un nodo anterior se dibuja desplazado +100 px en X (el código no se reescribe hasta que el usuario lo arrastra).
- [ ] **Edición de elementos existentes:** doble clic sobre un nodo (o `F2`/`Enter` con un nodo seleccionado) abre el mismo formulario en modo edición, precargado:
  - Entidad: nombre, fuerte/débil.
  - Atributo: nombre, tipo, elemento propietario.
  - Relación binaria: nombre, identificativa sí/no, entidades, cardinalidades y participación total. Relación n-aria: nombre e identificativa.
  - Especialización: tipo `d`/`o`, superclase, subclases y atributo definidor.
  - Unión: superclases y categoría.
  - Renombrar actualiza todas las referencias en el DSL (`link`, `->`). Las coordenadas se conservan.
- [ ] **Localizar el elemento en el DSL:** al seleccionar un nodo, su línea de declaración (y las líneas `link` que le pertenecen) se resaltan en el editor y este se desplaza hasta ella. El editor de texto deja de ajustar líneas (scroll horizontal) para que el resaltado coincida siempre con la línea.
- [ ] **Selección múltiple:** `Ctrl`/`Cmd` + clic añade o quita nodos de la selección; clic en el fondo del canvas (sin arrastrar) la vacía. Arrastrar un nodo seleccionado mueve todo el grupo. `Supr` elimina todos los nodos seleccionados tras confirmación.
- [ ] **Los atributos siguen a su propietario:** arrastrar una entidad o relación mueve también sus atributos (recursivamente, incluidos los componentes de compuestos). `Alt` + arrastrar mueve solo el nodo. Sustituye al antiguo "Shift + arrastrar".
- [ ] **Navegación y selección por rectángulo (convención draw.io / Office), decidida con el usuario:**

  | Gesto (ratón / touchpad) | Acción |
  | --- | --- |
  | Arrastrar con el botón **izquierdo** en el fondo | Rectángulo de selección: selecciona los nodos que quedan **enteros dentro** (como Word/PowerPoint/Visio). `Ctrl` + rectángulo añade a la selección. Un clic sin arrastrar vacía la selección. |
  | Arrastrar con el botón **derecho** o **central** | Desplazar el lienzo (sin menú contextual del navegador sobre el canvas). |
  | **Rueda** / `Shift` + rueda | Desplazar en vertical / horizontal (el touchpad con dos dedos funciona igual). |
  | `Ctrl` + rueda (o pellizco en touchpad) | Zoom centrado en el cursor, sin ampliar la ventana completa. |

  No se añaden botones de modo Seleccionar/Desplazar: el botón derecho cubre el desplazamiento.

**D. Documentación**
- [ ] Guía de sintaxis integrada, prompt de IA, README (ES/EN) y `eer-to-relational-mapping.md` documentan la sintaxis `[ATRIBUTO]`, la política `ON DELETE` y los nuevos gestos del canvas. Se corrige la guía integrada, que mostraba una sintaxis de atributos (`att DNI [key]`) que el compilador no reconoce.
- [ ] Agradecimiento en el README a **Enrique Soler Castillo** como colaborador por sus propuestas.

**Fuera de alcance de 3.7:** implementar las opciones 8B/8C/8D (el motor solo aplica 8A), deshacer/rehacer y el **soporte táctil** (tablets), planificado para la v1.7.0: hoy el canvas solo escucha eventos de ratón, así que en una tablet se puede tocar para seleccionar pero no arrastrar nodos ni desplazar el lienzo. La v1.7.0 migrará el canvas a Pointer Events (`touch-action: none`) con la convención táctil habitual: un dedo sobre un nodo lo arrastra, un dedo en el fondo desplaza, dos dedos hacen zoom/desplazamiento, mantener pulsado y arrastrar dibuja el rectángulo de selección y doble toque edita.

### 3.8. Centro de Ayuda Unificado (v1.6.0) `[NUEVO]`
> Origen: petición del usuario tras validar §3.7 — la app no tenía una ayuda de uso y los gestos nuevos solo se explicaban en un tooltip de la toolbar.

- [ ] **Un único botón "Ayuda"** en la cabecera (también con `F1`) sustituye a "Guía 9 Pasos", "Sintaxis", "Prompt IA" y "Créditos". Abre un modal con pestañas:
  1. **Uso del editor** (nueva): crear elementos, "Añadir y crear otro", seleccionar (clic, `Ctrl` + clic, rectángulo), editar (doble clic, `F2`/`Enter`), borrar (`Supr`), mover (atributos que siguen, `Alt`), navegar (botón derecho, rueda, `Ctrl` + rueda), código DSL (resaltado, diagnósticos), modelo relacional y exportación, y una **tabla de atajos**.
  2. **Sintaxis**: guía del DSL EER y relacional (subpestañas). Todos sus ejemplos deben compilar sin errores (se corrigen `entity`/`weak_entity`/`relationship`/`identifying_relationship`, que el compilador no reconoce: son `ent`/`weak_ent`/`rel`/`ident_rel`).
  3. **Guía de 9 Pasos**: resumen teórico, con la política `ON DELETE`.
  4. **Prompt IA**: prompt para copiar e instrucciones. El prompt deja de ser solo en español: hay versión ES y EN según el idioma activo.
  5. **Acerca de**: autor, colaboradores (Enrique Soler Castillo), referencia académica, herramientas de IA, versión (leída de `package.json`, no fija en el código) y "Buscar actualizaciones".
- [ ] **Acceso contextual**: el icono 📖 de cada tabla del Modelo Relacional abre la Ayuda en "Guía de 9 Pasos" con esa tabla inspeccionada.
- [ ] **Recuerda la última pestaña** abierta (almacenamiento local, tolerante a que esté bloqueado).
- [ ] **Multiidioma ES/EN completo** en todas las pestañas.
- [ ] **Toolbar más limpia**: se elimina la pista de gestos de la barra (su contenido pasa a "Uso del editor").

## 🏗️ 4. Propuesta de Solución Técnica
- **Modelos de Dominio:** `EERDiagram` (Conceptual) ↔ `RelationalSchema` (Lógico con DSL + Coordenadas) ↔ `SQLScript` (Físico Oracle / Multi-SGBD).
- **Motores:** `eerToRelational` (con trazabilidad pedagógica de 9 pasos), `relationalParser` / `relationalCodeGenerator` (DSL de texto relacional) y `relationalToSQL` (Oracle prioritario).
- **UI:** Pestañas superiores + Modal Inspector Pedagógico de 9 pasos.
- **Interfaz de Usuario:** Control de pestañas/vistas (`EER Editor` | `Relational Editor` | `SQL Preview & Export`).

## 🚫 5. Fuera de Alcance (Out of Scope)
- Persistencia remota en la nube o autenticación (sigue siendo 100% local en cliente).
- Ejecución directa de queries SQL contra bases de datos vivas (la app genera scripts DDL, no es un cliente ejecutor de BD estilo DBeaver).

## 🗺️ 6. Roadmap — Migración a Aplicación de Escritorio con `dbv-tauri-starter`
- **Estrategia:** Una vez construidas y validadas las funciones de conversión EER ↔ Relacional ↔ SQL en la versión web, se procederá a empaquetar la aplicación como **aplicación de escritorio nativa** utilizando el starter kit **`dbv-tauri-starter`** (Tauri v2 + Rust).
- **Ventajas para el usuario:** Ejecución offline nativa, integración directa con el sistema de archivos del SO, menús nativos y binario ligero sin sobrecarga de Chromium.

## ⚠️ 7. Riesgos y Mitigación
- **Riesgo:** Ambigüedad en la selección de opciones de mapeo EER (ej. elegir entre Opción 8A, 8B, 8C u 8D para jerarquías).
  - **Mitigación:** Proporcionar valores por defecto óptimos según la semántica del diagrama (disjunta/solapada, total/parcial) y permitir al usuario personalizar la opción de mapeo por cada jerarquía.

## ❓ 8. Preguntas Abiertas
- [ ] ¿Cómo gestionar los tipos de datos en la conversión EER ➔ Relacional? (Respuesta propuesta: Usar tipos lógicos genéricos `VARCHAR`, `INTEGER`, `BOOLEAN`, `DATE`, `NUMERIC` en EER y traducirlos según el dialecto SQL elegido).

---
**Instrucción para la IA:** No pases a la fase `/plan` de la migración a escritorio hasta que la suite relacional web esté completa.

