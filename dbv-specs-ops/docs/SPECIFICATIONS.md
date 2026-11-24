# 📋 Especificaciones: eer-studio

> **Fase:** `/spec` (Especificación)
> **Estado:** Validado (Requisitos ampliados con feedback universitario: Oracle SQL, Ayuda Pedagógica de 9 Pasos, DSL Relacional bidireccional con coordenadas)
> **Última Revisión:** 2026-11-24 (§3.11 — v1.8.0)

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

**Fuera de alcance de 3.7:** implementar las opciones 8B/8C/8D (el motor solo aplica 8A), deshacer/rehacer (llega en la v1.8.0, §3.11 H) y el **soporte táctil** (tablets), replanificado para la **v1.9.0** (2026-11-24; en el texto original de esta sección, "v1.7.0"): hoy el canvas solo escucha eventos de ratón, así que en una tablet se puede tocar para seleccionar pero no arrastrar nodos ni desplazar el lienzo. La v1.7.0 migrará el canvas a Pointer Events (`touch-action: none`) con la convención táctil habitual: un dedo sobre un nodo lo arrastra, un dedo en el fondo desplaza, dos dedos hacen zoom/desplazamiento, mantener pulsado y arrastrar dibuja el rectángulo de selección y doble toque edita.

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

### 3.9. Retirada del Auto-actualizador (v1.7.0)
> Decisión del autor (2026-09-26), consecuencia de distribuir Windows solo por Microsoft Store.

- [x] **Sin botón "Buscar actualizaciones"** en ninguna plataforma: en Windows actualiza la Store, en la web no aplica y en Linux/macOS nunca funcionó (ninguna release incluía `latest.json`). Las nuevas versiones de Linux/macOS se descargan desde GitHub Releases.
- [x] **Se retiran `tauri-plugin-updater` y `tauri-plugin-process`** (Rust, npm, permisos `updater:default`/`process:allow-restart` y bloque `plugins.updater` de `tauri.conf.json`, incluida la clave pública).
- [x] Se mantiene en *Ayuda → Acerca de* el aviso "Instalada desde Microsoft Store — las actualizaciones son automáticas" (`is_packaged_app()`).

### 3.10. Edición Moodle para Exámenes EER (variante independiente, v1.7.0) `[NUEVO]`
> Decisión del autor (2026-11-13). Examen de modelado EER en el Moodle 5 de la universidad, en aula **sin internet** (solo llega Moodle) y, si es posible, con **Safe Exam Browser (SEB)**.

**A. Principio de no regresión**
- [x] La edición actual (web, Windows/Store, Linux, macOS) **no cambia**: la variante Moodle es otro punto de entrada y otro comando de compilación (`npm run build:moodle`), con su salida en una carpeta propia. Los builds y tests actuales siguen igual.

**B. Alcance funcional (solo EER)**
- [x] Editor EER completo: DSL bidireccional, canvas, linter y diagnósticos, propiedades, selección múltiple.
- [x] **Sin** Modelo Relacional, SQL DDL, ingeniería inversa, prompt de IA, abrir/guardar ficheros locales ni enlaces externos.
- [x] **Ayuda se mantiene** (*Uso del editor* y *Sintaxis* con ejemplos). Se retiran las pestañas ajenas al examen: guía de 9 pasos (relacional), prompt de IA y *Acerca de* (sus enlaces externos no funcionan sin internet y en SEB sacarían al alumno del examen); la versión se muestra en la barra del examen.
- [x] **Plantilla de partida opcional:** el profesor indica un fichero `.eer` al compilar (`npm run build:moodle -- --template examen.eer`) y el paquete arranca con ese contenido; sin plantilla, el editor arranca vacío. Un paquete por examen.
- [x] ES/EN conservado.

**C. Empaquetado offline**
- [x] Un **único fichero HTML autocontenido** (JS, CSS e iconos incrustados; ninguna petición de red), envuelto en un **paquete SCORM 1.2** (`imsmanifest.xml` + HTML), el mismo formato que el autor ya usa con éxito en el Moodle de la UMA. Se genera también el HTML suelto (prueba local con doble clic).
- [x] El SCORM es solo contenedor: si encuentra la API (`LMSInitialize`), marca `cmi.core.lesson_status = incomplete` al abrir y `completed` al pulsar "Copiar para entregar"; sin API (HTML suelto) funciona igual. **La entrega válida es siempre la de la Tarea.**

