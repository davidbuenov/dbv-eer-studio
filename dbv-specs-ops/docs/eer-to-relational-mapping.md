# Guía de Mapeo de Diagramas EER a Modelos Relacionales (ER- y EER-a-Relacional)

Esta guía técnica detalla el algoritmo sistemático de correspondencia (mapping) para transformar un esquema conceptual basado en el **Modelo Entidad-Relación Extendido/Mejorado (EER)** en un **Esquema de Base de Datos Relacional** lógico. 

Este documento está diseñado específicamente como una **especificación formal de reglas de negocio y lógica de conversión** para ser interpretada por un modelo de lenguaje (como Gemini) encargado de desarrollar una aplicación automatizada de conversión de esquemas.

---

## Estructura General del Algoritmo

El proceso completo consta de **9 pasos consecutivos**:
- **Pasos 1 al 7:** Mapeo de construcciones básicas del modelo Entidad-Relación (ER).
- **Pasos 8 y 9:** Mapeo de construcciones avanzadas del modelo Entidad-Relación Mejorado (EER), incluyendo especializaciones, generalizaciones, herencia y categorías (tipos unión).

---

## PARTE I: Algoritmo de Mapeado ER-a-Relacional (Pasos 1-7)

### Paso 1: Mapeado de los Tipos de Entidad Regulares (Fuertes)

**Descripción:**  
Por cada tipo de entidad fuerte (regular) $E$ en el esquema conceptual, se crea una relación (tabla) independiente $R$ que contendrá las instancias de esa entidad.

**Reglas de Mapeo de Atributos:**
1. **Atributos Simples:** Todos los atributos simples de $E$ se incluyen directamente como columnas en $R$.
2. **Atributos Compuestos:** Para atributos compuestos (ej. *Nombre* compuesto por *NombrePila*, *Apellido1*, *Apellido2*), **no** se incluye el atributo compuesto en sí. En su lugar, se incluyen únicamente sus componentes simples como columnas directas en $R$.
3. **Selección de la Clave Primaria (Primary Key - PK):**
   - Seleccionar uno de los atributos clave de $E$ como la clave primaria de $R$.
   - Si la clave elegida de $E$ es compuesta, el conjunto de los atributos simples que la forman constituirá la clave primaria de $R$.
   - Si existen otras claves candidatas (claves secundarias) en $E$, se deben definir restricciones de unicidad (`UNIQUE`) en $R$ para estos atributos.

---

### Paso 2: Mapeado de los Tipos de Entidad Débiles

**Descripción:**  
Un tipo de entidad débil $W$ no tiene atributos clave propios y depende de la existencia de un tipo de entidad propietario $E$ a través de una relación identificadora.

**Reglas de Mapeo:**
1. Crear una relación (tabla) $R$ para $W$.
2. Incluir todos los atributos simples de $W$ (o componentes simples de atributos compuestos) como columnas de $R$.
3. **Propagación de Clave Propietaria:** Incluir en $R$ como clave ajena (Foreign Key - FK) las columnas que corresponden a la clave primaria de la relación del tipo de entidad propietario $E$. Esta FK identifica la relación de dependencia.
4. **Definición de la Clave Primaria (PK):** La PK de $R$ es la combinación de:
   $$\text{PK}(R) = \{\text{PK de la entidad propietaria } E\} \cup \{\text{Clave parcial / discriminador de } W\}$$
5. **Reglas de Integridad Referencial:** Dado que la existencia de la entidad débil depende del propietario, se debe configurar la FK con propagación de acciones:
   - `ON UPDATE CASCADE`
   - `ON DELETE CASCADE`

*Nota: Si existe una jerarquía de entidades débiles (ej. $E_2$ es débil respecto a $E_1$, que a su vez es débil respecto a $E_0$), se debe mapear primero $E_1$ para determinar su PK antes de mapear $E_2$.*

---

### Paso 3: Mapeado de los Tipos de Relación 1:1 Binarios

**Descripción:**  
Mapea relaciones de correspondencia uno-a-uno entre dos relaciones $S$ y $T$. Existen tres metodologías alternativas. La elección depende de las restricciones de participación.

#### Opción 3.1: Metodología de la Clave Ajena (Foreign Key) — *Recomendada por defecto*
- **Cuándo aplicar:** Especialmente útil si una de las participaciones es total (obligatoria) y la otra es parcial.
- **Regla:** Seleccionar la relación que representa la participación total (ej. $S$) e incluir en ella, como clave ajena (FK), la clave primaria de la otra relación (ej. $T$). 
- **Atributos de Relación:** Si la relación 1:1 posee atributos propios, se mapean como columnas de la tabla que contiene la FK ($S$).
- **Restricciones:** El atributo FK en $S$ debe configurarse como `UNIQUE` para asegurar la restricción 1:1, y como `NOT NULL` si la participación es total.

