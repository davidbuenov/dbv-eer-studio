// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * `true` si la app se ejecuta dentro del WebView nativo de Tauri (escritorio),
 * `false` en modo web puro (GitHub Pages). Único punto de la app que sabe
 * distinguir ambos entornos — ver dbv-specs-ops/docs/WEB_TO_DESKTOP_MIGRATION.md §3.1.
 *
 * Deliberadamente NO se llama `isTauri`: con `withGlobalTauri: true` en
 * tauri.conf.json, Tauri v2 ya expone un global real llamado `isTauri`.
 */
export const runningInTauri =
  typeof window !== 'undefined' && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
