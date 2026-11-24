// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { isFullscreenActive, isFullscreenSupported, toggleFullscreen, type FullscreenResult } from '../utils/fullscreen';

/**
 * Pantalla completa (§3.11 F) para las tres ediciones.
 *
 * - Navegador y Moodle: Fullscreen API sobre el documento, sincronizada con `fullscreenchange`
 *   (también cuando se sale con Esc).
 * - Escritorio (`native`): la ventana de Tauri. Dentro de WebView2 la Fullscreen API solo llena
 *   la vista web, no la ventana, así que se usa `setFullscreen` (permiso
 *   `core:window:allow-set-fullscreen`). Esc y F11 los gestiona la app.
 */
export function useFullscreen(native = false) {
  const [isActive, setIsActive] = useState(() => !native && isFullscreenActive(document));
  const isSupported = native || isFullscreenSupported(document);

  useEffect(() => {
    if (native) return;
    const handleChange = () => setIsActive(isFullscreenActive(document));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [native]);

  const toggle = useCallback(async (): Promise<FullscreenResult> => {
    let result: FullscreenResult;
    if (native) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      const next = !(await win.isFullscreen());
      await win.setFullscreen(next);
      setIsActive(next);
      result = next ? 'entered' : 'exited';
    } else {
      result = await toggleFullscreen(document);
    }
    return result;
  }, [native]);

  return { isActive, isSupported, toggle };
}