#### Opción 3.2: Metodología de la Relación Mezclada (Merged Relation)
- **Cuándo aplicar:** Únicamente apropiado cuando **ambas** participaciones en la relación son totales (obligatorias), lo que implica que las entidades están íntimamente ligadas.
- **Regla:** Mezclar los tipos de entidad y la relación en una única tabla relacional que contenga los atributos de ambas entidades y los de la relación. La clave primaria de una de ellas actúa como la PK del conjunto.

#### Opción 3.3: Metodología de Referencia Cruzada (Relación de Relación)
- **Cuándo aplicar:** Cuando la participación de ambas entidades es altamente parcial, a fin de evitar nulos redundantes en la FK de las tablas principales.
- **Regla:** Crear una tercera tabla $R_{rel}$ (tabla de búsqueda) cuyos atributos sean las claves primarias de $S$ y $T$ (actuando como FKs). Uno de estos atributos (o ambos si se quiere modelar de forma flexible) se selecciona como PK, garantizando que el otro tenga restricción `UNIQUE`.

---

### Paso 4: Mapeado de los Tipos de Relación 1:N Binarios

**Descripción:**  
Representa relaciones de correspondencia uno-a-muchos (donde una entidad del lado 1 se asocia con muchas entidades del lado N).

**Reglas de Mapeo:**
1. **Identificación de Tablas:** Identificar la relación $S$ correspondiente al tipo de entidad que se encuentra en el **lado N** de la relación. Identificar la relación $T$ correspondiente al **lado 1**.
2. **Propagación de Clave:** Incluir como clave ajena (FK) en $S$ (tabla del lado N) la clave primaria de $T$ (tabla del lado 1).
3. **Atributos de Relación:** Incluir los atributos simples de la relación 1:N como columnas de $S$ (tabla del lado N).
4. **Justificación:** Se realiza la propagación hacia el lado N porque cada instancia en el lado N se asocia como máximo con una única instancia en el lado 1.
5. **Alternativa (Relación de Relación):** Si la participación del lado N es muy baja (ej. solo el 5% de los empleados tiene asignado un coche de empresa), se puede optar por crear una tercera tabla de referencia cruzada con $\text{PK} = \{\text{PK del lado N}\}$ para evitar columnas llenas de valores `NULL`.

---

### Paso 5: Mapeado de los Tipos de Relación M:N Binarios

**Descripción:**  
Representa relaciones muchos-a-muchos. Debido a la naturaleza combinatoria de las relaciones M:N, no se pueden modelar propagando claves en las tablas existentes sin violar la primera forma normal.

**Reglas de Mapeo:**
1. **Creación de Tabla de Relación:** Crear una nueva relación (tabla de correspondencia) $S$ para representar la relación $R$.
2. **Estructura de Columnas:**
   - Incluir como atributos de clave ajena (FK) en $S$ las claves primarias de las tablas que representan a los dos tipos de entidad participantes.
   - Incluir cualquier atributo simple (o componentes simples de compuestos) perteneciente al tipo de relación M:N.
3. **Definición de la Clave Primaria (PK):** La PK de $S$ es la combinación de las FKs de ambas entidades participantes:
   $$\text{PK}(S) = \{\text{FK}_1 \cup \text{FK}_2\}$$
4. **Reglas de Integridad Referencial:** Ambas FKs deben configurarse con:
   - `ON UPDATE CASCADE`
   - `ON DELETE CASCADE` (la eliminación de una entidad participante elimina automáticamente sus enlaces de relación correspondientes).

---

### Paso 6: Mapeado de Atributos Multivalorados

**Descripción:**  
Un atributo multivalor permite asociar una lista o conjunto de valores a una misma entidad (ej. las ubicaciones de un departamento o los colores de un vehículo). El modelo relacional clásico prohíbe atributos con conjuntos de valores (requiere valores atómicos).

**Reglas de Mapeo:**
1. **Creación de Tabla Independiente:** Por cada atributo multivalor $A$ de una entidad o relación, se crea una nueva tabla relacional $R_A$.
2. **Estructura de Columnas:**
   - Un atributo correspondiente a la propiedad $A$ (si $A$ es compuesto, incluir todos sus atributos simples).
   - El atributo de clave primaria $K$ de la relación propietaria original, que actuará como FK en $R_A$.