**D. Persistencia durante el examen**
- [x] **Autoguardado** del DSL en `localStorage` en cada cambio, para no perder el trabajo al ir y volver entre el SCORM y la Tarea o al recargar. Si `localStorage` está bloqueado, se avisa y se sigue funcionando.
- [x] Botón **"Nuevo examen"** con confirmación, que borra el autoguardado.

**E. Entrega en la Tarea de Moodle**
- [x] Botón **"Copiar para entregar"**: copia al portapapeles el DSL entre marcadores (`=== EER-STUDIO BEGIN v1 ===` … `=== EER-STUDIO END ===`) con versión, fecha y una suma de control. El alumno lo pega en el **texto en línea** de la Tarea. Es la vía principal, porque no necesita diálogos de fichero y funciona dentro de SEB.
- [x] Botón **"Descargar .eer"** como vía alternativa (entrega por fichero), si la Tarea lo admite y SEB permite descargas.
- [x] La app **acepta pegar un bloque de entrega** (con o sin el HTML que añade el editor de Moodle) para reconstruir el diagrama. Sirve al profesor como visor y al alumno para recuperar su trabajo.

**F. Cierre tras la entrega** (configuración de Moodle, no de la app)
- [x] Guía para el profesor (`docs/moodle/GUIA_PROFESOR.md`): Tarea con *Requerir que los alumnos pulsen Enviar = Sí*, *Fecha límite* y *Fecha de corte*, *Reabrir intentos = Nunca*, restricciones de acceso y configuración de SEB (dominio de Moodle permitido, portapapeles dentro de SEB). Una vez enviada la Tarea o pasada la fecha de corte, Moodle no deja modificarla.

**F2. Distribución**
- [x] Los paquetes oficiales se versionan con nombres fijos en `dist-moodle/` del repositorio (SCORM vacío, SCORM de ejemplo Hoteles Royal UMA y HTML vacío como visor; `npm run build:moodle:release`), y la guía en Markdown y PDF en `docs/moodle/`. Por decisión del autor, la guía enlaza a esas carpetas de GitHub.
- [x] Crédito de autoría (David Bueno Vallejo, Universidad de Málaga) en la primera línea de cada entrega, en los `.eer` descargados y en la guía.

**G. Corrección (fase posterior)**
- [ ] El bloque de entrega es analizable por máquina: tanto la descarga masiva de entregas en texto en línea (HTML) como los ficheros `.eer` se pueden procesar con un script offline. La corrección automática se especificará aparte.

**H. Pantalla completa y barra adaptable (v1.8.0)** → ver §3.11 F.

### 3.11. Notación EER completa, deshacer y pantalla completa (v1.8.0) `[NUEVO]`
> Decisión del autor (2026-11-24). Origen: comentarios de un usuario del editor (clave parcial, atributos compuestos, especialización parcial), el segundo correo de Enrique Soler Castillo sobre el modelo relacional (L), uso real de la edición Moodle en el Campus Virtual de la UMA (los paneles de Moodle quitan ancho en pantallas pequeñas) y propuestas de revisión aceptadas por el autor. El **soporte táctil** pasa a la v1.9.0.

**A. Compatibilidad (principio rector)**
- [x] Todo diagrama `.eer`, plantilla de examen o bloque de entrega válido en la v1.7.0 **compila igual y significa lo mismo** en la v1.8.0: misma notación dibujada (salvo los fallos corregidos en C), mismo modelo relacional salvo las correcciones de C y E. Las construcciones nuevas son **aditivas** (comandos y palabras clave nuevas); ninguna existente cambia de significado.
- [ ] El bloque de entrega Moodle mantiene el formato `v1`. Un diagrama que use sintaxis nueva no se puede abrir con un paquete v1.7.0 (dará `UNKNOWN_COMMAND`); se documenta en la guía del profesor (usar el mismo paquete en todo el examen y para corregir).
- [x] Los ficheros `.eer` de la v1.8.0 solo añaden líneas que la v1.7.0 ignora sin error (`relational TABLA.COLUMNA : TIPO`, ver L3), salvo que el diagrama use comandos o palabras nuevos.
- [x] Un test de compatibilidad compila los ejemplos y plantillas de la v1.7.0 (ayuda, `SAMPLE_CODE`, plantilla Hoteles Royal UMA) y comprueba que nodos, enlaces y tablas no cambian.

