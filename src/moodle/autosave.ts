// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * Autoguardado del DSL del examen en `localStorage`, para no perder el trabajo al ir y volver
 * entre el SCORM y la Tarea o al recargar. La clave depende del examen, y la copia caduca a las
 * 12 h para que en un PC compartido no aparezca el diagrama de otro turno. `localStorage` lanza
 * si está bloqueado: todas las operaciones fallan en silencio y lo indican con su resultado.
 */

const KEY_PREFIX = 'eer-moodle-autosave:';
export const AUTOSAVE_TTL_MS = 12 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface StoredDraft {
  code: string;
  savedAt: number;
}

const keyFor = (examId: string) => `${KEY_PREFIX}${examId}`;

const defaultStorage = (): StorageLike | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

/** Borrador guardado de este examen, o `null` si no hay, está caducado o es ilegible. */
export function loadAutosave(examId: string, now = Date.now(), storage = defaultStorage()): string | null {
  try {
    const raw = storage?.getItem(keyFor(examId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<StoredDraft>;
    if (typeof draft.code !== 'string' || typeof draft.savedAt !== 'number') return null;
    if (now - draft.savedAt > AUTOSAVE_TTL_MS) {
      storage?.removeItem(keyFor(examId));
      return null;
    }
    return draft.code;
  } catch {
    return null;
  }
}

/** Devuelve `false` si no se pudo guardar (almacenamiento bloqueado o lleno). */
export function saveAutosave(examId: string, code: string, now = Date.now(), storage = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(keyFor(examId), JSON.stringify({ code, savedAt: now } satisfies StoredDraft));
    return true;
  } catch {
    return false;
  }
}

export function clearAutosave(examId: string, storage = defaultStorage()): void {
  try {
    storage?.removeItem(keyFor(examId));
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
