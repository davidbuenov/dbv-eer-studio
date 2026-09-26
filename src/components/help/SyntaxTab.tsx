// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useState } from 'react';
import { Layers, Database } from 'lucide-react';
import { useLanguage } from '../../i18n/language';
import { EER_SYNTAX, RELATIONAL_SYNTAX, type SyntaxSection } from './syntaxExamples';

/** Pestaña "Sintaxis": referencia del DSL EER y del DSL relacional. */
export function SyntaxTab() {
  const { t } = useLanguage();
  const [dsl, setDsl] = useState<'eer' | 'relational'>('eer');
  const sections: SyntaxSection[] = dsl === 'eer' ? EER_SYNTAX : RELATIONAL_SYNTAX;

  const subTabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
      active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{t('modalHelp.subtitle')}</p>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button onClick={() => setDsl('eer')} className={subTabClass(dsl === 'eer')}>
          <Layers className="h-4 w-4" />
          <span>{t('modalHelp.tabEER')}</span>
        </button>
        <button onClick={() => setDsl('relational')} className={subTabClass(dsl === 'relational')}>
          <Database className="h-4 w-4" />
          <span>{t('modalHelp.tabRelational')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 text-sm text-slate-600 md:grid-cols-2">
        {sections.map(section => (
          <div key={section.titleKey}>
            <h3 className="mb-2.5 font-bold text-indigo-600">{t(section.titleKey)}</h3>
            <ul className="space-y-3">
              {section.examples.map(example => (
                <li key={example.code} className="flex flex-col">
                  <code className="w-fit rounded bg-slate-100 px-2 py-1 font-mono text-xs text-indigo-950">{example.code}</code>
                  <span className="mt-0.5 text-xs text-slate-500">{t(example.descKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
