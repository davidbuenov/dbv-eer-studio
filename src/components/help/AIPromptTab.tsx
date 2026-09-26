// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/language';
import { getAIPrompt, AI_PROMPT_PLACEHOLDER } from '../../i18n/aiPrompt';

/** Pestaña "Prompt IA": prompt para que una IA externa genere el DSL a partir de un enunciado. */
export function AIPromptTab() {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const promptText = getAIPrompt(lang);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles denegado: el texto sigue visible para copiarlo a mano.
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <p className="text-slate-600">{t('modalAIPrompt.intro')}</p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">{t('modalAIPrompt.copyLabel')}</span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t('sqlPreview.copied') : t('modalAIPrompt.copyButton')}
          </button>
        </div>
        <pre className="max-h-96 overflow-x-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 font-mono text-xs">
          {promptText}
        </pre>
        <p className="mt-2 text-[11px] italic text-slate-400">{t('modalAIPrompt.note')}</p>
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <h3 className="mb-2 font-semibold text-indigo-900">{t('modalAIPrompt.instructionsTitle')}</h3>
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
          <li>{t('modalAIPrompt.step1')}</li>
          <li>{t('modalAIPrompt.step2')}</li>
          <li>
            {t('modalAIPrompt.step3.pre')} <code className="rounded bg-white px-1 text-xs">{AI_PROMPT_PLACEHOLDER[lang]}</code>{' '}
            {t('modalAIPrompt.step3.post')}
          </li>
          <li>{t('modalAIPrompt.step4')}</li>
          <li>{t('modalAIPrompt.step5')}</li>
        </ol>
      </div>
    </div>
  );
}
