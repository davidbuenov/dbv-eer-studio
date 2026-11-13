// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TranslationKey } from '../i18n/es';
import type { ExamConfig } from './examConfig';
import { clearAutosave, loadAutosave, saveAutosave } from './autosave';
import { createScormSession, findScormApi, type ScormSession, type ScormWindow } from './scorm12';

const AUTOSAVE_DELAY_MS = 400;

export interface ExamStatus {
  key: TranslationKey;
  tone: 'info' | 'success' | 'warning';
}

/**
 * Estado del examen: código DSL (arranca del autoguardado o de la plantilla), autoguardado con
 * retardo (y volcado inmediato al abandonar la página) y sesión SCORM del reproductor de Moodle.
 */
export function useExamSession(config: ExamConfig) {
  const [initial] = useState(() => {
    const saved = loadAutosave(config.examId);
    return { code: saved ?? config.template, restored: saved !== null && saved !== config.template };
  });
  const [code, setCode] = useState(initial.code);
  const [status, setStatus] = useState<ExamStatus | null>(
    initial.restored ? { key: 'moodle.status.restored', tone: 'info' } : null,
  );

  const codeRef = useRef(code);
  const autosaveWarnedRef = useRef(false);
  const scormRef = useRef<ScormSession | null>(null);

  useEffect(() => {
    codeRef.current = code;
    const timer = window.setTimeout(() => {
      if (!saveAutosave(config.examId, code) && !autosaveWarnedRef.current) {
        autosaveWarnedRef.current = true;
        setStatus({ key: 'moodle.status.autosaveOff', tone: 'warning' });
      }
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [code, config.examId]);

  useEffect(() => {
    const session = createScormSession(findScormApi(window as unknown as ScormWindow));
    scormRef.current = session;
    session.start();
    // `pagehide` también se dispara al navegar a la Tarea en la misma pestaña (y en móviles).
    const handlePageHide = () => {
      saveAutosave(config.examId, codeRef.current);
      session.finish();
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [config.examId]);

  const reset = useCallback(() => {
    clearAutosave(config.examId);
    setCode(config.template);
    setStatus(null);
  }, [config.examId, config.template]);

  const markSubmitted = useCallback(() => scormRef.current?.complete(), []);

  return { code, setCode, status, setStatus, reset, markSubmitted };
}
