// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useEffect } from 'react';
import { X, HelpCircle, MousePointer2, Code, BookOpen, Sparkles, Info, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../i18n/language';
import type { TranslationKey } from '../../i18n/es';
import type { RelationalTable } from '../../types/relational';
import type { HelpTab } from '../../hooks/useHelpCenter';
import { EditorUsageTab } from './EditorUsageTab';
import { SyntaxTab } from './SyntaxTab';
import { StepGuideTab } from './StepGuideTab';
import { AIPromptTab } from './AIPromptTab';
import { AboutTab } from './AboutTab';

interface HelpCenterProps {
  isOpen: boolean;
  tab: HelpTab;
  onTabChange: (tab: HelpTab) => void;
  onClose: () => void;
  /** Tabla abierta desde el icono 📖 del Modelo Relacional (acceso contextual a la Guía de 9 Pasos). */
  inspectedTable: RelationalTable | null;
}

const TABS: { id: HelpTab; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { id: 'usage', labelKey: 'help.tab.usage', icon: MousePointer2 },
  { id: 'syntax', labelKey: 'help.tab.syntax', icon: Code },
  { id: 'steps', labelKey: 'help.tab.steps', icon: BookOpen },
  { id: 'aiPrompt', labelKey: 'help.tab.aiPrompt', icon: Sparkles },
  { id: 'about', labelKey: 'help.tab.about', icon: Info },
];

/**
 * Centro de Ayuda unificado: uso del editor, sintaxis, 9 pasos, prompt IA y créditos.
 * Solo se monta la pestaña activa (p. ej. "Acerca de" consulta el canal de instalación de Tauri
 * únicamente cuando se muestra).
 */
export function HelpCenter({ isOpen, tab, onTabChange, onClose, inspectedTable }: HelpCenterProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-center-title"
    >
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="help-center-title" className="text-lg font-bold text-slate-800">{t('help.title')}</h2>
              <p className="text-xs text-slate-500">{t('help.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} title={t('help.close')} className="rounded-full p-1 transition hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <nav className="flex w-52 shrink-0 flex-col gap-1 border-r border-slate-200 bg-slate-50 p-3" role="tablist">
            {TABS.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                  tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto p-6" role="tabpanel">
            {tab === 'usage' && <EditorUsageTab />}
            {tab === 'syntax' && <SyntaxTab />}
            {tab === 'steps' && <StepGuideTab inspectedTable={inspectedTable} />}
            {tab === 'aiPrompt' && <AIPromptTab />}
            {tab === 'about' && <AboutTab />}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-xs text-slate-400">
          <span>{t('help.f1Hint')}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-5 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            {t('common.understood')}
          </button>
        </div>
      </div>
    </div>
  );
}
