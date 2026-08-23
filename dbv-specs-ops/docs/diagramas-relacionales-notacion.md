# Guía de Notación y Diseño de Diagramas Relacionales

Este documento técnico detalla las reglas visuales y semánticas para la representación de **diagramas relacionales** (modelos de bases de datos lógicos y físicos). Está diseñado para servir como especificación de referencia en el desarrollo de herramientas de conversión automatizada y modelado gráfico de bases de datos, basándose tanto en la notación académica clásica de **Elmasri y Navathe** como en los estándares industriales (**UML Class Diagrams**, **IDEF1X** e **Information Engineering / Crow's Foot**).

---

## 1. El Estándar Académico: Diagramas de Esquema Relacional (Elmasri & Navathe)

En la notación estándar introducida en el libro *Fundamentos de Sistemas de Bases de Datos*, el diagrama del esquema relacional tiene como propósito fundamental visualizar las relaciones (tablas) y sus **restricciones de integridad referencial** de forma limpia y directa.

### Representación de Tablas y Atributos
* **Relaciones/Tablas:** Se representan como cajas rectangulares horizontales. El nombre de la relación se coloca encima o a la izquierda de la caja.
* **Atributos:** Cada atributo de la relación ocupa una celda de la caja rectangular, dispuestos de izquierda a derecha en el orden en que se definen.
* **Claves Primarias (PK):** Los atributos que forman la clave principal de un esquema de relación están **estrictamente subrayados**.
* **Claves Candidatas / Secundarias (Unique):** No tienen representación especial por defecto en esta vista básica, aunque el tipo de dato o una anotación `(unique)` puede acompañarlos en el DDL.

### Representación de Integridad Referencial (Flechas de Clave Ajena)
Las relaciones lógicas en este modelo no se muestran con rombos (como en el modelo ER), sino mediante **arcos o flechas dirigidas** que conectan las claves externas con las claves principales correspondientes:

```
[ Tabla Referenciante (Hija) ]                    [ Tabla Referenciada (Padre) ]
| ... | ClaveExterna (FK) | ... | --------------> | ... | ClavePrimaria (PK) | ... |
```

#### Reglas de la Flecha de Clave Ajena (FK):
1. **Origen y Destino:** La flecha **nace** en el atributo o conjunto de atributos que actúan como clave externa (`Foreign Key - FK`) en la relación de referencia (tabla hija) y **su punta apunta directamente** al atributo de clave principal (`Primary Key - PK`) de la relación referenciada (tabla padre).
2. **Dirección de la Punta:** La punta de la flecha **siempre señala a la clave principal** de la tabla padre. Esto representa visualmente que el valor de la clave externa en la tupla hija "hace referencia" y depende de la existencia de la tupla padre con esa clave principal.
3. **Tipo de Línea:** Se dibuja como una **línea sólida y continua** con una punta de flecha en el extremo de la tabla padre.
4. **Relaciones Autorreferenciales (Recursivas):** Cuando una clave externa referencia a la misma tabla (como `SuperDni` que apunta a `Dni` en la tabla `EMPLEADO`), la flecha sale del atributo FK, rodea la tabla externamente y vuelve a entrar apuntando al atributo PK de la misma tabla.

---

## 2. El Estándar de Herramientas CASE: Relaciones Identificativas vs. No Identificativas (IDEF1X / UML en Rational Rose)

En entornos profesionales y herramientas CASE de modelado de datos (como Rational Rose, ERWin, etc.), las líneas que conectan las tablas lógicas y físicas transmiten información estructural mucho más rica sobre la dependencia de identidad y existencia. Aquí es donde la distinción entre **líneas continuas** y **líneas discontinuas** es crucial.

### A. Relaciones Identificativas (Línea Continua)
Se representan mediante una **línea continua (solid line)** que conecta la tabla padre con la tabla hija.

* **Significado Semántico:** Ocurre cuando la existencia y la identidad de la tabla hija dependen completamente de la tabla padre. Típicamente representa el mapeado de **entidades débiles** del modelo conceptual.
* **Impacto en la Base de Datos:** Los atributos de la clave ajena (`FK`) migrados a la tabla hija **forman parte de la Clave Primaria (`PK`) compuesta** de la tabla hija.
* **Ejemplo:** La relación entre `EMPLEADO` y `SUBORDINADO`. La clave de `SUBORDINADO` es `{DniEmpleado, NombreSubordinado}`. Como el `DniEmpleado` (FK de EMPLEADO) forma parte de la PK, es una relación identificativa y se dibuja con una **línea continua**.

### B. Relaciones No Identificativas (Línea Discontinua)
Se representan mediante una **línea discontinua o punteada (dashed line)** que conecta la tabla padre con la tabla hija.

* **Significado Semántico:** Ocurre cuando las tablas representan entidades independientes del mundo real que se asocian, pero la tabla hija tiene su propia identidad independiente del padre.
* **Impacto en la Base de Datos:** Los atributos de la clave ajena (`FK`) migrados a la tabla hija se almacenan como atributos normales y **no forman parte de la Clave Primaria (`PK`)** de la tabla hija. Pueden admitir valores nulos (`NULL`) si la participación es parcial.
* **Ejemplo:** La relación entre `DEPARTAMENTO` y `EMPLEADO`. El campo `Dno` (FK que indica el departamento en el que trabaja el empleado) es un atributo normal en `EMPLEADO`, pero la clave primaria de `EMPLEADO` es únicamente su `Dni`. Al ser independiente, se representa mediante una **línea discontinua**.

---

## 3. Diagramas de Clases UML Aplicados a Modelos Relacionales

La notación de UML (utilizada por Rational Rose Data Modeler y otros modeladores orientados a objetos) traduce los conceptos relacionales de una manera ligeramente diferente:

* **Clases como Tablas:** Las tablas se muestran como cajas con tres secciones (Nombre de tabla, Atributos de columna con estereotipos como `<<PK>>` o `<<FK>>`, y Operaciones/Restricciones).
* **Asociaciones (Líneas Continuas):** Las relaciones binarias estándar se muestran como **líneas continuas**. Si son unidireccionales, llevan una punta de flecha en la dirección de navegabilidad; si son bidireccionales, no llevan flecha.
* **Atributos de Vínculo (Línea Discontinua):** Cuando una relación M:N (muchos a muchos) tiene atributos propios de la relación (como el atributo `Horas` en la relación `TRABAJA_EN` o `FechaInicio` en `ADMINISTRA`), estos atributos se colocan en una caja de clase de asociación que se conecta a la línea de asociación principal mediante una **línea discontinua (dashed line)**.
* **Agregaciones y Composiciones:** La composición (relación de parte-todo fuerte, equivalente a la dependencia de existencia de entidades débiles) se representa con un **rombo relleno** en el extremo del "todo" (padre) y una línea continua hacia el "componente" (hijo).

---

## 4. Representación de Cardinalidades y Participación (Crow's Foot / Patas de Gallo)

La notación de **Patas de Gallo (Information Engineering - IE)** es el estándar más extendido en la industria para diagramas de bases de datos relacionales lógicos y físicos debido a su excelente legibilidad. En esta notación, el extremo de cada línea (sea continua o discontinua) lleva símbolos que indican la cardinalidad mínima y máxima de la participación de las entidades:

| Símbolo en el Extremo | Cardinalidad Mínima | Cardinalidad Máxima | Significado en la Relación |
| :---: | :---: | :---: | :--- |
| **`||`** (Dos barras verticales) | 1 (Total) | 1 | **Exactamente Uno (1:1 Obligatorio)** |
| **`O|`** (Círculo y barra) | 0 (Parcial) | 1 | **Cero o Uno (0..1 Opcional)** |
| **`|<`** (Barras y pata de gallo) | 1 (Total) | N (Muchos) | **Uno o Muchos (1..N Obligatorio)** |
| **`O<`** (Círculo y pata de gallo) | 0 (Parcial) | N (Muchos) | **Cero o Muchos (0..N Opcional)** |

### Criterios de Ubicación:
* Los símbolos se leen en el extremo **opuesto** de la tabla de origen. Por ejemplo, en una relación de un departamento que tiene muchos empleados, el extremo de la línea que toca a la tabla `EMPLEADO` llevará la pata de gallo (`O<` o `|<`), y el extremo que toca a `DEPARTAMENTO` llevará la barra vertical (`||` o `O|`).

---

## 5. Tabla Resumen de Notaciones de Líneas y Flechas

Para facilitar la implementación en tu software de conversión de diagramas relacionales, utiliza esta tabla como guía de diseño e interpretación visual:

| Tipo de Línea / Flecha | Notación / Entorno | Significado Técnico en la Base de Datos | Ejemplo del Mundo Real |
| :--- | :--- | :--- | :--- |
| **Flecha Sólida Dirigida** (Desde FK a PK) | Elmasri-Navathe (Estándar Académico) | Restricción de Integridad Referencial. El origen es el atributo FK; la punta señala al atributo PK referenciado en la tabla padre. | `EMPLEADO.Dno` $\rightarrow$ `DEPARTAMENTO.NumeroDpto` |
| **Línea Continua Lógica** | CASE / IDEF1X / UML | **Relación Identificativa:** El hijo es una entidad débil. La FK del padre migra a formar parte de la clave primaria (`PK`) compuesta del hijo. | `EMPLEADO` (Padre) $\rightarrow$ `SUBORDINADO` (Hijo, PK incluye FK) |
| **Línea Discontinua Lógica** | CASE / IDEF1X / UML | **Relación No Identificativa:** Las entidades son independientes. La FK migra como atributo regular no clave de la tabla hija. | `DEPARTAMENTO` (Padre) $\rightarrow$ `EMPLEADO` (Hijo, FK no es PK) |
| **Línea Discontinua Recta** | UML | **Atributo de Vínculo:** Conecta la tabla o clase de asociación intermedia con la línea de la relación asociativa M:N. | Conexión de la tabla `TRABAJA_EN` con la línea entre `EMPLEADO` y `PROYECTO`. |
| **Línea con Flecha Discontinua** | UML | **Dependencia de Componentes / Retorno:** Representa relaciones de dependencia estática entre subsistemas/paquetes, o retornos de mensaje. | Un paquete de software que depende de un espacio de tablas (`tablespace`). |

---

## 6. Directrices de Calidad para el Generador Automático de Diagramas

Si estás construyendo una aplicación que genera diagramas relacionales, la lógica del layout debe observar las siguientes buenas prácticas para evitar "tuplas falsas visuales" y diagramas confusos:

1. **Evitar cruces innecesarios de líneas:** Las líneas discontinuas y continuas que representan las claves ajenas deben enrutarse preferiblemente de forma ortogonal.
2. **Claridad en los puntos de anclaje (Anchor Points):** En la notación académica, la flecha debe nacer exactamente de la celda del atributo FK y terminar exactamente en la celda del atributo PK. No debe apuntar a la tabla de manera genérica.
3. **Manejo de claves compuestas:** Si una clave ajena es compuesta (consta de varios atributos), las líneas correspondientes deben agruparse o salir como un único haz de flechas que se bifurca al llegar a la tabla padre, manteniendo la consistencia de los dominios correspondientes.
4. **Tratamiento de valores NULL en FK:** Si la clave externa admite valores nulos (participación parcial), se debe usar una línea discontinua (relación no identificativa) acompañada del símbolo opcional (`O`) en la notación de pata de gallo.
