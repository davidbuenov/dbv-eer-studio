# Instrucciones del Proyecto para Claude Code — eer-studio

Este proyecto sigue la metodología **Spec-Driven Development (SDD)** con el framework **dbv-specs-ops**.
Toda la documentación, normas y especificaciones residen en el subdirectorio `dbv-specs-ops/`:

| Archivo | Propósito |
| --- | --- |
| `dbv-specs-ops/project.config.md` | Identidad del proyecto: nombre, autor, licencia y plantilla de cabeceras |
| `dbv-specs-ops/docs/MASTER_PROMPT.md` | Workflow obligatorio, normas y límites de desarrollo |
| `dbv-specs-ops/docs/SPECIFICATIONS.md` | Requisitos del proyecto actual (eer-studio) |
| `dbv-specs-ops/docs/ARCHITECTURE.md` | Stack técnico (React 19 + TypeScript + Vite + Tailwind CSS) |
| `dbv-specs-ops/docs/DESIGN.md` | Sistema de diseño visual (paleta indigo/slate de Tailwind) |
| `dbv-specs-ops/docs/WEB_TO_DESKTOP_MIGRATION.md` | Guía para la futura migración a escritorio (pospuesta, ver `SPECIFICATIONS.md §6`) |
| `dbv-specs-ops/memory.md` | Contexto y Decisiones cualitativas (ADRs) |
| `dbv-specs-ops/task.md` | Estado actual de tareas + Snapshot de Contexto |

## ⚠️ Reglas Core
**Lee `dbv-specs-ops/docs/MASTER_PROMPT.md` y sigue su flujo de trabajo estrictamente.**

> 🛠️ Framework SDD creado por **[David Bueno Vallejo](https://github.com/davidbuenov)** · [dbv-specs-ops](https://github.com/davidbuenov/dbv-specs-ops)
