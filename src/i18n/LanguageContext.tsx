// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import type { TranslationKey } from './es';
import { LanguageContext, type Language, type LanguageContextValue } from './language';
import { translate } from './translate';

const STORAGE_KEY = 'eer-studio-language';

/**
 * Lee el idioma persistido. El acceso va en `try/catch` porque `localStorage` lanza
 * excepción —no devuelve null— en modo privado o con los datos de sitio bloqueados,
 * y esto se ejecuta al inicializar el estado: sin el guard, la app entera no arranca.
 */
function getInitialLanguage(): Language {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
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
