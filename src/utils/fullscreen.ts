// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/*
 * Pantalla completa con la Fullscreen API del navegador (§3.11 F), para la edición web y la de
 * Moodle (la de escritorio usa la ventana nativa de Tauri, ver `useFullscreen`). En el
 * reproductor SCORM de Moodle los paneles laterales del curso quitan mucho ancho en pantallas
 * pequeñas. Dentro de un iframe del mismo origen se permite por defecto; si el reproductor la
 * bloquea, el navegador informa `fullscreenEnabled === false` y la app lo dice en lugar de no
 * hacer nada.
 */

/** La parte de `Document` que se usa, para poder probarlo con un documento simulado. */
export interface FullscreenDocument {
  fullscreenEnabled: boolean;
  fullscreenElement: Element | null;
  documentElement: { requestFullscreen: () => Promise<void> };
  exitFullscreen: () => Promise<void>;
}

export type FullscreenResult = 'entered' | 'exited' | 'unsupported' | 'failed';

export function isFullscreenSupported(doc: FullscreenDocument): boolean {
  return Boolean(doc.fullscreenEnabled && typeof doc.documentElement.requestFullscreen === 'function');
}

export function isFullscreenActive(doc: FullscreenDocument): boolean {
  return doc.fullscreenElement !== null;
}

/**
 * Entra o sale de pantalla completa. Pantalla completa de todo el documento: los modales de la
 * app están dentro de su árbol (no hay portales), así que siguen visibles.
 */
export async function toggleFullscreen(doc: FullscreenDocument): Promise<FullscreenResult> {
  let result: FullscreenResult;
  try {
    if (isFullscreenActive(doc)) {
      await doc.exitFullscreen();
      result = 'exited';
    } else if (!isFullscreenSupported(doc)) {
      result = 'unsupported';
    } else {
      await doc.documentElement.requestFullscreen();
      result = 'entered';
    }
  } catch (error) {
    // Rechazada por el navegador (permisos del iframe, sin gesto del usuario…).
    if (!(error instanceof Error)) throw error;
    result = 'failed';
  }
  return result;
}
