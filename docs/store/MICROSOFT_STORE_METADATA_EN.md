# 🏬 Microsoft Store — Listing Metadata (English)

> **Application:** dbv-eer-studio  
> **Category:** Developer Tools / Educational Software  
> **Subcategory:** Database Tools / Educational Software  
> **Pricing:** Free (Open Source - MIT License)  

---

## 📌 Application Titles
* **Product Name:** `dbv-eer-studio`
* **Short Title / Subtitle:** Extended ER, Relational & Oracle SQL DDL Modeling Suite
* **Publisher:** David Bueno Vallejo

---

## 📝 Short Description (Max 258 chars)
Interactive Extended Entity-Relationship (EER), Relational Model & Oracle SQL DDL designer with a formal 9-step educational inspector and full ES/EN i18n. 100% offline & private.

---

## 📄 Full Description

**dbv-eer-studio** is a comprehensive, interactive database design suite tailored for computer science students, professors, and software engineers working with relational database modeling.

Design Extended Entity-Relationship (EER) diagrams using a lightweight text DSL or interactive visual canvas, automatically transform them into **Relational Model** schemas, and export production-ready **Oracle SQL DDL** scripts.

### 🌟 Key Features

1. **Complete EER Modeling (Extended Entity-Relationship)**:
   - Strong and weak entities with partial key attributes.
   - Simple, key, derived, and multivalued attributes.
   - Binary (1:1, 1:N, M:N) and identifying relationships with total participation.
   - N-ary relationships (n > 2 participating entities).
   - Specialization & Generalization hierarchies (disjoint 'd' and overlapping 'o').
   - Union Types (Categories 'u').

2. **Transparent EER ➔ Relational Mapping Engine (9 Steps)**:
   - Automatic mapping strictly based on the formal university algorithm by Ramez Elmasri & Shamkant B. Navathe (*Fundamentals of Database Systems*).
   - **9-Step Educational Inspector**: Step-by-step didactic explanation with real-time traceability for every generated table and column.

3. **Oracle SQL DDL Generator & Exporter**:
   - Clean, commented DDL scripts featuring `CREATE TABLE`, `CONSTRAINT`, `PRIMARY KEY`, `FOREIGN KEY`, and `ON DELETE CASCADE`.
   - Default university Oracle SQL dialect (`VARCHAR2`, `NUMBER`, `DATE`), alongside PostgreSQL, MySQL, SQLite, and ANSI SQL support.

4. **Bidirectional Code DSL ↔ Canvas Editor**:
   - Real-time synchronization between the text DSL code panel and the graphical canvas.
   - Full 2D coordinate persistence to preserve layout positioning.

5. **Internationalization & Vector Export**:
   - Full bilingual interface (**English** and **Spanish**).
   - Transparent, high-resolution SVG diagram exporter.
   - 100% Offline & Private: No sign-up required, no telemetric data sent to external servers.

---

## 🚀 Product Features (Bullet list)
* Interactive EER Diagram and Relational Model editor
* Formal 9-Step Elmasri & Navathe automatic transformation engine
* Oracle SQL, PostgreSQL, MySQL, and SQLite DDL script generator
* Educational 9-Step Inspector with step-by-step explanations
* Lightweight text DSL synchronized bidirectionally with visual canvas
* High-resolution SVG diagram vector export
* Complete bilingual support (English / Spanish)
* Native desktop app 100% offline and privacy-focused

---

## 🔍 Search Keywords (Max 7)
1. `EER`
2. `Relational`
3. `SQL DDL`
4. `Database Design`
5. `Elmasri Navathe`
6. `ER Diagram`
7. `Oracle SQL`

---

## 💻 System Requirements
* **OS:** Windows 10 version 17763.0 or higher (x64)
* **Architecture:** x64
* **RAM:** 2 GB (Minimum) / 4 GB (Recommended)
* **Storage:** 50 MB available space

---

## 📜 Version v1.6.0 Release Notes ("What's new in this version")
- **Edit directly on the diagram**: double-click (or F2) any element to rename it, change cardinalities and participation, turn an entity into a weak one, or change an attribute's owner. Renaming updates every reference in the code.
- **Selection like other apps**: drag a selection rectangle on the background, Ctrl + click for multi-selection and group moves; attributes follow their entity when dragged.
- **draw.io-style navigation**: right button to pan, wheel to scroll and Ctrl + wheel (or touchpad pinch) to zoom the diagram.
- **Locate every element in the code**: selecting it highlights its lines in the editor.
- **Faster attributes**: "Add and create another", relationship attributes from the form and automatic overlap-free placement.
- **More rigorous mapping**: key attributes of an M:N relationship join the PK, and the ON DELETE policy is chosen per step (CASCADE, SET NULL or NO ACTION) instead of a blanket CASCADE.
- **Specialization defining attribute**: `spec d -> EMPLOYEE [JobType]`.
- **Unified Help Center** (F1): editor usage, syntax, 9-step guide, AI prompt and credits, all in Spanish and English.
