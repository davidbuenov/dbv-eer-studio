// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useCallback, useState } from 'react';
import type { RelationalTable } from '../types/relational';

export const HELP_TABS = ['usage', 'syntax', 'steps', 'aiPrompt', 'about'] as const;
export type HelpTab = (typeof HELP_TABS)[number];

const STORAGE_KEY = 'eer-studio-help-tab';
const DEFAULT_TAB: HelpTab = 'usage';

const isHelpTab = (value: unknown): value is HelpTab => HELP_TABS.includes(value as HelpTab);

/**
 * Última pestaña de ayuda consultada. `localStorage` lanza si está bloqueado (modo privado,
 * políticas del navegador): la ayuda debe abrirse igualmente, en la pestaña por defecto.
 */
export function readStoredHelpTab(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): HelpTab {
  let tab: HelpTab = DEFAULT_TAB;
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    if (isHelpTab(stored)) tab = stored;
  } catch {
    tab = DEFAULT_TAB;
  }
  return tab;
}

function storeHelpTab(tab: HelpTab) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, tab);
  } catch {
    // Sin persistencia la ayuda sigue funcionando; solo no recuerda la pestaña.
  }
}

/** Estado del Centro de Ayuda: visibilidad, pestaña activa y tabla inspeccionada (acceso contextual). */
export function useHelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTabState] = useState<HelpTab>(() => readStoredHelpTab());
  const [inspectedTable, setInspectedTable] = useState<RelationalTable | null>(null);

  const setTab = useCallback((next: HelpTab) => {
    setTabState(next);
    storeHelpTab(next);
  }, []);

  /**
   * Abre la ayuda. Sin argumentos, en la última pestaña consultada y sin tabla inspeccionada
   * (para no mostrar una tabla de una consulta anterior). Con tabla, directamente en la Guía de
   * 9 Pasos explicando la regla que la generó.
   */
  const openHelp = useCallback((requestedTab?: HelpTab, table?: RelationalTable) => {
    setInspectedTable(table ?? null);
    if (requestedTab) setTab(requestedTab);
    setIsOpen(true);
  }, [setTab]);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, tab, setTab, inspectedTable, openHelp, close };
}
