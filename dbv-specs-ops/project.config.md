# 🪪 Project Config

> This file is read automatically by the AI at session start.
> It defines the identity, metadata, and routing standards for dbv-eer-studio.

---

## Project Identity

- **Name:** dbv-eer-studio
- **Description:** Editor web e interactivo de escritorio para Diagramas Entidad-Relación Extendido (EER), Modelo Relacional y SQL DDL con lenguaje DSL propio y edición bidireccional código ↔ canvas.
- **Author / Company:** David Bueno Vallejo · https://github.com/davidbuenov
- **License:** MIT
- **Languages:** TypeScript, HTML, CSS, Rust
- **Technologies / Stack:** React 19, Vite (rolldown-vite), TypeScript 5.9, Tailwind CSS 3.4, Tauri v2 (Rust), Lucide React, File System Access API
- **Agent Readiness (Web):** No
- **Framework Version:** 2.6.0

---

## Model Routing Guidelines (V2.5.0)

To optimize OpEx (Token Burn) and latency, refer to this routing strategy when executing project development tasks:

| Development Phase | Required Reasoning Complexity | Recommended Model Class | Example Models |
| --- | --- | --- | --- |
| `/spec` (Specifications) | Very High | Advanced Reasoning / Frontier Models | Gemini 3.1 Pro, Claude Opus 5, GPT-5.6 Sol |
| `/plan` (Planning / Architecture) | Very High | Advanced Reasoning / Frontier Models | Gemini 3.1 Pro, Claude Opus 5, GPT-5.6 Sol |
| `/build` (Code Implementation) | Medium | Fast, high-accuracy coding models | Gemini 3.5 Flash, Claude Sonnet 5, GPT-5.6 Terra |
| `/test` (Conventional Tests / Evals) | Medium-Low | Fast & cheap models | Gemini 2.5 Flash-Lite, Claude Haiku 5, GPT-5.6 Luna |
| `/code-simplify` (Security & Refactor) | High | Security-conscious reasoning models | Gemini 3.1 Pro, Claude Sonnet 5, GPT-5.6 Sol |
| `/ship` (Documentation, Changelog) | Low | Fast, text-optimized models | Gemini 2.5 Flash-Lite, Claude Haiku 5, GPT-5.6 Luna |

---

## File Header Template

All source files must include a header comment in the appropriate syntax for the language.

**Example (TypeScript / TSX):**
```typescript
// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================
```

**Example (HTML):**
```html
<!--
  dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
  Copyright (c) 2025-2026 David Bueno Vallejo
  Licensed under the MIT License. See LICENSE for details.
  Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
-->
```

---

> 🛠️ Framework SDD creado por **[David Bueno Vallejo](https://github.com/davidbuenov)** — libre y gratuito · [dbv-specs-ops](https://github.com/davidbuenov/dbv-specs-ops)
