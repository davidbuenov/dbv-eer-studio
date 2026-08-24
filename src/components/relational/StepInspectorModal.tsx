// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React from 'react';
import { X, BookOpen, CheckCircle, Info, HelpCircle } from 'lucide-react';
import type { RelationalTable } from '../../types/relational';
import { useLanguage } from '../../i18n/language';
import { translateStep, translateFormalStep, type FormalStepNumber } from '../../i18n/steps';

interface StepInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: RelationalTable | null;
}

const FORMAL_STEP_NUMBERS: FormalStepNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const StepInspectorModal: React.FC<StepInspectorModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
}) => {
  const { lang, t } = useLanguage();

  if (!isOpen) return null;

  const currentTrace = selectedTable?.stepTrace;
  const currentTranslated = currentTrace ? translateStep(lang, currentTrace.stepKey, currentTrace.params) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {t('stepInspector.title')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('stepInspector.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedTable && currentTrace && currentTranslated && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>{t('stepInspector.activeInspection', { name: selectedTable.name })}</span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                {currentTranslated.title}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentTranslated.description}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              {t('stepInspector.summaryTitle')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FORMAL_STEP_NUMBERS.map(step => {
                const isCurrent = currentTrace?.stepNumber === step;
                const item = translateFormalStep(lang, step);
                return (
                  <div
                    key={step}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-200 mb-1 flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {t('common.step', { n: step })}
                      </span>
                    </div>
                    <p className="leading-relaxed text-slate-300">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            {t('stepInspector.footerNote')} <code>eer-to-relational-mapping.md</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
          >
            {t('common.understood')}
          </button>
        </div>
      </div>
    </div>
  );
};
