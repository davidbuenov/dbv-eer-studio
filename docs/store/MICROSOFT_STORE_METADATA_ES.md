# 🏬 Microsoft Store — Metadatos de Publicación (Español)

> **Aplicación:** dbv-eer-studio  
> **Categoría:** Developer Tools (Herramientas para desarrolladores) / Education (Educación)  
> **Subcategoría:** Database Tools / Educational Software  
> **Precio:** Gratis (Open Source - MIT License)  

---

## 📌 Nombre y Títulos
* **Nombre de la App (Product Name):** `dbv-eer-studio`
* **Título promocional / Subtítulo (Short Title):** Suite Docente de Modelado EER, Relacional y Oracle SQL DDL
* **Publicador:** David Bueno Vallejo

---

## 📝 Descripción Corta (Short Description - Máx. 258 caracteres)
Editor web e interactivo de escritorio para Diagramas Entidad-Relación Extendido (EER), Modelo Relacional y generación de SQL DDL Oracle con algoritmo de 9 pasos pedagógicos e i18n ES/EN. 100% privado y offline.

---

## 📄 Descripción Completa (Full Description)

**dbv-eer-studio** es una suite completa e interactiva diseñada para estudiantes, profesores e ingenieros de software enfocados en el diseño y modelado de bases de datos relacionales.

Permite diseñar diagramas Entidad-Relación Extendido (EER) mediante un lenguaje DSL de código claro o de forma visual interactiva, convirtiéndolos automáticamente en esquemas del **Modelo Relacional** y exportando scripts **Oracle SQL DDL** listos para producción y entornos universitarios.

### 🌟 Características Principales

1. **Modelado EER Completo (Entidad-Relación Extendido)**:
   - Entidades fuertes y débiles con claves parciales.
   - Atributos simples, clave, derivados y multivaluados.
   - Relaciones binarias (1:1, 1:N, M:N) e identificativas con participaciones totales.
   - Relaciones N-arias (n > 2 entidades participantes).
   - Jerarquías de herencia (Especialización/Generalización disjunta 'd' y solapada 'o').
   - Tipos de Unión (Categorías 'u').

2. **Motor de Conversión Transparente EER ➔ Relacional (9 Pasos)**:
   - Mapeo automático basado estrictamente en el algoritmo formal universitario de Ramez Elmasri & Shamkant B. Navathe (*Fundamentos de Sistemas de Bases de Datos*).
   - **Inspector Pedagógico de 9 Pasos**: Explicación detallada paso a paso con trazabilidad en tiempo real sobre cada tabla y columna generada.

3. **Generador y Exportador Oracle SQL DDL**:
   - Sentencias DDL limpias y comentadas con sintaxis `CREATE TABLE`, `CONSTRAINT`, `PRIMARY KEY`, `FOREIGN KEY` y `ON DELETE CASCADE`.
   - Dialecto universitario Oracle SQL por defecto (`VARCHAR2`, `NUMBER`, `DATE`), además de dialectos PostgreSQL, MySQL, SQLite y ANSI SQL.

4. **Editor Bidireccional Código DSL ↔ Canvas**:
   - Sincronización en tiempo real entre el panel de código DSL y el canvas gráfico.
   - Persistencia completa de coordenadas 2D para mantener el diseño visual intacto.

5. **Internacionalización y Exportación Vectorial**:
   - Interfaz bilingüe completa (**Español** e **Inglés**).
   - Exportador de diagramas a formato vectorial SVG transparente e independiente.
   - 100% Privado y Offline: No requiere cuenta, no envía datos a servidores externos.

---

## 🚀 Características Clave (Product Features - Lista de viñetas)
* Editor interactivo de Diagramas EER y Modelo Relacional
* Motor de conversión automática de 9 Pasos formales Elmasri & Navathe
* Generador de scripts DDL Oracle SQL, PostgreSQL, MySQL y SQLite
* Inspector Pedagógico con explicación didáctica paso a paso
* Lenguaje DSL de código ligero sincronizado bidireccionalmente
* Exportación de diagramas a SVG de alta resolución
* Soporte bilingüe completo (Español / Inglés)
* Aplicación de escritorio nativa 100% offline y privada

---

## 🔍 Palabras Clave de Búsqueda (Search Keywords - Máx. 7)
1. `EER`
2. `Relacional`
3. `SQL DDL`
4. `Base de datos`
5. `Elmasri Navathe`
6. `Diagrama ER`
7. `Oracle SQL`

---

## 💻 Requisitos del Sistema (System Requirements)
* **Sistema Operativo:** Windows 10 versión 17763.0 o superior (x64)
* **Arquitectura:** x64
* **Memoria RAM:** 2 GB (Mínimo) / 4 GB (Recomendado)
* **Almacenamiento:** 50 MB de espacio disponible

---

## 📜 Notas de la Versión v1.4.0 (Release Notes)
- Corrección del algoritmo del Paso 8A: Retirada automática de PKs sintéticas al heredar claves primarias de superclases y reordenación del pipeline.
- Cobertura completa de internacionalización (ES/EN) en la interfaz estática e Inspector Pedagógico.
- Nuevo motor de exportación a SVG vectorial para el Modelo Relacional.
- Mejoras de rendimiento en el arrastre nativo de tarjetas en WebView2.
