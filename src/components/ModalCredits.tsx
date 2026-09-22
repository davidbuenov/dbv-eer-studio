// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useEffect, useState } from 'react';
import { X, BookOpen, RefreshCw } from 'lucide-react';
import type { Update } from '@tauri-apps/plugin-updater';
import { runningInTauri } from '../utils/platform';
import { useLanguage } from '../i18n/language';

interface ModalCreditsProps {
  isOpen: boolean;
  onClose: () => void;
}

type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'up-to-date' }
  | { kind: 'available'; version: string }
  | { kind: 'downloading' }
  | { kind: 'installed' }
  | { kind: 'error'; message: string };

/**
 * Modal de créditos mostrando información del autor y contribuidores
 */
export function ModalCredits({ isOpen, onClose }: ModalCreditsProps) {
  const { t } = useLanguage();
  const [isPackagedApp, setIsPackagedApp] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>({ kind: 'idle' });
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);

  // Comprobar el canal de instalación solo al abrir el modal — nunca en el
  // arranque de la app (dbv-specs-ops/docs/NATIVE_DESKTOP_APPS.md §4 lección 5).
  useEffect(() => {
    if (!isOpen || !runningInTauri) return;
    let cancelled = false;
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke<boolean>('is_packaged_app').then(packaged => {
        if (!cancelled) setIsPackagedApp(packaged);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-indigo-50 to-white p-8 shadow-2xl border border-indigo-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-indigo-900">{t('modalCredits.title')} <span className="text-sm font-normal text-slate-500">v1.5.0</span></h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-indigo-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-6 text-slate-700">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-indigo-900 mb-2">dbv-eer-studio</h3>
            <p className="text-sm text-slate-600">{t('modalCredits.appDesc')}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="text-sm leading-relaxed">
              <strong className="text-indigo-900">{t('modalCredits.developedBy')}</strong><br />
              <a href="https://davidbuenov.com/" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors">
                David Bueno Vallejo
              </a>
              <br />
              <a href="https://github.com/davidbuenov/dbv-eer-studio" target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-block text-slate-500 hover:text-slate-700 hover:underline transition-colors">
                {t('modalCredits.repoLabel')} · https://github.com/davidbuenov/dbv-eer-studio
              </a>
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="text-sm leading-relaxed">
              <strong className="text-indigo-900">{t('modalCredits.theoryTitle')}</strong><br />
              {t('modalCredits.theoryText.pre')} <strong className="text-slate-800">{t('modalCredits.theoryText.book')}</strong> {t('modalCredits.theoryText.by')} <strong className="text-indigo-700">Ramez Elmasri</strong> y <strong className="text-indigo-700">Shamkant B. Navathe</strong>.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="text-sm leading-relaxed">
              <strong className="text-indigo-900">{t('modalCredits.aiTitle')}</strong><br />
              {t('modalCredits.aiText.pre')} <strong>Gemini & Antigravity</strong> (Google DeepMind AI) {t('modalCredits.aiText.post')}
            </p>
          </div>

          {showUpdateButton && (
            <div className="bg-white rounded-lg p-4 border border-indigo-100 text-center">
              <button
                onClick={handleCheckUpdate}
                disabled={status.kind === 'checking' || status.kind === 'downloading'}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
          {isPackagedApp && (
            <p className="text-center text-xs text-slate-400">
              {t('modalCredits.storeNotice')}
            </p>
          )}

          <div className="text-center pt-4 border-t border-indigo-100">
            <p className="text-xs text-slate-500">
              © 2025-2026 David Bueno Vallejo<br />
              {t('modalCredits.allRightsReserved')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
