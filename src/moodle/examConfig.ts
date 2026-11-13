// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * Configuración del examen incrustada en el HTML por `scripts/build-moodle.mjs`, en
 * `<script id="eer-exam-config" type="application/json">`. Así un mismo build sirve para
 * cualquier examen y la plantilla viaja dentro del paquete, sin peticiones de red.
 */

export const EXAM_CONFIG_ELEMENT_ID = 'eer-exam-config';

export interface ExamConfig {
  /** Identifica el examen (clave del autoguardado y metadato de la entrega). */
  examId: string;
  /** Título visible en la barra del examen; vacío = genérico. */
  title: string;
  /** DSL EER de partida; vacío = editor vacío. */
  template: string;
}

export const DEFAULT_EXAM_CONFIG: ExamConfig = { examId: 'eer-exam', title: '', template: '' };

const text = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);

/** Valida el JSON incrustado; ante cualquier problema devuelve la configuración por defecto. */
export function parseExamConfig(json: string | null | undefined): ExamConfig {
  if (!json) return DEFAULT_EXAM_CONFIG;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const examId = text(raw.examId, '').trim();
    return {
      examId: examId || DEFAULT_EXAM_CONFIG.examId,
      title: text(raw.title, ''),
      template: text(raw.template, ''),
    };
  } catch {
    return DEFAULT_EXAM_CONFIG;
  }
}

export function readExamConfig(doc: Pick<Document, 'getElementById'> = document): ExamConfig {
  return parseExamConfig(doc.getElementById(EXAM_CONFIG_ELEMENT_ID)?.textContent);
}
