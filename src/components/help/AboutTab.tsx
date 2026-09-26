// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useEffect, useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import type { Update } from '@tauri-apps/plugin-updater';
import { runningInTauri } from '../../utils/platform';
import { useLanguage } from '../../i18n/language';

type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'up-to-date' }
  | { kind: 'available'; version: string }
  | { kind: 'downloading' }
  | { kind: 'installed' }
  | { kind: 'error'; message: string };

const cardClass = 'rounded-lg border border-indigo-100 bg-white p-4';

/** Pestaña "Acerca de": autoría, colaboradores, referencia académica, versión y actualizaciones. */
export function AboutTab() {
  const { t } = useLanguage();
  const [isPackagedApp, setIsPackagedApp] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>({ kind: 'idle' });
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);

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

  const showUpdateButton = runningInTauri && !isPackagedApp;

  async function handleCheckUpdate() {
    if (pendingUpdate) {
      setStatus({ kind: 'downloading' });
      try {
        await pendingUpdate.downloadAndInstall();
        setStatus({ kind: 'installed' });
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      } catch {
        setStatus({ kind: 'error', message: t('modalCredits.status.errorInstall') });
      }
      return;
    }

    setStatus({ kind: 'checking' });
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) {
        setStatus({ kind: 'up-to-date' });
        return;
      }
      setPendingUpdate(update);
      setStatus({ kind: 'available', version: update.version });
    } catch {
      setStatus({ kind: 'error', message: t('modalCredits.status.errorCheck') });
    }
  }

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

      {showUpdateButton && (
        <div className={`${cardClass} text-center`}>
          <button
            onClick={handleCheckUpdate}
            disabled={status.kind === 'checking' || status.kind === 'downloading'}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            {pendingUpdate ? t('modalCredits.updateButton.install') : t('modalCredits.updateButton.check')}
          </button>
          {status.kind !== 'idle' && (
            <p className="mt-2 text-xs text-slate-500">
              {status.kind === 'checking' && t('modalCredits.status.checking')}
              {status.kind === 'up-to-date' && t('modalCredits.status.upToDate')}
              {status.kind === 'available' && t('modalCredits.status.available', { version: status.version })}
              {status.kind === 'downloading' && t('modalCredits.status.downloading')}
              {status.kind === 'installed' && t('modalCredits.status.installed')}
              {status.kind === 'error' && status.message}
            </p>
          )}
        </div>
      )}
      {isPackagedApp && <p className="text-center text-xs text-slate-400">{t('modalCredits.storeNotice')}</p>}

      <p className="border-t border-indigo-100 pt-4 text-center text-xs text-slate-500">
        © 2025-2026 David Bueno Vallejo
        <br />
        {t('modalCredits.allRightsReserved')}
      </p>
    </div>
  );
}
