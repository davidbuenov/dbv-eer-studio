// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { BookOpen, ClipboardCopy, Download, FileInput, HelpCircle, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../i18n/language';
import type { ExamStatus } from '../useExamSession';

interface ExamActionsBarProps {
  title: string;
  status: ExamStatus | null;
  onCopy: () => void;
  onDownload: () => void;
  onLoad: () => void;
  onReset: () => void;
  onHelp: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

// Por debajo de `xl` (1280 px: el SCORM dentro de Moodle con sus paneles laterales) los botones
// secundarios muestran solo el icono, para que el título no se reduzca a "E.." (§3.11 F).
const compactLabel = 'hidden xl:inline';

const STATUS_STYLE: Record<ExamStatus['tone'], string> = {
  info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

const secondaryButton =
  'flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100';

/** Cabecera del examen: título, acciones de entrega, ayuda, idioma, versión y avisos. */
export function ExamActionsBar({
  title,
  status,
  onCopy,
  onDownload,
  onLoad,
  onReset,
  onHelp,
  isFullscreen,
  onToggleFullscreen,
}: ExamActionsBarProps) {
  const { t, lang, setLang } = useLanguage();
  const fullscreenLabel = isFullscreen ? t('moodle.fullscreen.exit') : t('moodle.fullscreen');

  return (
    <header className="z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        <div className="flex min-w-[8rem] items-center gap-2 lg:gap-3">
          <BookOpen className="h-6 w-6 shrink-0 text-indigo-600" />
          <h1 className="truncate text-base font-bold text-slate-800 lg:text-lg" title={title || t('moodle.title.default')}>
            {title || t('moodle.title.default')}
          </h1>
          <span className="hidden shrink-0 text-[10px] font-semibold text-slate-400 lg:inline">
            EER Studio {t('moodle.version', { version: __APP_VERSION__ })}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
          <button onClick={onReset} title={t('moodle.reset.tooltip')} aria-label={t('moodle.reset')} className={secondaryButton}>
            <RotateCcw className="h-4 w-4" /> <span className={compactLabel}>{t('moodle.reset')}</span>
          </button>
          <button onClick={onLoad} title={t('moodle.load.tooltip')} aria-label={t('moodle.load')} className={secondaryButton}>
            <FileInput className="h-4 w-4" /> <span className={compactLabel}>{t('moodle.load')}</span>
          </button>
          <button onClick={onDownload} title={t('moodle.download.tooltip')} aria-label={t('moodle.download')} className={secondaryButton}>
            <Download className="h-4 w-4" /> <span className={compactLabel}>{t('moodle.download')}</span>
          </button>
          <button
            onClick={onToggleFullscreen}
            title={`${fullscreenLabel} — ${t('moodle.fullscreen.tooltip')}`}
            aria-label={fullscreenLabel}
            aria-pressed={isFullscreen}
            className={secondaryButton}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className={compactLabel}>{fullscreenLabel}</span>
          </button>

          <div className="mx-1 flex items-center gap-0.5 rounded-md border border-slate-200 p-0.5">
            {(['es', 'en'] as const).map(code => (
              <button
                key={code}
                onClick={() => setLang(code)}
                title={t(`header.language.${code}`)}
                className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                  lang === code ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={onHelp}
            title={t('header.helpTooltip')}
            aria-label={t('header.help')}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
          >
            <HelpCircle className="h-4 w-4" /> <span className={compactLabel}>{t('header.help')}</span>
          </button>
          <button
            onClick={onCopy}
            title={t('moodle.copy.tooltip')}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <ClipboardCopy className="h-4 w-4" /> {t('moodle.copy')}
          </button>
        </div>
      </div>

      {status && (
        <div role="status" className={`border-t px-6 py-1.5 text-xs font-medium ${STATUS_STYLE[status.tone]}`}>
          {t(status.key)}
        </div>
      )}
    </header>
  );
}
