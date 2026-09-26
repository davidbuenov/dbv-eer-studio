# DBV EER Studio

**[🇪🇸 Español](./README.md) · 🇬🇧 English**

[![Release](https://img.shields.io/github/v/release/davidbuenov/dbv-eer-studio?display_name=tag&sort=semver)](https://github.com/davidbuenov/dbv-eer-studio/releases)
[![Live demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4285F4?logo=github&logoColor=white)](https://davidbuenov.github.io/dbv-eer-studio/)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-10%2F11-0078D6?logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-.deb%20%2F%20AppImage%20%2F%20.rpm-FCC624?logo=linux&logoColor=black)
![macOS](https://img.shields.io/badge/macOS-unsigned%20.dmg-000000?logo=apple&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success)
[![Last Update](https://img.shields.io/github/last-commit/davidbuenov/dbv-eer-studio?label=last%20update)](https://github.com/davidbuenov/dbv-eer-studio/commits/main)
[![Framework](https://img.shields.io/badge/framework-dbv--specs--ops-111827?logo=github&logoColor=white)](https://github.com/davidbuenov/dbv-specs-ops)

> A database teaching suite: design **Enhanced Entity-Relationship (EER)** diagrams, convert them to the **Relational Model** by applying the 9 formal steps, and export ready-to-run **SQL DDL**. Available as a web app and a native desktop app.

**[🌐 Try the web version (no install required)](https://davidbuenov.github.io/dbv-eer-studio/)**

[![EER Studio demo video](https://img.youtube.com/vi/oFJYiJw_kRE/hqdefault.jpg)](https://youtu.be/oFJYiJw_kRE)

*Click the image to watch the full video on YouTube (in Spanish).*

---

## 📑 Table of Contents

- [Download and install](#-download-and-install)
  - [Windows](#-windows)
  - [Linux](#-linux)
  - [macOS](#-macos)
  - [Browser](#-browser-no-install)
- [About the project](#-about-the-project)
- [Key features](#-key-features)
- [The 9 formal steps](#-the-9-formal-steps)
- [DSL syntax](#-dsl-syntax)
- [Bundled examples](#-bundled-examples)
- [For developers](#-for-developers)
- [Project structure](#-project-structure)
- [Changelog](#-changelog)
- [License](#-license)
- [Author and credits](#-author-and-credits)

---

## 🚀 Download and install

**You don't need Node.js, Rust, or any development tooling.** The **DBV EER Studio** installer ships everything required, including the system rendering engine.

> Just want to try it? The [web version](https://davidbuenov.github.io/dbv-eer-studio/) is the same application and needs no installation.

### 🪟 Windows

#### 1️⃣ Download

**[⬇️ See all versions (Releases)](https://github.com/davidbuenov/dbv-eer-studio/releases)**

Download one of the two installers from the latest version:

| File | When to use it |
| --- | --- |
| `dbv-eer-studio_x.y.z_x64-setup.exe` | **Recommended.** NSIS installer, no administrator rights needed (installs for your user only). |
| `dbv-eer-studio_x.y.z_x64_en-US.msi` | MSI package, useful for classroom or corporate deployment via group policy. |

Your browser may warn that the file "isn't commonly downloaded" or "isn't trusted" (Microsoft Edge/Chrome SmartScreen). This is normal for new installers without a commercial signing certificate: in Edge, open the downloads panel and click **Show more → Keep**.

#### 2️⃣ Install

Double-click the downloaded installer. Windows may also show an "Unknown publisher" warning when you run it — click **More info → Run anyway**.

#### 3️⃣ Update

From here on you no longer need to come back to this page for every new version. Open the **Credits** panel (top bar) and click **Check for updates**. The check is always on demand — it never runs by itself at startup.

- If you already have the latest version: **"You already have the latest version."**
- If a new one exists: the button becomes **Install update** — one click downloads, installs, and restarts the app for you, without going through the browser or the Releases page.

### 🐧 Linux

**[⬇️ Download the `.deb`, `.AppImage`, or `.rpm` from Releases](https://github.com/davidbuenov/dbv-eer-studio/releases)** — built automatically for every version via CI.

- **`.deb` (Debian, Ubuntu, Linux Mint and derivatives):** `sudo dpkg -i dbv-eer-studio_x.y.z_amd64.deb`, or double-click it in your file manager.
- **`.rpm` (Fedora, openSUSE, RHEL and derivatives):** `sudo rpm -i dbv-eer-studio-x.y.z-1.x86_64.rpm`.
- **`.AppImage` (any distribution):** make it executable (`chmod +x dbv-eer-studio_x.y.z_amd64.AppImage`) and run it directly. It is portable and needs no installation.

> **Honest note:** CI builds these packages for every release, but they **have not yet been tested on a real Linux machine** — development and manual testing have been done on Windows. If you hit a problem, [open an issue](https://github.com/davidbuenov/dbv-eer-studio/issues); that is exactly the kind of report this project needs.

### 🍎 macOS

**[⬇️ Download the `.dmg` from Releases](https://github.com/davidbuenov/dbv-eer-studio/releases)** — `dbv-eer-studio_x.y.z_universal.dmg`, universal (Apple Silicon + Intel), built automatically via CI.

It is neither signed nor notarized: Apple signing and notarization require a paid account (Apple Developer Program, $99/year) that this project does not use, so macOS will block it the first time ("cannot be opened because the developer cannot be verified"). To open it:

- Right-click (or `Ctrl` + click) `DBV EER Studio.app` → **Open** → confirm in the dialog. Only needed the first time.
- Or, from Terminal: `xattr -cr "DBV EER Studio.app"` before opening it.

> **Honest note:** as with Linux, CI produces the `.dmg` but it **has not been tested on a real Mac** yet. The native macOS menu (App/File/Edit/Window/Help) is implemented and compiles, but has not been verified at runtime.

If you'd rather build your own executable:

```bash
git clone https://github.com/davidbuenov/dbv-eer-studio.git
cd dbv-eer-studio
npm install
npm run desktop:build
```

Requires Xcode Command Line Tools (`xcode-select --install`), [Rust](https://rustup.rs/), and Node.js 18+ — see [For developers](#-for-developers).

### 🌐 Browser (no install)

**[Open DBV EER Studio in your browser](https://davidbuenov.github.io/dbv-eer-studio/)**

Same application, 100% client-side: nothing is uploaded to any server. Saving and opening `.eer` files uses the File System Access API on modern browsers (Chrome, Edge), with a download/upload fallback elsewhere.

---

## 📌 About the project

**DBV EER Studio** is a teaching suite for **Database** courses. It covers the full path taught in class, with one distinctive trait: **it explains every step instead of just handing over the result**.

```text
EER Diagram  ──►  Relational Model  ──►  SQL DDL
(conceptual)      (logical, 9 steps)     (physical, multi-DBMS)
```

It implements the **9 formal steps** algorithm presented in *"Fundamentals of Database Systems"* by **Ramez Elmasri** and **Shamkant B. Navathe**, the standard reference in Spanish universities. Every generated table and foreign key records **which rule produced it and why**, so students can follow the reasoning instead of trusting a black box.

**Built with:**

- **Frontend:** React 19 + TypeScript (strict mode) + Vite + Tailwind CSS.
- **Desktop:** Rust + Tauri v2 (native system rendering engine: WebView2 on Windows, WebKitGTK on Linux, WKWebView on macOS) — no Electron.
- **Tests:** Vitest, covering the 9 conversion steps and the SQL generator.
- **Architecture:** 100% client-side, no backend and no telemetry. Your diagrams never leave your machine.

![Architecture](assets/arquitectura.svg)

---

## ✨ Key features

### EER diagram design

- **Bidirectional DSL ↔ Canvas editor:** write the code and the diagram is drawn instantly; drag a node on the canvas and the coordinates update themselves in the code.
- **Visual toolbar:** insert entities, relationships, and attributes with a click on the canvas and configure them through forms, without writing a line of DSL.
- **Full Chen notation:** strong and weak entities, regular and identifying relationships, simple/key/derived/multivalued attributes, cardinalities (1, N, M), total participation, specialization hierarchies (disjoint and overlapping), and union types/categories.
- **Edit directly on the diagram:** double-click (or `F2`) any element to open its form and rename it, change a relationship's cardinalities and participation, turn an entity into a weak one, change an attribute's owner, etc. Renaming updates every reference in the DSL.
- **Locate every element in the code:** selecting a node highlights its DSL lines and scrolls the editor to them.
- **Multi-selection:** drag on the background to draw a **selection rectangle** (it selects what is fully inside) or use `Ctrl` + click to add or remove nodes; dragging moves the whole group and `Delete` removes it.
- **Attributes follow their entity or relationship** when you drag it (`Alt` + drag moves only the node).
- **Attributes in a row:** "Add and create another" keeps the form open for the next attribute and places it 100 px to the right; attributes are never created on top of another node.
- **Relationship attributes** from the visual form (key ones too, which join the PK in M:N and n-ary relationships).
- **draw.io-style navigation:** right (or middle) button + drag pans the canvas, so does the wheel (`Shift` = horizontal), and `Ctrl` + wheel (or touchpad pinch) zooms towards the cursor. Plus +/− controls, reset, and fit-to-content.

### Relational Model conversion

- **9 formal steps engine** with full traceability: every table, column, and foreign key records which step generated it.
- **Teaching inspector:** the "9-Step Guide" tab in Help summarises the algorithm, and the 📖 icon on every table opens the specific explanation of the rule that created it.
- **Dedicated relational editor:** the Relational Model has its own text DSL, also bidirectional and with persistent coordinates.
- **Interactive highlighting:** hovering a table highlights its referential integrity connections.

### Export

- **Multi-DBMS SQL DDL:** Oracle SQL (the primary dialect in university courses), PostgreSQL, MySQL, SQLite, and ANSI SQL, with `CONSTRAINT` clauses, dialect-specific types, and comments explaining the rule applied.
- **Vector SVG** of both the EER diagram and the Relational Model, ready to embed in a report or thesis.
- **`.eer` files** storing the diagram and the coordinates of both views.

### Interface

- **Unified Help Center** (**Help** button or `F1`), with tabs: *Using the editor* (gestures, keyboard shortcuts and workflow), *Syntax* of both DSLs, *9-Step Guide*, *AI Prompt* (so ChatGPT, Claude, or Gemini can generate the DSL from a problem statement) and *About*.
- **Spanish and English** across the whole interface, help and AI prompt, switchable from the header; the chosen language is remembered.
- **Always on top** (desktop only) to keep the diagram visible next to another application.

---

## 🎓 The 9 formal steps

| Step | Rule | Result |
| --- | --- | --- |
| **1** | Strong entities | One table per entity, with its primary key |
| **2** | Weak entities | Table with composite PK: owner's FK + partial key (`ON DELETE CASCADE`: the weak entity cannot exist without its owner) |
| **3** | 1:1 relationships | FK propagated to the total-participation side, with a `UNIQUE` constraint (`NO ACTION` if mandatory, `SET NULL` if optional) |
| **4** | 1:N relationships | FK propagated from the 1 side to the N side; relationship attributes migrate to the N side. Total participation ⇒ `NOT NULL` + `ON DELETE NO ACTION`; partial ⇒ `ON DELETE SET NULL` |
| **5** | M:N relationships | Bridge table whose PK combines the FKs of both entities and the relationship's key attributes (`ON DELETE NO ACTION`) |
| **6** | Multivalued attributes | Separate table, to avoid violating 1NF |
| **7** | N-ary relationships (n > 2) | N-way table; the PK combines the FKs of entities without cardinality 1 |
| **8** | Specialization / generalization | Inheritance mapping options 8A–8D; the defining attribute is a column of the superclass |
| **9** | Categories (union types) | Category table with a surrogate key |

`ON DELETE CASCADE` is only used when the child row cannot exist without its parent (Steps 2, 6 and 8A); otherwise `SET NULL` or `NO ACTION` is used so independent data is never deleted in a chain. You can change the action of any FK in the relational DSL (`ON DELETE CASCADE | SET NULL | RESTRICT | NO ACTION`).

The complete formal specification lives in [`dbv-specs-ops/docs/eer-to-relational-mapping.md`](./dbv-specs-ops/docs/eer-to-relational-mapping.md).

---

## ⌨️ DSL syntax

Quick reference — the complete guide is built into the app (**Help → Syntax**).

```text
// Entities
ent EMPLEADO (400, 300)
weak_ent DEPENDIENTE (100, 300)

// Attributes
key_att DNI -> EMPLEADO (350, 220)
att Nombre -> EMPLEADO (450, 220)
derived_att Edad -> EMPLEADO (400, 180)
multivalued_att Telefono -> EMPLEADO (300, 180)
key_att Vuelta -> CIRCULA (700, 120)   // key attribute of an M:N relationship

// Relationships and connections
rel TRABAJA_PARA (550, 300)
link EMPLEADO TRABAJA_PARA "N"
link DEPARTAMENTO TRABAJA_PARA "1"

// Weak entity and identifying relationship
ident_rel TIENE_DEP (250, 300)
link EMPLEADO TIENE_DEP "1"
link DEPENDIENTE TIENE_DEP "N" [total]

// Hierarchies
spec d -> EMPLEADO                  // 'd' disjoint, 'o' overlapping; user-defined
spec d -> EMPLEADO [TipoTrabajo]    // attribute-defined (defining attribute)
link d INGENIERO

// Categories
union u
link PERSONA u
link u PROPIETARIO
```

The DSL keywords are language-independent; the entity names above are just the ones used in the bundled Spanish example. The `(x, y)` coordinates are optional: omit them and the app places the element automatically, writing the coordinates as soon as you drag it.

---

## 📁 Bundled examples

The [`ejemplos/`](ejemplos/) folder contains files ready to open from the app (**File → Open**):

- **[`202511ER_Hotel.eer`](ejemplos/202511ER_Hotel.eer)** — Case study *HOTELES ROYAL UMA*: rooms, services, staff, and bookings. A complete diagram with weak entities, hierarchies, and M:N relationships, to see the conversion on a realistic case.
- **[`Prompt_para_crear_gems.md`](ejemplos/Prompt_para_crear_gems.md)** — Prompt (in Spanish) optimized to generate the DSL with an AI from a natural-language problem statement.

> 💡 **For instructors:** the prompt in the `ejemplos/` folder turns assignment statements into diagrams students can review and correct — a good starting point for "find the modelling error" exercises.

---

## 🧑‍💻 For developers

Everything above is all a regular user needs. The following only applies if you want to **modify the source code or build it yourself**.

### Requirements

- **Node.js:** `v18+` and `npm`
- **Rust:** `rustc` and `cargo` ([rustup.rs](https://rustup.rs/)) — desktop app only
- **Windows:** Visual Studio C++ Build Tools (MSVC) and the [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (preinstalled on Windows 11)

### Run in development mode

Use the scripts included in the project root:

**Windows:**

```cmd
start.cmd
```

**macOS / Linux:**

```bash
./start.sh
```

Or manually:

```bash
npm install
npm run dev            # Web version at http://localhost:5173
npm run desktop:dev    # Desktop app (Tauri)
```

To stop it: `stop.cmd` (Windows) or `./stop.sh` (macOS/Linux).

### Build

```bash
npm run build            # Web → dist/ folder (any static server)
npm run desktop:build    # Desktop → src-tauri/target/release/bundle/
```

### Tests and quality

```bash
npm test        # Vitest suite: 9 conversion steps + SQL generator
npm run lint    # ESLint
npx tsc -b      # Type check (strict TypeScript)
```

### Publishing a new version

1. Bump the version **in all four places at once** — `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src/components/ModalCredits.tsx` — and move the `[Sin publicar]` section of [`dbv-specs-ops/CHANGELOG.md`](./dbv-specs-ops/CHANGELOG.md) to `[x.y.z] — date`.
2. `git commit`, `git tag vx.y.z`, `git push origin main --tags`.
3. The three workflows in `.github/workflows/` (`release-windows.yml`, `release-linux.yml`, `release-macos.yml`) build each platform and upload the artifacts to the Release.
4. `deploy-pages.yml` publishes the web version to GitHub Pages.

The updater's private signing key is **not in this repository** — it is generated and kept by the project maintainer (`npx tauri signer generate`).

### Methodology

The project follows **Spec-Driven Development** with the [dbv-specs-ops](https://github.com/davidbuenov/dbv-specs-ops) framework. All engineering documentation lives in [`dbv-specs-ops/`](./dbv-specs-ops/): specifications, architecture, technical decisions (ADRs), and backlog. It is written in Spanish.

---

## 📂 Project structure

```text
dbv-eer-studio/
├── src/                          # React + TypeScript application
│   ├── EERDiagramer.tsx          # Root component: state and tabs
│   ├── components/               # Canvas, Toolbar, CodePanel and modals
│   │   ├── relational/           # Relational Model viewer and step inspector
│   │   └── sql/                  # SQL DDL preview and export
│   ├── hooks/                    # Parser, files, canvas, toolbar, modals
│   ├── i18n/                     # ES/EN dictionaries and language context
│   ├── utils/
│   │   ├── parser.ts             # EER DSL → nodes/links
│   │   ├── codeGenerator.ts      # Nodes/links → EER DSL (critical counterpart)
│   │   └── relational/           # 9-step engine, SQL DDL, geometry and SVG export
│   └── types/                    # EER and relational domain models
├── src-tauri/                    # Rust code and Tauri v2 configuration
├── .github/workflows/            # CI: per-platform release + Pages deployment
├── ejemplos/                     # Sample .eer diagrams and AI prompt
├── dbv-specs-ops/                # SDD specifications and engineering framework
│   ├── docs/                     # SPECIFICATIONS, ARCHITECTURE, DESIGN, 9 steps
│   ├── task.md                   # Backlog and status snapshot
│   ├── memory.md                 # Architecture decisions (ADRs)
│   └── CHANGELOG.md              # Version history
├── start.cmd / stop.cmd          # Windows run scripts
├── start.sh / stop.sh            # Linux/macOS run scripts
├── LICENSE                       # MIT license
└── README.md                     # Spanish README
```

---

## 📋 Changelog

See [`dbv-specs-ops/CHANGELOG.md`](./dbv-specs-ops/CHANGELOG.md) for the complete version-by-version history of changes.

---

## 📄 License & Privacy

- [MIT](./LICENSE) license.
- Privacy Policy: [PRIVACY_POLICY.md](./PRIVACY_POLICY.md).

Copyright (c) 2025-2026 David Bueno Vallejo

---

## ✍️ Author and credits

### 👤 David Bueno Vallejo

> Original idea, architecture, project direction, and testing on real machines.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-davidbueno-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/davidbueno/)
[![Website](https://img.shields.io/badge/Web-davidbuenov.com-6366f1?logo=googlechrome&logoColor=white)](https://davidbuenov.com)
[![GitHub](https://img.shields.io/badge/GitHub-davidbuenov-181717?logo=github&logoColor=white)](https://github.com/davidbuenov)

### 🤝 Contributors

- **Enrique Soler Castillo** — thank you for testing the application thoroughly and for your proposals, which shaped version 1.6.0: editing elements from the diagram, multi-selection, locating each element in the DSL, fast attribute creation, relationship key attributes in the PK, the specialization defining attribute, and a rigorous `ON DELETE` policy instead of a blanket `CASCADE`.

### 📚 Academic reference

The conversion engine implements the 9 formal steps algorithm presented in:

> **"Fundamentals of Database Systems"** — Ramez Elmasri and Shamkant B. Navathe.

### 🤖 Built with AI

| Tool | Role |
| --- | --- |
| **[Claude Code](https://claude.com/claude-code)** · *Anthropic* | Pair programming: 9-step conversion engine, Relational Model SVG exporter, internationalization, Tauri packaging, and the `/ship` cycle. |
| **Gemini & Antigravity** · *Google DeepMind* | Initial development of the web application and the EER diagram editor. |

> 🛠️ Built with the **[dbv-specs-ops](https://github.com/davidbuenov/dbv-specs-ops)** framework — Spec-Driven Development, free and open.
