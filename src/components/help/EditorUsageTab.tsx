// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useLanguage } from '../../i18n/language';
import type { TranslationKey } from '../../i18n/es';

type UsageSection = { titleKey: TranslationKey; rows: [gesture: TranslationKey, action: TranslationKey][] };

// Guía de uso como datos: cada fila es una pareja (gesto, qué hace) de claves i18n.
const USAGE_SECTIONS: UsageSection[] = [
  {
    titleKey: 'help.usage.create.title',
    rows: [
      ['help.usage.create.tool.g', 'help.usage.create.tool.d'],
      ['help.usage.create.another.g', 'help.usage.create.another.d'],
      ['help.usage.create.relAttr.g', 'help.usage.create.relAttr.d'],
      ['help.usage.create.code.g', 'help.usage.create.code.d'],
    ],
  },
  {
    titleKey: 'help.usage.select.title',
    rows: [
      ['help.usage.select.click.g', 'help.usage.select.click.d'],
      ['help.usage.select.ctrlClick.g', 'help.usage.select.ctrlClick.d'],
      ['help.usage.select.rect.g', 'help.usage.select.rect.d'],
      ['help.usage.select.ctrlRect.g', 'help.usage.select.ctrlRect.d'],
      ['help.usage.select.clear.g', 'help.usage.select.clear.d'],
    ],
  },
  {
    titleKey: 'help.usage.edit.title',
    rows: [
      ['help.usage.edit.dbl.g', 'help.usage.edit.dbl.d'],
      ['help.usage.edit.delete.g', 'help.usage.edit.delete.d'],
      ['help.usage.edit.blocked.g', 'help.usage.edit.blocked.d'],
    ],
  },
  {
    titleKey: 'help.usage.move.title',
    rows: [
      ['help.usage.move.drag.g', 'help.usage.move.drag.d'],
      ['help.usage.move.alt.g', 'help.usage.move.alt.d'],
      ['help.usage.move.group.g', 'help.usage.move.group.d'],
    ],
  },
  {
    titleKey: 'help.usage.navigate.title',
    rows: [
      ['help.usage.navigate.pan.g', 'help.usage.navigate.pan.d'],
      ['help.usage.navigate.wheel.g', 'help.usage.navigate.wheel.d'],
      ['help.usage.navigate.zoom.g', 'help.usage.navigate.zoom.d'],
      ['help.usage.navigate.controls.g', 'help.usage.navigate.controls.d'],
    ],
  },
  {
    titleKey: 'help.usage.code.title',
    rows: [
      ['help.usage.code.highlight.g', 'help.usage.code.highlight.d'],
      ['help.usage.code.diagnostics.g', 'help.usage.code.diagnostics.d'],
      ['help.usage.code.coords.g', 'help.usage.code.coords.d'],
    ],
  },
  {
    titleKey: 'help.usage.relational.title',
    rows: [
      ['help.usage.relational.tab.g', 'help.usage.relational.tab.d'],
      ['help.usage.relational.book.g', 'help.usage.relational.book.d'],
      ['help.usage.relational.export.g', 'help.usage.relational.export.d'],
      ['help.usage.relational.files.g', 'help.usage.relational.files.d'],
    ],
  },
];

// Las teclas de función no se traducen; "Supr"/"Delete" y "Esc" sí dependen del teclado del idioma.
const SHORTCUTS: [keys: (string | TranslationKey)[], action: TranslationKey][] = [
  [['F1'], 'help.usage.shortcuts.f1'],
  [['F2', 'Enter'], 'help.usage.shortcuts.f2'],
  [['help.usage.key.delete'], 'help.usage.shortcuts.delete'],
  [['help.usage.key.esc'], 'help.usage.shortcuts.esc'],
  [['Enter'], 'help.usage.shortcuts.enter'],
];

/** Pestaña "Uso del editor": gestos de ratón/teclado agrupados por tarea y tabla de atajos. */
export function EditorUsageTab() {
  const { t } = useLanguage();
  const keyLabel = (key: string) => (key.startsWith('help.') ? t(key as TranslationKey) : key);

  return (
    <div className="space-y-6 text-sm text-slate-600">
      <p className="text-slate-600">{t('help.usage.intro')}</p>

      {USAGE_SECTIONS.map(section => (
        <section key={section.titleKey}>
          <h3 className="mb-2 font-bold text-indigo-600">{t(section.titleKey)}</h3>
          <table className="w-full border-collapse overflow-hidden rounded-lg border border-slate-200 text-xs">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="w-2/5 px-3 py-1.5 font-semibold">{t('help.usage.col.gesture')}</th>
                <th className="px-3 py-1.5 font-semibold">{t('help.usage.col.action')}</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map(([gesture, action]) => (
                <tr key={gesture} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 font-semibold text-slate-800">{t(gesture)}</td>
                  <td className="px-3 py-2 leading-relaxed">{t(action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section>
        <h3 className="mb-2 font-bold text-indigo-600">{t('help.usage.shortcuts.title')}</h3>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SHORTCUTS.map(([keys, action]) => (
            <li key={action} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-xs">
              <span className="flex shrink-0 gap-1">
                {keys.map(key => (
                  <kbd key={key} className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                    {keyLabel(key)}
                  </kbd>
                ))}
              </span>
              <span>{t(action)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