**B. Clave parcial de entidad débil**
- [x] Nuevo comando `partial_key_att Nombre -> ENTIDAD_DEBIL` (tipo de nodo `partial_key_attribute`): elipse con el nombre **subrayado con línea discontinua** (Elmasri). En SVG el subrayado se dibuja como una línea discontinua bajo el texto (no `text-decoration`, que no admite discontinuo).
- [x] **Mapeo (Paso 2):** la clave parcial forma la PK de la tabla débil junto a la FK del propietario, igual que hoy hace `key_att` sobre una entidad débil (que sigue funcionando por compatibilidad, ver G).
- [x] Formulario de atributo: nuevo tipo *Clave parcial* en el selector de tipo (sin botón nuevo en la barra de inserción, que ya está llena). Edición, código generado y borrado lo reconocen. Los cuatro listados de tipos de atributo hoy duplicados (`deleteNode.ts`, `dslEditing.ts`, `layout.ts`, `eerToRelational.ts`) pasan a una única constante.

**C. Atributos compuestos (corrección de fallo)**
- [x] `att Calle -> Direccion` (o `link Direccion Calle`) **dibuja la línea** entre el compuesto y su componente.
- [x] **Mapeo:** un atributo compuesto se sustituye por sus componentes simples (Elmasri, Paso 1). Hoy no ocurre: con `att Direccion -> CLIENTE` + `att Calle -> Direccion` + `att Numero -> Direccion` la tabla sale con una sola columna `DIRECCION` (reproducido el 2026-11-24).
- [x] Causa común: el compilador guarda en el enlace y en `parentEntity` la **etiqueta** del padre (`Direccion`), pero los atributos tienen id con sufijo (`Direccion_3`) y el dibujo y el motor buscan por id. Corrección en el compilador: tras el primer pase, cada extremo de enlace y cada `parentEntity` se resuelve al **id** del nodo (primero por id, luego por etiqueta, como `resolveNodeRef`).
- [x] Si una etiqueta de atributo es ambigua (dos atributos `Direccion` en entidades distintas), se resuelve al **último declarado antes de la línea** que la referencia y se emite el aviso `AMBIGUOUS_ATTRIBUTE_REFERENCE` (sugiere nombres distintos).
- [x] **Desde el formulario** (petición del autor, 2026-11-24): «Pertenece a» ofrece también los atributos, mostrados con su dueño («Direccion (CLIENTE)»), para crear componentes. Los nombres repetidos aparecen desactivados. Si hay un elemento seleccionado en el diagrama (entidad, relación o atributo de nombre único), el atributo nuevo lo trae ya elegido como propietario.

**D. Especialización total y parcial**
- [x] Sintaxis: palabra clave opcional al final, después del atributo definidor si lo hay: `spec d -> EMPLEADO` (total, **como hasta ahora**), `spec d -> EMPLEADO partial` (parcial), `spec o -> PERSONA [Tipo] partial`; `total` se acepta como marca explícita. Cualquier otra palabra suelta tras la superclase ⇒ error `INVALID_SPECIALIZATION_OPTION`.
- [x] Dibujo: participación total = doble línea superclase–círculo (actual); parcial = línea simple.
- [x] Formulario de especialización: casilla *Participación total* (marcada por defecto); el generador de código emite `partial` solo cuando está desmarcada, de modo que el código de los diagramas totales no cambia.
- [x] Mapeo: sin cambios (el motor solo implementa 8A, válida para total y parcial). La guía de 9 pasos menciona que 8C/8D dependen de esta distinción.
- [x] `union` no cambia (participación de categorías fuera de alcance).

