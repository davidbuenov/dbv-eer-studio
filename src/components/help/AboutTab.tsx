// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { runningInTauri } from '../../utils/platform';
import { useLanguage } from '../../i18n/language';

const cardClass = 'rounded-lg border border-indigo-100 bg-white p-4';

/**
 * Pestaña "Acerca de": autoría, colaboradores, referencia académica y versión.
 *
 * Sin comprobador de actualizaciones propio: Windows se distribuye solo por Microsoft Store (que
 * actualiza la app) y en Linux/macOS se descarga cada versión desde GitHub Releases.
 */
export function AboutTab() {
  const { t } = useLanguage();
  const [isPackagedApp, setIsPackagedApp] = useState(false);

  // El canal de instalación se consulta al mostrar esta pestaña, nunca en el arranque de la app
  // (dbv-specs-ops/docs/NATIVE_DESKTOP_APPS.md §4 lección 5). La pestaña solo se monta al abrirla.
  useEffect(() => {
    if (!runningInTauri) return;
    let cancelled = false;
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke<boolean>('is_packaged_app').then(packaged => {
        if (!cancelled) setIsPackagedApp(packaged);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-5 text-slate-700">
      <div className="text-center">
        <BookOpen className="mx-auto mb-3 h-14 w-14 text-indigo-600" />
        <h3 className="text-xl font-bold text-indigo-900">dbv-eer-studio</h3>
        <p className="text-sm text-slate-600">{t('modalCredits.appDesc')}</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">{t('modalCredits.version', { version: __APP_VERSION__ })}</p>
      </div>

      <div className={cardClass}>
        <p className="text-sm leading-relaxed">
          <strong className="text-indigo-900">{t('modalCredits.developedBy')}</strong>
          <br />
          <a href="https://davidbuenov.com/" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-indigo-700 transition-colors hover:text-indigo-900 hover:underline">
            David Bueno Vallejo
          </a>
          <br />
          <a href="https://github.com/davidbuenov/dbv-eer-studio" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-slate-500 transition-colors hover:text-slate-700 hover:underline">
            {t('modalCredits.repoLabel')} · https://github.com/davidbuenov/dbv-eer-studio
          </a>
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-sm leading-relaxed">
          <strong className="text-indigo-900">{t('modalCredits.collaboratorsTitle')}</strong>
          <br />
          <strong className="text-indigo-700">Enrique Soler Castillo</strong> — {t('modalCredits.collaborator.enrique')}
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-sm leading-relaxed">
          <strong className="text-indigo-900">{t('modalCredits.theoryTitle')}</strong>
          <br />
          {t('modalCredits.theoryText.pre')} <strong className="text-slate-800">{t('modalCredits.theoryText.book')}</strong>{' '}
          {t('modalCredits.theoryText.by')} <strong className="text-indigo-700">Ramez Elmasri</strong>{' '}
          {t('modalCredits.theoryText.and')} <strong className="text-indigo-700">Shamkant B. Navathe</strong>.
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-sm leading-relaxed">
          <strong className="text-indigo-900">{t('modalCredits.aiTitle')}</strong>
          <br />
          {t('modalCredits.aiText.pre')} <strong>Claude Code</strong> (Anthropic), <strong>Gemini & Antigravity</strong> (Google DeepMind){' '}
          {t('modalCredits.aiText.post')}
        </p>
      </div>

      {isPackagedApp && <p className="text-center text-xs text-slate-400">{t('modalCredits.storeNotice')}</p>}

      <p className="border-t border-indigo-100 pt-4 text-center text-xs text-slate-500">
        © 2025-2026 David Bueno Vallejo
        <br />
        {t('modalCredits.allRightsReserved')}
      </p>
    </div>
  );
}