3. **Definición de la Clave Primaria (PK):** La PK de $R_A$ será la combinación del valor del atributo y la clave de la entidad propietaria:
   $$\text{PK}(R_A) = \{K\} \cup \{A\}$$
4. **Reglas de Integridad Referencial:** Configurar la FK que referencia a la tabla propietaria con:
   - `ON UPDATE CASCADE`
   - `ON DELETE CASCADE`

---

### Paso 7: Mapeado de los Tipos de Relación n-arias ($n > 2$)

**Descripción:**  
Mapea tipos de relación que vinculan a tres o más tipos de entidades de forma simultánea (ej. un proveedor suministra una pieza a un proyecto específico).

**Reglas de Mapeo:**
1. **Creación de Tabla de Relación:** Crear una nueva tabla $S$ para representar la relación n-aria $R$.
2. **Estructura de Columnas:**
   - Incluir como claves ajenas (FKs) en $S$ las claves primarias de todas las tablas de las entidades participantes.
   - Incluir cualquier atributo propio de la relación n-aria.
3. **Definición de la Clave Primaria (PK):**
   - **Regla General:** Por defecto, la PK de $S$ es la combinación de todas las FKs que referencian a las entidades participantes.
   - **Excepción por Restricción de Cardinalidad:** Si la restricción de cardinalidad de alguno de los tipos de entidad participantes $E$ en la relación $R$ es **1** (lo que significa que para una combinación de las otras entidades solo puede asociarse una única instancia de $E$), entonces la PK de $S$ **no** debe incluir la FK que referencia a $E$. En su lugar, el resto de las FKs formarán la PK, y la FK de $E$ será una columna común no-clave en $S$.

---

## PARTE II: Algoritmo de Mapeado EER-a-Relacional (Pasos 8-9)

### Paso 8: Opciones para Mapear la Especialización o Generalización

**Contexto:**  
Una superclase $C$ tiene una clave primaria $k$ y atributos simples $\{a_1, \dots, a_n\}$. Tiene $m$ subclases $\{S_1, S_2, \dots, S_m\}$. El mapeo de esta estructura jerárquica de herencia puede realizarse mediante **4 opciones principales (8A, 8B, 8C, 8D)** dependiendo de si las subclases son **disjuntas o solapadas**, y si la especialización es **total o parcial**.

```
                       [ Superclase C ] (PK: k)
                              |
                     -------------------
                     | (d/o) (Total/Parcial)
                     |
         -------------------------
         |                       |
   [ Subclase S1 ]        [ Subclase S2 ]
```

---

#### Opción 8A: Varias Relaciones (Superclase y Subclases)
*También conocida como mapeo por tabla por clase u opción de relaciones múltiples con superclase.*

* **Reglas:**
  - Crear una tabla $L$ para la superclase $C$ con sus atributos propios: $\text{Atrs}(L) = \{k, a_1, \dots, a_n\}$ y $\text{PK}(L) = k$.
  - Crear una tabla $L_i$ para cada subclase $S_i$ (para $1 \le i \le m$). Sus columnas serán la clave primaria de la superclase y sus atributos específicos locales:
    $$\text{Atrs}(L_i) = \{k\} \cup \{\text{atributos específicos de } S_i\}$$
    $$\text{PK}(L_i) = k$$
  - Establecer una clave ajena (FK) de cada $L_i$ hacia $L$, con la restricción de integridad correspondiente (`ON DELETE CASCADE` y `ON UPDATE CASCADE`).
* **Cuándo se aplica:** Es una opción universal. Funciona de manera limpia y sin redundancia para **cualquier tipo de especialización**: total o parcial, disjunta o solapada.
* **Inconveniente:** Requiere operaciones de unión (`JOIN` / `EQUIJOIN`) para recuperar los atributos de una subclase junto con los heredados de la superclase.

---

#### Opción 8B: Varias Relaciones (Solo Relaciones de Subclase)
*También conocida como mapeo de tabla por subclase concreta (sin tabla de superclase).*

* **Reglas:**
  - **No** se crea una tabla para la superclase $C$.
  - Crear una tabla $L_i$ para cada subclase $S_i$ (para $1 \le i \le m$). Cada tabla contiene todos los atributos específicos de la subclase **más** todos los atributos heredados de la superclase:
    $$\text{Atrs}(L_i) = \{k, a_1, \dots, a_n\} \cup \{\text{atributos específicos de } S_i\}$$
    $$\text{PK}(L_i) = k$$
