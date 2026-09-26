// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import type { TranslationKey } from './es';
import { LanguageContext, type Language, type LanguageContextValue } from './language';
import { translate, readStoredLanguage, LANGUAGE_STORAGE_KEY } from './translate';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(readStoredLanguage);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Persistir el idioma es una comodidad, no un requisito: si el navegador
      // bloquea el almacenamiento, la sesión actual sigue funcionando igual.
    }
  }, []);

  const t = useMemo(
    () => (key: TranslationKey, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  );

  const value = useMemo<LanguageContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
