# 🏬 Microsoft Store — Listing Metadata (English)

> **Application:** dbv-eer-studio · **Store ID:** `9NFHVXW7ZRJC` · **Listing version:** v1.8.0
> **Category:** Developer Tools / Education
> **Subcategory:** Database Tools / Educational Software
> **Pricing:** Free (Open Source - MIT License)

> Partner Center limits to respect when pasting: description ≤ 10,000 characters · what's new ≤ 1,500 · each feature ≤ 200 (max 20) · short title ≤ 50 · screenshot caption ≤ 200 · 7 keywords.

---

## 📌 Application Titles
* **Product Name:** `dbv-eer-studio`
* **Short Title:** EER Studio: EER, Relational & SQL
* **Promotional Subtitle:** Extended ER, Relational & Oracle SQL DDL Modeling Suite
* **Publisher:** David Bueno Vallejo

---

## 📝 Short Description
Design Extended Entity-Relationship (EER) diagrams visually or with code, convert them to the Relational Model with Elmasri & Navathe's 9-step algorithm and export SQL DDL for Oracle, PostgreSQL, MySQL or SQLite. In Spanish and English, 100% private and offline.

---

## 📄 Full Description

**dbv-eer-studio** is a complete, interactive database design suite for computer science students, lecturers and software engineers working on relational database modeling.

Design Extended Entity-Relationship (EER) diagrams visually or with a lightweight text DSL, kept in sync both ways, automatically transform them into the **Relational Model**, and export **SQL DDL** scripts ready to run on Oracle and other DBMSs.

### 🌟 Key Features

1. **Complete EER modeling**:
   - Full Elmasri & Navathe notation: strong and weak entities with partial keys (dashed underline).
   - Simple, key, alternate key (UNIQUE), composite, derived and multivalued attributes, on relationships too.
   - Binary (1:1, 1:N, M:N), identifying, recursive with roles and higher-degree (ternary…) relationships, with total participation.
   - Disjoint and overlapping, total or partial specialization/generalization hierarchies, user-defined or attribute-defined.
   - Union types (categories).
   - Teaching warnings: weak entity without a partial key or identifying relationship, recursive relationship without roles…

2. **Comfortable visual editing, like other apps**:
   - Double-click (or F2) any element to edit it; renaming updates every reference.
   - Rectangle selection, Ctrl + click and group moves; attributes follow their entity.
   - Right button to pan the canvas and Ctrl + wheel (or touchpad pinch) to zoom.
   - Selecting an element highlights its lines in the code.
   - "Add and create another" to enter attributes in a row without overlaps.
   - Undo and redo (Ctrl + Z / Ctrl + Y) for every action, and full screen (F11).

3. **Transparent EER ➔ Relational conversion (9 steps)**:
   - Automatic mapping based on Ramez Elmasri & Shamkant B. Navathe's formal algorithm (*Fundamentals of Database Systems*).
   - Educational 9-step guide: every table explains which rule created it.
   - Rigorous referential integrity: ON DELETE CASCADE only for existential dependency; SET NULL or NO ACTION otherwise.
   - Composite foreign keys, UNIQUE constraints (1:1 relationships are truly 1:1) and editable column types that survive diagram changes.

4. **Multi-DBMS SQL DDL generator**:
   - Oracle SQL by default (`VARCHAR2`, `NUMBER`, `CONSTRAINT`), plus PostgreSQL, MySQL, SQLite and ANSI SQL.
   - Clean, commented scripts stating the rule applied to each table.

5. **Built-in help, languages and export**:
   - Help Center (F1) with a usage guide, DSL syntax, the 9 steps and a prompt to generate diagrams with AI.
   - Full **Spanish** and **English** interface.
   - Vector SVG export of diagrams.
   - 100% private and offline: no account, no ads and no data sent to any server.

---

## 🚀 Product Features (one per line)
* Interactive EER diagram and Relational Model editor
* Full EER notation: partial keys, roles, composite attributes, alternate keys and partial specialization
* Visual editing with double-click, rectangle selection and group moves
* Undo / redo (Ctrl + Z / Ctrl + Y) and full screen
* Automatic conversion with Elmasri & Navathe's 9 formal steps
* Educational guide explaining the rule applied to every table
* Rigorous ON DELETE policy: CASCADE, SET NULL or NO ACTION as each case requires
* SQL DDL scripts for Oracle, PostgreSQL, MySQL, SQLite and ANSI SQL
* Lightweight DSL code kept in sync both ways with the diagram
* Built-in Help Center (F1) with usage guide and AI prompt
* High-resolution SVG diagram export
* Full bilingual interface (Spanish / English)
* 100% offline and private native application

---

## 🔍 Search Keywords (Max 7)
1. `EER`
2. `Relational`
3. `SQL DDL`
4. `Database`
5. `Elmasri Navathe`
6. `ER Diagram`
7. `Oracle SQL`

---

## 🖼️ Screenshots (1920×1080) and Captions

Upload in this order from `docs/store/screenshots/` (`_en` version):

| # | File | Caption (≤ 200 characters) |
| --- | --- | --- |
| 1 | `screenshot_01_eer_diagram_en.png` | Design EER diagrams visually or with code: selecting elements highlights their lines in the editor. |
| 2 | `screenshot_05_edit_element_en.png` | Edit any element with a double-click: relationships of any degree with each entity's cardinality, participation and role. |
| 3 | `screenshot_02_relational_model_en.png` | Automatic conversion to the Relational Model with Elmasri & Navathe's 9 formal steps. |
| 4 | `screenshot_04_step_inspector_en.png` | Educational guide: every table explains which step of the algorithm created it. |
| 5 | `screenshot_03_sql_ddl_export_en.png` | Export commented SQL DDL scripts for Oracle, PostgreSQL, MySQL, SQLite or ANSI SQL. |
| 6 | `screenshot_06_help_center_en.png` | Built-in Help Center (F1): gestures, shortcuts, syntax, 9 steps and AI prompt. |

**Featured image (Hero, 16:9):** `featured_banner_1360x768_en.png`.

---

## 💻 System Requirements
* **Operating System:** Windows 10 version 17763.0 or higher (x64)
* **Architecture:** x64
* **RAM:** 2 GB (Minimum) / 4 GB (Recommended)
* **Storage:** 50 MB available space
* **Input:** mouse and keyboard, or touchpad (touch support for tablets is planned for v1.9.0)

---

## 📜 Version v1.8.0 Release Notes ("What's new in this version")
- **Full EER notation**: weak-entity partial keys (dashed underline), partial specialization (single line), roles in recursive relationships and alternate keys (UNIQUE).
- **Composite attributes** drawn with their components and mapped to columns; create them from the form ("Belongs to").
- **Ternary and higher-degree relationships** from the form, with each entity's cardinality, participation and role.
- **Undo and redo** (Ctrl + Z / Ctrl + Y) for every action: move, create, edit, delete or clear.
- **More faithful relational model**: composite foreign keys, UNIQUE constraints in the SQL (a 1:1 no longer behaves as 1:N) and column types that survive diagram changes and are saved in the file.
- **Teaching warnings** for weak entities, partial keys and recursive relationships without roles.
- **Full screen** (F11) and extended help with a reference diagram of the whole Elmasri notation.
- Fixes: the relational model no longer lags one change behind the diagram; recursive relationships no longer draw overlapping lines or duplicate constraints.