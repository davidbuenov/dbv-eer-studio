// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * Bloque de entrega del examen: el DSL EER entre marcadores, con una línea de metadatos
 * (comentario DSL) que lleva versión, examen, fecha y suma de control.
 *
 * El alumno lo pega en el "texto en línea" de una Tarea de Moodle, cuyo editor (TinyMCE)
 * lo convierte en HTML: un <p> por línea, `->` como `-&gt;`, espacios como `&nbsp;`.
 * `decodeSubmission` deshace esa conversión, y la suma de control se calcula sobre una
 * forma normalizada (espacios colapsados) para que esas alteraciones no la invaliden.
 */

export const SUBMISSION_BEGIN = '=== EER-STUDIO BEGIN v1 ===';
export const SUBMISSION_END = '=== EER-STUDIO END ===';
const META_PREFIX = '// eer-studio-moodle';

/**
 * Crédito de autoría al inicio de cada entrega (y de cada `.eer` descargado). Es un comentario
 * del DSL, queda fuera de la suma de control y `decodeSubmission` lo descarta, así que cargar
 * una entrega y volver a copiarla no lo duplica.
 */
export const SUBMISSION_ATTRIBUTION =
  '// EER Studio · edición Moodle · © 2025-2026 David Bueno Vallejo (Universidad de Málaga) · https://github.com/davidbuenov/dbv-eer-studio';
const ATTRIBUTION_PREFIX = '// EER Studio';

export interface SubmissionMeta {
  appVersion: string;
  examId: string;
  /** Fecha ISO 8601 en que se copió el bloque. */
  date: string;
}

export type DecodeResult =
  | {
      ok: true;
      dsl: string;
      meta: Partial<SubmissionMeta>;
      /** `null` si el bloque no trae suma de control (p. ej. editado a mano). */
      checksumValid: boolean | null;
      /** Había más de un bloque: se devuelve el último (la entrega más reciente). */
      multipleBlocks: boolean;
    }
  | { ok: false; reason: 'notFound' | 'unterminated' };

/** Forma canónica para la suma de control: sin \r, espacios colapsados, sin líneas vacías. */
function canonical(dsl: string): string {
  return dsl
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/** FNV-1a de 32 bits en hexadecimal (8 caracteres). Detecta alteraciones, no es criptográfico. */
export function checksum(dsl: string): string {
  let hash = 0x811c9dc5;
  const text = canonical(dsl);
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Los valores de metadatos no pueden contener espacios ni '=' (el formato es clave=valor). */
const metaValue = (value: string) => value.replace(/[\s=]+/g, '_');

const normalizeBody = (dsl: string) => dsl.replace(/\r/g, '').trim();

/**
 * Línea de metadatos. Es un comentario del DSL: un `.eer` que empiece por ella se abre sin
 * cambios en la edición completa de EER Studio.
 */
export function submissionMetaLine(dsl: string, meta: SubmissionMeta): string {
  return `${META_PREFIX} app=${metaValue(meta.appVersion)} exam=${metaValue(meta.examId)} date=${metaValue(meta.date)} checksum=${checksum(normalizeBody(dsl))}`;
}

/** Cabecera común de la entrega y del `.eer` descargado: crédito de autoría + metadatos. */
export function submissionHeader(dsl: string, meta: SubmissionMeta): string {
  return `${SUBMISSION_ATTRIBUTION}\n${submissionMetaLine(dsl, meta)}`;
}

export function encodeSubmission(dsl: string, meta: SubmissionMeta): string {
  return [SUBMISSION_BEGIN, submissionHeader(dsl, meta), normalizeBody(dsl), SUBMISSION_END].join('\n');
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Espacio de no separación (U+00A0), que TinyMCE introduce al pegar espacios seguidos. */
const NBSP = new RegExp(String.fromCharCode(0xa0), 'g');

const HTML_TAG = /<\/?(p|br|div|span|pre|li|ul|ol|h[1-6]|strong|em|b|i|code|html|body|font)\b[^>]*>/i;

/** Texto plano a partir del HTML de TinyMCE o de la descarga masiva de entregas de Moodle. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      // En HTML los saltos del código fuente son espacio insignificante: las líneas las marcan las etiquetas.
      .replace(/>\s*\n\s*</g, '><')
      .replace(/\s*\n\s*/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|pre|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  ).replace(NBSP, ' ');
}

/** Texto plano tal cual, o sin etiquetas si parece HTML (TinyMCE, descarga masiva de Moodle). */
export function toPlainText(input: string): string {
  return (HTML_TAG.test(input) ? htmlToText(input) : input.replace(NBSP, ' ')).replace(/\r/g, '');
}

const META_FIELD = /(\w+)=(\S+)/g;

function parseMeta(line: string): { meta: Partial<SubmissionMeta>; checksum?: string } {
  const fields: Record<string, string> = {};
  for (const [, key, value] of line.slice(META_PREFIX.length).matchAll(META_FIELD)) {
    if (key && value) fields[key] = value;
  }
  return {
    meta: { appVersion: fields.app, examId: fields.exam, date: fields.date },
    checksum: fields.checksum,
  };
}

/**
 * Extrae el DSL de un texto que contiene un bloque de entrega (texto plano o HTML).
 * Con varios bloques, se queda con el último.
 */
export function decodeSubmission(input: string): DecodeResult {
  const lines = toPlainText(input).split('\n');
  const begins = lines.flatMap((line, i) => (line.trim() === SUBMISSION_BEGIN ? [i] : []));
  if (begins.length === 0) return { ok: false, reason: 'notFound' };

  const start = begins[begins.length - 1]!;
  const endOffset = lines.slice(start + 1).findIndex(line => line.trim() === SUBMISSION_END);
  if (endOffset === -1) return { ok: false, reason: 'unterminated' };

  let body = lines.slice(start + 1, start + 1 + endOffset);
  let meta: Partial<SubmissionMeta> = {};
  let expected: string | undefined;
  // Cabecera: líneas iniciales de crédito (opcionales, para leer también bloques v1 anteriores
  // que no lo llevaban) seguidas de la de metadatos. Si no hay metadatos, todo es DSL.
  let headerEnd = 0;
  while (headerEnd < body.length && (!body[headerEnd]!.trim() || body[headerEnd]!.trim().startsWith(ATTRIBUTION_PREFIX))) {
    headerEnd++;
  }
  if (headerEnd < body.length && body[headerEnd]!.trim().startsWith(META_PREFIX)) {
    ({ meta, checksum: expected } = parseMeta(body[headerEnd]!.trim()));
    body = body.slice(headerEnd + 1);
  }

  const dsl = body.map(line => line.trimEnd()).join('\n').trim();
  return {
    ok: true,
    dsl,
    meta,
    checksumValid: expected ? expected === checksum(dsl) : null,
    multipleBlocks: begins.length > 1,
  };
}
