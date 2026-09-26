# 🟢 Uptodown — Ficha de Publicación (Español)

> **Nombre:** dbv-eer-studio  
> **Categoría:** Desarrollo / Utilidades / Educación  
> **Licencia:** Gratis / Open Source (MIT)  
> **Plataforma:** Windows (Nativo 64-bit) / Web  

---

## 📌 Datos Principales
* **Nombre de la Aplicación:** `dbv-eer-studio`
* **Eslogan / Resumen:** Suite interactiva de modelado EER, Modelo Relacional y Oracle SQL DDL
* **Autor / Desarrollador:** David Bueno Vallejo
* **Sitio Web Oficial:** https://davidbuenov.github.io/dbv-eer-studio/
* **Repositorio GitHub:** https://github.com/davidbuenov/dbv-eer-studio
* **Featured Image (1024x500 PNG ES):** [`docs/store/screenshots/uptodown_featured_1024x500_es.png`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/screenshots/uptodown_featured_1024x500_es.png)

---

## 📝 Descripción Corta (Resumen para catálogo)
Diseña diagramas Entidad-Relación Extendido (EER), conviértelos automáticamente al Modelo Relacional con el algoritmo universitario de 9 Pasos y exporta scripts Oracle SQL DDL de forma 100% privada y offline.

---

## 📄 Descripción Detallada (Para Uptodown)

**dbv-eer-studio** es una herramienta de escritorio potente y gratuita diseñada para simplificar la enseñanza y el aprendizaje del modelado de bases de datos relacionales.

Combina un editor gráfico de diagramas **Entidad-Relación Extendido (EER)** con un panel de código DSL ligero, permitiendo alternar entre el diseño visual y textual de forma transparente. Incorpora un motor de conversión automático que transforma el esquema conceptual en un **Modelo Relacional** estricto y genera el script **Oracle SQL DDL** listo para ejecutar en cualquier SGBD.

### 💡 Puntos Destacados

- **Modelado EER Completo**: Soporta entidades fuertes, débiles, atributos clave, derivados, multivaluados, relaciones binarias (1:1, 1:N, M:N), relaciones identificativas, relaciones N-arias, jerarquías de herencia disjunta/solapada y tipos de unión.
- **Edición Visual como en otras Aplicaciones**: doble clic para editar cualquier elemento, selección por rectángulo, botón derecho para desplazar y Ctrl + rueda para hacer zoom.
- **Integridad Referencial Rigurosa**: ON DELETE CASCADE, SET NULL o NO ACTION según corresponda en cada paso del algoritmo.
- **Centro de Ayuda Integrado (F1)**: guía de uso, sintaxis del DSL, los 9 pasos y un prompt para generar diagramas con IA.
- **Inspector Pedagógico de 9 Pasos**: Muestra la explicación didáctica del algoritmo formal de Ramez Elmasri & Shamkant B. Navathe sobre cada tabla y columna.
- **Exportación SQL Multi-Dialecto**: Genera DDL limpio para Oracle SQL (con `CONSTRAINT` y tipos universitarios por defecto), PostgreSQL, MySQL y SQLite.
- **Exportación Vectorial SVG**: Descarga cualquier diagrama o modelo relacional en formato SVG de alta calidad.
- **Multilingüe y Privado**: Disponible en español e inglés, sin registro de usuarios, anuncios ni conexiones a servidores externos.

---

## 🏷️ Etiquetas / Tags
`base-de-datos`, `eer`, `modelo-relacional`, `oracle-sql`, `diagramas-er`, `herramienta-desarrollo`, `educacion-universitaria`

---

## 🆕 Novedades de la Versión v1.6.0
- Edición de elementos con doble clic o F2 y renombrado que actualiza todas las referencias.
- Rectángulo de selección, Ctrl + clic y movimiento en grupo; los atributos siguen a su entidad.
- Navegación estilo draw.io: botón derecho para desplazar y Ctrl + rueda para zoom.
- Resaltado en el código del elemento seleccionado.
- "Añadir y crear otro" y atributos de relación desde el formulario.
- Atributos clave de relación M:N en la PK y política ON DELETE rigurosa por paso.
- Atributo definidor de especializaciones: `spec d -> EMPLEADO [TipoTrabajo]`.
- Centro de Ayuda unificado (F1) en español e inglés.
