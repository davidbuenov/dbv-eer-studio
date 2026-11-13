// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * Comunicación mínima con el reproductor SCORM 1.2 de Moodle. El paquete es solo un contenedor:
 * marca el intento como `incomplete` al abrir y `completed` cuando el alumno copia su entrega.
 * La entrega válida es siempre la de la Tarea. Sin API (HTML abierto en local) no hace nada.
 */

export interface Scorm12Api {
  LMSInitialize(arg: ''): string;
  LMSFinish(arg: ''): string;
  LMSGetValue(element: string): string;
  LMSSetValue(element: string, value: string): string;
  LMSCommit(arg: ''): string;
}

/** Lo único que se necesita de `window`; permite simular marcos en los tests. */
export interface ScormWindow {
  API?: Scorm12Api;
  parent?: ScormWindow | null;
  opener?: ScormWindow | null;
}

const MAX_DEPTH = 7;

const isApi = (candidate: unknown): candidate is Scorm12Api =>
  !!candidate && typeof (candidate as Scorm12Api).LMSInitialize === 'function';

/** Busca `API` subiendo por los marcos padre y, si no está, por la ventana que abrió esta. */
function searchUp(start: ScormWindow | null | undefined): Scorm12Api | null {
  let win = start;
  for (let depth = 0; win && depth <= MAX_DEPTH; depth++) {
    try {
      if (isApi(win.API)) return win.API;
      if (!win.parent || win.parent === win) return null;
      win = win.parent;
    } catch {
      return null; // Marco de otro origen: no se puede inspeccionar.
    }
  }
  return null;
}

export function findScormApi(win: ScormWindow): Scorm12Api | null {
  const fromParents = searchUp(win);
  if (fromParents) return fromParents;
  try {
    return searchUp(win.opener);
  } catch {
    return null;
  }
}

export interface ScormSession {
  readonly connected: boolean;
  start(): void;
  complete(): void;
  finish(): void;
}

export function createScormSession(api: Scorm12Api | null): ScormSession {
  let initialized = false;
  let finished = false;

  // Un LMS defectuoso no debe romper el examen: cualquier excepción se ignora.
  const safely = (fn: (lms: Scorm12Api) => void) => {
    if (!api || !initialized || finished) return;
    try {
      fn(api);
    } catch {
      // Sin seguimiento SCORM el editor sigue funcionando.
    }
  };

  return {
    connected: !!api,
    start() {
      if (!api || initialized) return;
      try {
        initialized = api.LMSInitialize('') === 'true';
      } catch {
        initialized = false;
      }
      safely(lms => {
        if (lms.LMSGetValue('cmi.core.lesson_status') !== 'completed') {
          lms.LMSSetValue('cmi.core.lesson_status', 'incomplete');
          lms.LMSCommit('');
        }
      });
    },
    complete() {
      safely(lms => {
        lms.LMSSetValue('cmi.core.lesson_status', 'completed');
        lms.LMSCommit('');
      });
    },
    finish() {
      safely(lms => {
        lms.LMSCommit('');
        lms.LMSFinish('');
      });
      finished = true;
    },
  };
}