**E. Roles en relaciones (recursivas y generales)**
- [x] Sintaxis: `link EMPLEADO SUPERVISA "1" role:Supervisor` y `link EMPLEADO SUPERVISA "N" role:Supervisado [total]`. El rol es un identificador (mismas reglas que los nombres); `role:` vacío ⇒ error `INVALID_ROLE`. Admitido en cualquier enlace entidad–relación.
- [x] Dibujo: el rol se escribe en cursiva junto a la arista, en el tercio más cercano a la entidad, sin tapar la cardinalidad (que sigue en el centro).
- [x] Formulario de relación: campo opcional *Rol* por participante.
- [x] **Mapeo (corrección de fallo):** en una relación donde la misma entidad participa más de una vez (recursiva), los nombres de columna y de restricción FK deben ser únicos. Hoy una recursiva M:N genera `SUPERVISA(EMPLEADO_DNI, EMPLEADO_DNI)` y dos `FK_SUPERVISA_EMPLEADO` (DDL inválido en Oracle; reproducido el 2026-11-24). Con rol, la FK toma el rol como prefijo (`SUPERVISOR_DNI`, `SUPERVISADO_DNI`, como `Super_ssn` en Elmasri); sin rol, se numera (`EMPLEADO_DNI`, `EMPLEADO_DNI_2`) y el linter avisa `RECURSIVE_RELATIONSHIP_WITHOUT_ROLES`. Aplica a los Pasos 3, 4, 5 y 7. En la recursiva 1:N la columna FK con rol usa el rol del lado 1 (el referenciado).
- [x] Una relación no recursiva con rol usa también el rol como prefijo de su FK (comportamiento uniforme y predecible).

**F. Pantalla completa (todas las ediciones) y barra adaptable en Moodle**
- [x] Botón **Pantalla completa** en la barra del examen (icono maximizar / minimizar, tooltip). Usa la Fullscreen API sobre el documento del paquete; se sale con el mismo botón o con `Esc`. Si la API no está disponible (`document.fullscreenEnabled === false`, p. ej. el iframe del reproductor SCORM no lo permite), el botón muestra un aviso que indica la alternativa: el profesor configura el SCORM con *Mostrar paquete = Nueva ventana*.
- [ ] La **guía del profesor** recomienda *Nueva ventana* (y explica cómo plegar los paneles laterales de Moodle) y la lista de comprobación SEB incluye probar el botón. La vía que funciona en el Moodle 5 de la UMA y en SEB se verifica con el autor antes del `/ship`.
- [x] Autoguardado, copiar para entregar, ayuda y modales siguen funcionando en pantalla completa (los modales se montan dentro del elemento a pantalla completa).
- [x] Barra de acciones adaptable: por debajo de ~1100 px de ancho los botones secundarios muestran solo icono (con tooltip y `aria-label`) y el título no se trunca a una letra (mínimo legible o se oculta, priorizando "Copiar para entregar").
- [x] **También en la edición completa** (decisión del autor, 2026-11-24): botón en la cabecera. En el navegador usa la misma Fullscreen API; en la app de escritorio, la ventana nativa de Tauri (`setFullscreen`, permiso `core:window:allow-set-fullscreen`), con F11 para alternar y Esc para salir, porque en WebView2 la Fullscreen API solo llena la vista web y no la ventana.

**G. Avisos pedagógicos del linter (entidades débiles y roles)**
- [x] `WEAK_ENTITY_WITHOUT_IDENTIFYING_RELATIONSHIP` — entidad débil que no participa en ninguna `ident_rel`.
- [x] `WEAK_ENTITY_WITHOUT_PARTIAL_KEY` — entidad débil sin `partial_key_att` ni `key_att` (el Paso 2 no puede completar su PK; enlaza con el caso ya documentado en los tests del Paso 2).
- [x] `KEY_ATTRIBUTE_ON_WEAK_ENTITY` — `key_att` en entidad débil: sugiere `partial_key_att` (sigue compilando igual).
- [x] `PARTIAL_KEY_ON_STRONG_ENTITY` — `partial_key_att` en entidad fuerte o relación: sugiere `key_att`.
- [x] `RECURSIVE_RELATIONSHIP_WITHOUT_ROLES` (ver E).
- [x] Todos `warning` (no bloquean), con mensaje ES/EN y navegación a la línea, como los existentes.