* **Cuándo se aplica:**
  - **Solo funciona correctamente si la especialización es TOTAL** (cada entidad de la superclase pertenece obligatoriamente a al menos una subclase). Si fuese parcial, las entidades que no pertenecen a ninguna subclase se perderían al no existir tabla de superclase.
  - **Solo es recomendada si las subclases son DISJUNTAS**. Si la especialización fuese solapada, una entidad que pertenezca a múltiples subclases tendría sus datos de superclase duplicados redundantemente en varias tablas $L_i$.
* **Inconveniente:** Para realizar búsquedas sobre el conjunto total de entidades de la superclase (independientemente de su subclase), se debe aplicar una operación de unión externa completa (`OUTER UNION` o `FULL OUTER JOIN`) sobre todas las tablas $L_i$.

---

#### Opción 8C: Una Sola Relación con un Atributo de Tipo (Discriminador)
*También conocida como mapeo de tabla única por jerarquía (Single Table Inheritance).*

* **Reglas:**
  - Crear una **única tabla** $L$ que unifica la superclase y todas las subclases en un solo esquema.
  - Sus columnas incluirán la clave primaria, los atributos de la superclase, los atributos específicos de **todas** las subclases, y un atributo de tipo o discriminador $t$:
    $$\text{Atrs}(L) = \{k, a_1, \dots, a_n\} \cup \{\text{atributos de } S_1\} \cup \dots \cup \{\text{atributos de } S_m\} \cup \{t\}$$
    $$\text{PK}(L) = k$$
  - El atributo de tipo $t$ (ej. `TipoTrabajo`, `TipoVehiculo`) indica a qué subclase pertenece cada fila.
  - Si la especialización es parcial, $t$ puede contener valores `NULL` para las filas que correspondan puramente a la superclase.
* **Cuándo se aplica:**
  - **Solo funciona para especializaciones DISJUNTAS** (ya que un solo atributo de tipo $t$ solo puede almacenar un valor a la vez por fila).
  - Es muy recomendada si los atributos específicos de las subclases son pocos, ya que evita por completo los costes de `JOIN` en consultas y es muy eficiente.
* **Inconveniente:** Si las subclases tienen muchos atributos específicos, la tabla única generará una cantidad masiva de valores `NULL` para las columnas que no apliquen a la subclase de la fila actual, desperdiciando almacenamiento lógico.

---

#### Opción 8D: Una Sola Relación con Varios Atributos de Tipo (Banderas Booleanas)
*También conocida como mapeo de tabla única con banderas booleanas.*

* **Reglas:**
  - Crear una **única tabla** $L$ que contiene la clave, los atributos de la superclase y de todas las subclases, además de $m$ atributos booleanos o banderas de tipo ($t_1, t_2, \dots, t_m$):
    $$\text{Atrs}(L) = \{k, a_1, \dots, a_n\} \cup \{\text{atributos de } S_1\} \cup \dots \cup \{\text{atributos de } S_m\} \cup \{t_1, \dots, t_m\}$$
    $$\text{PK}(L) = k$$
  - Cada atributo de tipo $t_i$ es un booleano (ej. bandera `EsSecretaria`, `EsIngeniero`) que indica con `Sí` (true) o `No` (false) si la tupla pertenece a la subclase $S_i$.
  - Alternativamente, se puede definir un único atributo compuesto de banderas de bits (ej. máscara de bits de $m$ bits) en lugar de $m$ columnas separadas.
* **Cuándo se aplica:**
  - **Diseñada específicamente para especializaciones SOLAPADAS** (donde una entidad puede pertenecer a más de una subclase de forma simultánea). No obstante, también es completamente funcional para subclases disjuntas.
* **Inconveniente:** Al igual que la opción 8C, genera un uso masivo de valores `NULL` si las subclases contienen muchos atributos específicos.

---

### Paso 9: Mapeado de Tipos de Unión (Categorías)

**Contexto:**  
Una categoría (o tipo de unión) representa una colección de entidades que es un subconjunto de la **unión** de diferentes tipos de entidades (superclases) que pueden tener estructuras y claves primarias completamente distintas (ej. un `PROPIETARIO` de un vehículo puede ser una `PERSONA` física con *DNI*, un `BANCO` con *CódigoBanco*, o una `EMPRESA` con *CIF*).

```
   [ PERSONA ] (PK: Dni)     [ BANCO ] (PK: CodB)     [ EMPRESA ] (PK: Cif)
        \                         |                         /
         ---------------------------------------------------
                                  |
                                 (U) (Unión)
                                  |
                           [ PROPIETARIO ] (Clave sustituta)
```

#### Caso 9.1: Superclases definitorias con claves primarias DIFERENTES
Cuando las clases base tienen claves de tipos distintos, no se puede usar una de ellas como clave primaria común.

