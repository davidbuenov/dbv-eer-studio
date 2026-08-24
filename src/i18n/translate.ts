// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { es, type TranslationKey } from './es';
import { en } from './en';
import type { Language } from './language';

/**
 * Registro único de diccionarios. Cualquier consumidor —el Provider de React o un util
 * puro como `relationalToSQL`/`exportRelationalSVG`— traduce a través de `translate()`,
 * en vez de reimportar `es`/`en` y montarse su propio mapa.
 */
const dictionaries: Record<Language, Record<TranslationKey, string>> = { es, en };

/**
 * Sustituye los marcadores `{{nombre}}` de una plantilla por los valores de `params`.
 * Un marcador sin valor correspondiente se deja intacto (facilita detectar el hueco en la UI).
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  );
}

/** Traduce una clave de UI al idioma indicado, interpolando los parámetros que reciba. */
export function translate(
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  return interpolate(dictionaries[lang][key], params);
}