**H. Deshacer / rehacer**
- [x] `Ctrl+Z` / `Ctrl+Y` (y `Ctrl+Shift+Z`; `Cmd` en macOS) y dos botones en la barra, en la edición web/escritorio y en la Moodle.
- [x] Un único historial sobre el **texto del DSL EER** (todo el estado del diagrama vive en él): crear, editar, borrar, mover (un arrastre = un paso), cargar ejemplo/fichero/entrega, *Limpiar* y *Empezar de nuevo* se pueden deshacer. Lo tecleado en el panel de código se agrupa en un paso por pausa (≥ 1 s) y el atajo, con el foco en el panel de código, usa este mismo historial (no el nativo del `<textarea>`, que se rompería con los cambios hechos desde el lienzo).
- [x] Límite de 100 pasos; el historial no se persiste (al recargar empieza vacío; el autoguardado de Moodle no cambia).
- [x] Las coordenadas del modelo relacional (pestaña relacional) quedan fuera del historial en esta versión.

**I. Relaciones n-arias desde la interfaz gráfica**
- [x] El formulario de relación pasa de "primera/segunda entidad" a una **lista de participantes** (entidad, cardinalidad, participación total, rol) con *+ Añadir entidad* y quitar (mínimo dos). Crear y editar relaciones de cualquier grado; desaparece el aviso `modalProperties.naryNote`.
- [x] El código generado y la edición (renombrar, reescribir bloque) mantienen el formato actual de líneas `link`.

**J. Repaso de la notación de Elmasri**
- [x] Diagrama de referencia con todas las construcciones (entidad fuerte/débil, relación/identificativa, binaria/ternaria/recursiva con roles, cardinalidades y participación total, atributos simple/clave/clave parcial/compuesto/multivaluado/derivado/de relación, especialización d/o total/parcial con y sin atributo definidor, unión, ⊂).
- [x] Se usa como **test** (compila sin errores; cada construcción produce el nodo/enlace/estilo esperado y un modelo relacional sin columnas ni restricciones duplicadas) y como **ejemplo** en la pestaña *Sintaxis* de la ayuda. Los huecos que aparezcan se corrigen en esta versión o se registran como deuda.

**K. Documentación**
- [ ] Ayuda (*Sintaxis* y *Uso del editor*, con la tabla de atajos), prompt de IA (ES/EN), README ES/EN, guía del profesor (pantalla completa, compatibilidad de paquetes) y `eer-to-relational-mapping.md` (compuestos, roles en recursivas) describen lo nuevo. Todos los ejemplos de la ayuda compilan (test existente).