* **Reglas de Mapeo:**
  1. **Creación de la Relación de Categoría:** Crear una nueva relación (tabla) $L_{cat}$ para representar la categoría.
  2. **Definición de Clave Sustituta (Surrogate Key):** Especificar un atributo de clave completamente nuevo y artificial como la Clave Primaria de $L_{cat}$ (ej. `IdPropietario`).
  3. **Vincular Superclases:** Añadir este atributo de clave sustituta (`IdPropietario`) como una clave ajena (FK) en cada una de las relaciones correspondientes a las superclases de la categoría (en las tablas `PERSONA`, `BANCO` y `EMPRESA`).
  4. **Lógica de Integridad:**
     - Si una instancia de una superclase no pertenece a la categoría, su atributo de clave sustituta asociado será `NULL`.
     - Solo las entidades que participen en la categoría tendrán una correspondencia y una tupla en $L_{cat}$.

---

#### Caso 9.2: Superclases definitorias con la MISMA clave primaria
Cuando las superclases de la categoría ya comparten el mismo atributo de clave primaria y dominio (ej. la categoría `VEHICULO_REGISTRADO` que unifica `COCHE` y `CAMION`, donde ambos usan `IdVehiculo` como clave).

* **Reglas de Mapeo:**
  - **No se requiere una clave sustituta.**
  - Se crea la tabla de la categoría unificada usando la misma clave primaria común (`IdVehiculo`) como su propia PK.
  - Se mapea como si fuera una relación superclase/subclase regular (semejante a la opción 8A).

---

## Tabla de Resumen de Correspondencias

| Modelo EER | Modelo Relacional | Elementos de Integridad y Restricciones |
| :--- | :--- | :--- |
| **Tipo de entidad fuerte (regular)** | Relación de entidad (Tabla) | PK (Atributo único o compuesto). |
| **Tipo de entidad débil** | Tabla con clave ajena propagada | $\text{PK} = \{\text{PK Propietario} \cup \text{Clave Parcial}\}$. FK referenciada con `ON DELETE CASCADE`. |
| **Relación Binaria 1:1** | Clave ajena propagada o tabla de relación | FK en la tabla con participación total (con restricción `UNIQUE` y opcionalmente `NOT NULL`). |
| **Relación Binaria 1:N** | Clave ajena en el lado N | FK en el lado N referenciando la PK del lado 1. Atributos de relación migran al lado N. |
| **Relación Binaria M:N** | Relación de relación (Tabla puente) | $\text{PK} = \{\text{FK}_1 \cup \text{FK}_2\}$. Ambas FKs con `ON DELETE CASCADE`. |
| **Relación n-aria ($n > 2$)** | Tabla de relación de n-vías | $\text{PK} = \{\text{FK}_1 \cup \dots \cup \text{FK}_n\}$ (por defecto). Exclusiones en la PK si hay cardinalidad 1. |
| **Atributo multivalor** | Relación de atributo independiente | $\text{PK} = \{\text{FK de la entidad} \cup \text{Valor del atributo}\}$. FK con `ON DELETE CASCADE`. |
| **Especialización / Generalización** | Opciones de mapeo: 8A, 8B, 8C, 8D | Ver condiciones específicas de disyunción/solapamiento y total/parcial. |
| **Categorías (Tipos de Unión)** | Tabla propia con Clave Sustituta | PK sustituta en la tabla de categoría, añadida como FK en las tablas de las superclases. |

---

## Directrices Informales de Calidad para el Mapeo

Para que la aplicación de conversión desarrollada por Gemini genere esquemas relacionales óptimos, debe validar internamente las siguientes reglas:

1. **Semántica Clara:** Cada tabla debe representar un único concepto del mundo real. Se debe evitar mezclar entidades que den lugar a dependencias parciales o transitivas (evitando violar las formas normales 2FN y 3FN).
2. **Reducción de redundancia:** Preferir la propagación de claves ajenas (Pasos 3 y 4) frente a la creación de tablas puente intermedias, excepto cuando la participación sea muy baja (para prevenir nulos excesivos).
3. **Evitar Valores Nulos Masivos:** En la jerarquía de herencia (Paso 8), si las subclases tienen muchos atributos específicos, descartar las opciones de tabla única (8C y 8D) y optar por relaciones múltiples (8A) para evitar la proliferación de nulos innecesarios.
4. **Preservación de Restricciones:** Asegurar que todas las cardinalidades máximas y mínimas se traduzcan adecuadamente a nivel físico mediante declaraciones `NOT NULL`, restricciones `UNIQUE` e integridades referenciales en cascada.
