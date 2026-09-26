// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { CheckCircle, Info } from 'lucide-react';
import type { RelationalTable } from '../../types/relational';
import { useLanguage } from '../../i18n/language';
import { translateStep, translateFormalStep, type FormalStepNumber } from '../../i18n/steps';

interface StepGuideTabProps {
  /** Tabla abierta desde su icono 📖: se explica su regla y se destaca su paso. */
  inspectedTable: RelationalTable | null;
}

const FORMAL_STEP_NUMBERS: FormalStepNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Pestaña "Guía de 9 Pasos": resumen teórico del algoritmo EER → Relacional. */
export function StepGuideTab({ inspectedTable }: StepGuideTabProps) {
  const { lang, t } = useLanguage();
  const trace = inspectedTable?.stepTrace;
  const translated = trace ? translateStep(lang, trace.stepKey, trace.params) : undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">{t('stepInspector.subtitle')}</p>

      {inspectedTable && translated && (
        <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
            <CheckCircle className="h-4 w-4" />
            <span>{t('stepInspector.activeInspection', { name: inspectedTable.name })}</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{translated.title}</p>
          <p className="text-xs leading-relaxed text-slate-600">{translated.description}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Info className="h-4 w-4 text-indigo-500" />
          {t('stepInspector.summaryTitle')}
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {FORMAL_STEP_NUMBERS.map(step => {
            const isCurrent = trace?.stepNumber === step;
            const item = translateFormalStep(lang, step);
            return (
              <div
                key={step}
                className={`rounded-lg border p-3 text-xs transition ${
                  isCurrent ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-1 flex items-center justify-between font-bold text-slate-800">
                  <span>{item.title}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    {t('common.step', { n: step })}
                  </span>
                </div>
                <p className="leading-relaxed text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {t('stepInspector.footerNote')} <code>eer-to-relational-mapping.md</code>
      </p>
    </div>
  );
}