**L. Claves y modelo relacional (correo de Enrique Soler Castillo, 2026-09-28, posterior a la v1.6.0)**
> Su primer correo (añadir y crear otro, editar relaciones, resaltar la línea del DSL, especialización sin discriminante, selección múltiple, atributos de relación, `VUELTA` en la PK de `CIRCULA`, política `ON DELETE`) quedó resuelto en la v1.6.0 (§3.7). Los cuatro puntos del segundo se reprodujeron el 2026-11-24 con pruebas temporales:
- [x] **L1. El modelo relacional va un cambio por detrás del EER (corrección de fallo).** Al borrar una entidad desde el lienzo, su tabla sigue en el modelo relacional. Causa: `useEERParser` compila con 300 ms de retardo, pero el efecto de `EERDiagramer` que deriva el relacional se dispara al cambiar `code`, todavía con los nodos anteriores, y marca ese código como procesado. Cuando llegan los nodos nuevos, el código coincide y no se regenera. El motor en sí borra bien la tabla. Corrección: el parser expone el código del que proceden sus nodos (`compiledCode`) y la derivación se basa en él. Además, con el EER vacío (*Limpiar*), el modelo relacional también se vacía; hoy se queda con las tablas anteriores (`nodes.length > 0`). Test con temporizadores simulados.
- [x] **L2. FK compuestas en el DSL relacional (corrección de fallo).** El motor genera bien `FOREIGN KEY (CIRCUITO_NOMBRE, CIRCUITO_FECHA) REFERENCES CIRCUITO (NOMBRE, FECHA)`, pero el DSL relacional solo admite FK por columna. Al pasar por él (cualquier edición en la pestaña relacional), la FK se parte en dos `FK_COMPITE_CIRCUITO_CIRCUITO_NOMBRE/FECHA` que referencian una parte de la PK, y Oracle las rechaza (ORA-02270). Nueva sintaxis a nivel de tabla: `FK (CIRCUITO_NOMBRE, CIRCUITO_FECHA) -> CIRCUITO(NOMBRE, FECHA) ON DELETE NO ACTION`. El generador la usa para toda FK de más de una columna; la sintaxis por columna se mantiene para las simples. El DSL relacional no se guarda en el `.eer` (solo las posiciones), así que el cambio de formato no afecta a ficheros existentes. El linter avisa si una FK no referencia la PK completa ni una clave UNIQUE de la tabla destino.
- [x] **L3. Tipos de columna: se conservan y se propagan** (decisión del autor). Tipos editados en el DSL relacional:
  - Se recuerdan por `TABLA.COLUMNA` y se reaplican al regenerar el modelo desde el EER; hoy cualquier cambio en el EER los borra.
  - Se guardan en el `.eer` junto a las posiciones, con una línea `relational TABLA.COLUMNA : TIPO` que la v1.7.0 ignora sin error.
  - Se olvidan si la columna desaparece.

  Columnas FK:
  - Heredan siempre el tipo de la columna referenciada. El generador las escribe sin tipo (`CIRCUITO_NOMBRE PK FK -> ...`) y el compilador lo resuelve, así que cambiar el tipo de una PK cambia el de todas sus FK.
  - Si se escribe a mano un tipo distinto en una FK, se avisa con `FK_TYPE_MISMATCH`.

  Las demás ediciones manuales del DSL relacional se siguen perdiendo al cambiar el EER: la pestaña relacional lo indica con un aviso visible.
- [x] **L4. Claves alternativas (UNIQUE) y compuestas en el EER** (decisión del autor, compatible con la v1.7.0):
  - Varios `key_att` en la misma entidad siguen formando **una** PK compuesta, como hoy. Así se obtiene la PK (NOMBRE, FECHA) del CIRCUITO de Enrique.
  - También se acepta la compuesta al estilo de Elmasri, un `key_att` con componentes: `key_att Clave -> CIRCUITO` con `att Nombre -> Clave` y `att Fecha -> Clave`. Funciona una vez corregido C.
  - Nueva marca `unique` para claves alternativas: `key_att Email -> CLIENTE unique`. Se dibuja subrayada con una pequeña etiqueta «UK» y se mapea a columna `NOT NULL` + `UNIQUE`. Si es compuesta, a una restricción `UNIQUE (A, B)` de tabla.
  - La ayuda explica las tres formas y en qué se diferencian.
- [x] **L5. UNIQUE no llega ni al SQL ni al DSL relacional (corrección de fallo).** El motor marca `isUnique` (p. ej. la FK del Paso 3 en una 1:1, que la guía de 9 pasos describe como UNIQUE), pero ni `relationalToSQL` ni el generador del DSL relacional lo emiten. Tampoco el compilador relacional lo lee. Hoy una 1:1 genera una FK sin `UNIQUE`, es decir, una 1:N. Corrección: palabra `UNIQUE` en columna y `UNIQUE (A, B)` a nivel de tabla en el DSL relacional; se emite en el SQL de todos los dialectos y se muestra en la tarjeta de la tabla y en el SVG exportado.

**Fuera de alcance de 3.11:** restricción de igualdad de roles en uniones/categorías (descartada por el autor), participación total/parcial de uniones, opciones de mapeo 8B/8C/8D, deshacer en el modelo relacional y soporte táctil (v1.9.0).

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

