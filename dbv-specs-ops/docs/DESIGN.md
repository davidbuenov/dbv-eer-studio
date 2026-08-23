# 🎨 Sistema de Diseño: eer-studio

> **Fase:** `/spec` (Especificación Visual)
> **Estado:** Validado (extraído del código existente, Tailwind CSS por defecto)
> **Última Revisión:** 2026-08-23
> **Aplica a:** SPA web (React + Tailwind).

---

> 📐 Inspirado en el estándar **[design.md](https://github.com/google-labs-code/design.md)** de Google Labs.

---

```yaml
version: alpha
name: "eer-studio"
description: "Interfaz utilitaria y neutra tipo herramienta de productividad: paleta índigo/pizarra por defecto de Tailwind, sin identidad de marca propia todavía."

colors:
  primary:      "#4F46E5"   # indigo-600 — color de acción principal (botones, header activo)
  secondary:    "#E0E7FF"   # indigo-100 — resaltes suaves, iconos de cabecera de modales
  accent:       "#4338CA"   # indigo-700 — estado hover de acciones primarias
  neutral:      "#F8FAFC"   # slate-50 — fondo general de la app y del canvas
  surface:      "#F1F5F9"   # slate-100 — barras de herramientas, cabeceras de panel, tarjetas
  on-primary:   "#FFFFFF"   # texto sobre indigo-600/700
  on-surface:   "#0F172A"   # slate-900 — texto principal (implícito, Tailwind default text color)
  on-neutral:   "#475569"   # slate-600 — texto secundario/mutado
  error:        "#DC2626"   # red-600 — acciones destructivas (eliminar nodo, limpiar código)
  success:      "#16A34A"   # green-600 — no usado activamente aún, reservado
  warning:      "#D97706"   # amber-600 — no usado activamente aún, reservado

# MODO OSCURO
# No implementado. No hay clases `dark:` en el código (verificado en src/). Si se añade,
# usar la escala Tailwind `slate-900`/`slate-800` para neutral/surface y mantener indigo como acento.
dark: {}

typography:
  heading:
    fontFamily: "system-ui, sans-serif"   # Tailwind font-sans por defecto, sin fuente custom
    fontSize:   1.25rem
    fontWeight: 700
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize:   0.875rem
    fontWeight: 400
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize:   0.75rem
    fontWeight: 500

rounded:
  sm:   4px    # rounded (botones pequeños, badges)
  md:   6px    # rounded-md (inputs, botones estándar)
  lg:   8px    # rounded-lg (modales, tarjetas)
  full: 9999px # rounded-full (iconos circulares en cabeceras de modal)

spacing:
  xs:  4px
  sm:  8px
  md:  16px
  lg:  24px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor:       "{colors.on-primary}"
    rounded:         "{rounded.md}"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
  button-destructive:
    backgroundColor: "#DC2626"   # red-600
    textColor:       "{colors.on-primary}"
  button-destructive-hover:
    backgroundColor: "#B91C1C"   # red-700
  modal:
    backgroundColor: "#FFFFFF"
    rounded:         "{rounded.lg}"
    headerBackground: "{colors.surface}"
  toolbar:
    backgroundColor: "{colors.surface}"
  canvas:
    backgroundColor: "{colors.neutral}"
```

---

## Visión General

La interfaz es una herramienta de productividad neutra, sin identidad de marca propia: paleta por defecto de Tailwind CSS (índigo como color de acción, pizarra/`slate` como base neutra), consistente con el resto de utilidades de escritorio del ecosistema `dbv-*`. Prioriza la legibilidad del código DSL y la claridad del canvas sobre la decoración.

---

## 🎨 Colores

- **Primary / indigo-600 (`#4F46E5`):** botón de acción principal y estados activos. Hover pasa a indigo-700 (`#4338CA`).
- **Secondary / indigo-100 (`#E0E7FF`):** fondos suaves de iconos en cabeceras de modal (ver `ModalCredits.tsx`).
- **Neutral / slate-50 (`#F8FAFC`):** fondo general de la app y del canvas.
- **Surface / slate-100 (`#F1F5F9`):** barra de herramientas, panel de código, cabeceras de modal.
- **Error / red-600–700:** exclusivamente para acciones destructivas (eliminar nodo, limpiar todo el código) — nunca decorativo.

### Modo Oscuro
No implementado todavía. Si se solicita en el futuro, registrar la decisión aquí antes de codificarlo.

---

## ✍️ Tipografía

- **Fuente:** Sin fuente custom — hereda `font-sans` de Tailwind (pila `system-ui`). No cargar fuentes de Google Fonts sin justificar el coste de carga en una SPA que ya no tiene backend que las sirva optimizadas.
- **Escala:** Tailwind por defecto (`text-xs` a `text-xl`), sin escala modular custom.

---

## 🧩 Componentes Clave

### Botones
- **Primary:** `bg-indigo-600 hover:bg-indigo-700`, texto blanco, `rounded-md`.
- **Destructivo:** `bg-red-600 hover:bg-red-700` — reservado a confirmaciones de borrado/limpieza (`ModalClearConfirm`, `ModalDeleteConfirm`).

### Modales (7 en total: AIPrompt, ClearConfirm, Credits, DeleteConfirm, Help, Properties)
- Cabecera con icono en círculo `bg-indigo-100`, cuerpo blanco, fondo `slate-50` en zonas de código/ejemplo.

### Toolbar y CodePanel
- Fondo `slate-100`/`slate-50`, separador redimensionable (`ResizableDivider`) entre canvas y editor de código.

---

## ✨ Movimiento e Interacción
No hay animaciones custom relevantes documentadas en el código (transiciones puntuales de Tailwind por defecto en hover/focus). Sin política de `prefers-reduced-motion` definida — no es crítico dado que no hay animaciones significativas.

---

**Instrucción para la IA:** Estos tokens reflejan el uso real de Tailwind en el código a fecha de esta revisión. Si se introduce una nueva paleta o modo oscuro, actualiza este fichero y registra la decisión en `memory.md`.
