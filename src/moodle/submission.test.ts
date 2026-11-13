// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { checksum, decodeSubmission, encodeSubmission, htmlToText, SUBMISSION_ATTRIBUTION, SUBMISSION_BEGIN, SUBMISSION_END } from './submission';

const DSL = [
  '// Examen: hotel',
  'entity CLIENTE "Cliente" (100, 100)',
  'key_att CLIENTE_ID "id"  -> CLIENTE (100, 40)',
  'rel RESERVA "reserva" (300, 100)',
  'link CLIENTE RESERVA "N" total',
  '',
  'entity HABITACION "Habitación & suite" (500, 100)',
].join('\n');

const META = { appVersion: '1.6.0', examId: 'bd-junio', date: '2026-11-13T10:00:00.000Z' };

/** Simula lo que hace TinyMCE al pegar texto plano: un <p> por línea y entidades HTML. */
const asTinyMceHtml = (text: string) =>
  text
    .split('\n')
    .map(line => {
      const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ {2}/g, '&nbsp; ');
      return `<p>${escaped || '&nbsp;'}</p>`;
    })
    .join('\n');

describe('encodeSubmission / decodeSubmission', () => {
  it('ida y vuelta en texto plano conserva el DSL y valida la suma de control', () => {
    const block = encodeSubmission(DSL, META);
    expect(block.startsWith(SUBMISSION_BEGIN)).toBe(true);
    expect(block.endsWith(SUBMISSION_END)).toBe(true);

    const result = decodeSubmission(block);
    expect(result).toMatchObject({ ok: true, dsl: DSL, checksumValid: true, multipleBlocks: false });
    if (result.ok) expect(result.meta).toEqual(META);
  });

  it('reconstruye el DSL desde el HTML de TinyMCE (<p>, &gt;, &amp;, &nbsp;)', () => {
    const html = `<p>Mi entrega:</p>\n${asTinyMceHtml(encodeSubmission(DSL, META))}`;
    const result = decodeSubmission(html);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.checksumValid).toBe(true);
    expect(result.dsl).toBe(DSL);
  });

  it('acepta un único <p> con <br> por línea', () => {
    const html = `<p>${encodeSubmission(DSL, META).replace(/>/g, '&gt;').split('\n').join('<br>')}</p>`;
    const result = decodeSubmission(html);
    expect(result).toMatchObject({ ok: true, checksumValid: true });
  });

  it('detecta un DSL alterado después de copiarlo', () => {
    const tampered = encodeSubmission(DSL, META).replace('"N" total', '"1" total');
    expect(decodeSubmission(tampered)).toMatchObject({ ok: true, checksumValid: false });
  });

  it('sin línea de metadatos devuelve el DSL con checksumValid null', () => {
    const result = decodeSubmission(`${SUBMISSION_BEGIN}\n${DSL}\n${SUBMISSION_END}`);
    expect(result).toMatchObject({ ok: true, dsl: DSL, checksumValid: null });
  });

  it('con varios bloques se queda con el último', () => {
    const first = encodeSubmission('entity A "A"', META);
    const second = encodeSubmission(DSL, META);
    const result = decodeSubmission(`${first}\n\n${second}`);
    expect(result).toMatchObject({ ok: true, dsl: DSL, multipleBlocks: true });
  });

  it('informa de bloque ausente o sin cerrar', () => {
    expect(decodeSubmission(DSL)).toEqual({ ok: false, reason: 'notFound' });
    expect(decodeSubmission(`${SUBMISSION_BEGIN}\n${DSL}`)).toEqual({ ok: false, reason: 'unterminated' });
  });

  it('los metadatos con espacios o "=" no rompen el formato clave=valor', () => {
    const result = decodeSubmission(encodeSubmission(DSL, { ...META, examId: 'BD junio=1' }));
    expect(result).toMatchObject({ ok: true, checksumValid: true });
    if (result.ok) expect(result.meta.examId).toBe('BD_junio_1');
  });
});

describe('crédito de autoría', () => {
  it('el bloque empieza por el crédito y la decodificación lo descarta', () => {
    const block = encodeSubmission(DSL, META);
    expect(block.split('\n')[1]).toBe(SUBMISSION_ATTRIBUTION);
    const result = decodeSubmission(block);
    expect(result).toMatchObject({ ok: true, dsl: DSL, checksumValid: true });
  });

  it('cargar y volver a copiar no duplica el crédito', () => {
    const first = decodeSubmission(encodeSubmission(DSL, META));
    if (!first.ok) throw new Error('no decodifica');
    const again = encodeSubmission(first.dsl, META);
    expect(again.split(SUBMISSION_ATTRIBUTION).length - 1).toBe(1);
  });

  it('sigue leyendo bloques v1 anteriores, sin crédito', () => {
    const legacy = encodeSubmission(DSL, META).replace(`${SUBMISSION_ATTRIBUTION}\n`, '');
    expect(decodeSubmission(legacy)).toMatchObject({ ok: true, dsl: DSL, checksumValid: true });
  });

  it('un DSL que empieza por comentarios propios los conserva', () => {
    const dsl = '// EER Studio: mi comentario\nent A (0, 0)';
    expect(decodeSubmission(`${SUBMISSION_BEGIN}\n${dsl}\n${SUBMISSION_END}`)).toMatchObject({ ok: true, dsl, checksumValid: null });
  });
});

describe('checksum', () => {
  it('ignora espacios repetidos, \\r y líneas vacías, pero no cambios de contenido', () => {
    expect(checksum('entity A "A"\r\n\n  link A B')).toBe(checksum('entity  A "A"\nlink A B'));
    expect(checksum('entity A "A"')).not.toBe(checksum('entity B "A"'));
    expect(checksum('x')).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('htmlToText', () => {
  it('descarta scripts y estilos y decodifica entidades numéricas', () => {
    expect(htmlToText('<style>p{}</style><script>alert(1)</script><p>a &#45;&#x3e; b</p>')).toBe('a -> b\n');
  });
});
