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
- **Inspector Pedagógico de 9 Pasos**: Muestra la explicación didáctica del algoritmo formal de Ramez Elmasri & Shamkant B. Navathe sobre cada tabla y columna.
- **Exportación SQL Multi-Dialecto**: Genera DDL limpio para Oracle SQL (con `CONSTRAINT` y tipos universitarios por defecto), PostgreSQL, MySQL y SQLite.
- **Exportación Vectorial SVG**: Descarga cualquier diagrama o modelo relacional en formato SVG de alta calidad.
- **Multilingüe y Privado**: Disponible en español e inglés, sin registro de usuarios, anuncios ni conexiones a servidores externos.

---

## 🏷️ Etiquetas / Tags
`base-de-datos`, `eer`, `modelo-relacional`, `oracle-sql`, `diagramas-er`, `herramienta-desarrollo`, `educacion-universitaria`

---

## 🆕 Novedades de la Versión v1.5.0
- Compilador y Linter interactivo para el Modelo Relacional con verificación de integridad referencial.
- Barra inferior de diagnósticos en vivo con navegación directa a la línea con error o advertencia.
- Tolerancia a fallos Stale-while-error: eliminación de parpadeos y desaparición de tablas al editar.
- Red de seguridad Zero-Crash con ErrorBoundary y blindaje ante edición de entidades incompletas.
