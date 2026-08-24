// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * Paleta de colores hexadecimal usada por `exportRelationalSVG.ts`, calcada de
 * las clases Tailwind aplicadas en `RelationalViewer.tsx` (slate/indigo/amber/cyan)
 * para que el SVG exportado replique visualmente la vista en pantalla.
 */
export const RELATIONAL_COLORS = {
  canvasBg: '#020617', // bg-slate-950
  cardBg: '#0f172a', // bg-slate-900
  cardBorder: '#1e293b', // border-slate-800
  headerBg: '#1e293b', // bg-slate-800 (aprox., sin opacidad)
  headerBorder: '#334155', // border-slate-700
  tableName: '#f1f5f9', // text-slate-100
  rowDivider: '#1e293b', // divide-slate-800
  pkText: '#fcd34d', // text-amber-300
  fkText: '#67e8f9', // text-cyan-300
  regularText: '#cbd5e1', // text-slate-300
  dataTypeText: '#94a3b8', // text-slate-400
  dataTypeBg: '#1e293b', // bg-slate-800
  footerBg: '#020617', // bg-slate-950 (aprox., sin opacidad)
  footerText: '#64748b', // text-slate-500
  footerStep: '#818cf8', // text-indigo-400
  arrowIdentifying: '#818cf8', // FK identificativa (PK)
  arrowRegular: '#38bdf8', // FK regular
  arrowHalo: '#0284c7', // halo bajo las líneas FK
  labelBg: '#090d16', // fondo de la etiqueta de FK
} as const;
