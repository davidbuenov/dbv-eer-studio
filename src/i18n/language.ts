// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { createContext, useContext } from 'react';
import type { TranslationKey } from './es';

/** Idiomas soportados por la interfaz. */
export type Language = 'es' | 'en';

export interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

// El objeto de contexto y el hook viven aquí (fichero `.ts`, sin componentes) para que
// `LanguageContext.tsx` exporte únicamente el componente `LanguageProvider` y no rompa
// la regla `react-refresh/only-export-components` de ESLint.
export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  }
  return ctx;
}
