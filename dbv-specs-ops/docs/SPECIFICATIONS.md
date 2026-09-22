# 📋 Especificaciones: eer-studio

> **Fase:** `/spec` (Especificación)
> **Estado:** Validado (Requisitos ampliados con feedback universitario: Oracle SQL, Ayuda Pedagógica de 9 Pasos, DSL Relacional bidireccional con coordenadas)
> **Última Revisión:** 2026-08-23

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
  - **Paso 2:** Entidades Débiles ➔ PK combinada + FK con `ON DELETE CASCADE`.
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

### 3.5. Compilación, Linter EER y Tolerancia a Fallos (Zero-Crash & Stale-while-error) `[NUEVO]`
- [ ] **Compilador y Linter EER**: Validación sintáctica y semántica de dos niveles previa a la propagación a Canvas y Modelo Relacional:
  - **Nivel 1 (Errores Bloqueantes):** Detección de comandos incompletos o sin nombre (`ent`, `rel`, `att`, `weak_ent`, `ident_rel`, etc.), asignaciones de atributo sin padre (`att Nombre ->`), enlaces huérfanos (`link`, `link Origen`) y coordenadas mal formadas.
  - **Nivel 2 (Advertencias Pedagógicas / Semánticas):** Enlaces hacia nodos no declarados, entidades sin atributos clave (`key_att`) o identificadores duplicados.
- [ ] **Estrategia Stale-while-error:** Si el usuario introduce un error de sintaxis al escribir, el Canvas EER y el Modelo Relacional conservan congelado el último estado compilado válido para evitar parpadeos o roturas.
- [ ] **Barra de Diagnósticos Informativa en `CodePanel`:** Indicador inferior visual con icono, severidad (error/warning/éxito) y número de línea con mensaje explicativo pedagógico internacionalizado (ES/EN). Clic en el error enfoca la línea en el editor.
- [ ] **Red de Seguridad en Profundidad:**
  - `ErrorBoundary` de React a nivel de aplicación que atrapa excepciones imprevistas, muestra panel de recuperación y protege el contenido del editor contra pérdidas de datos.
  - Normalización defensiva en `parser.ts` (nunca emitir nodos con `id` o `label` indefinidos).
  - Sanitización segura en `eerToRelational.ts` (`sanitizeName` con fallback seguro ante cadenas vacías/nulas).

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

