// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/language';

interface ExamModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Botones de acción; siempre se añade "Cancelar" a la izquierda. */
  actions?: ReactNode;
  size?: 'sm' | 'lg';
}

/** Ventana modal propia (sin `alert`/`confirm` del navegador, que SEB puede bloquear). */
export function ExamModal({ isOpen, title, onClose, children, actions, size = 'sm' }: ExamModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'} rounded-xl border border-slate-200 bg-white p-6 shadow-2xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} title={t('help.close')} className="rounded-full p-1 transition-colors hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="mb-6 space-y-3 text-sm text-slate-600">{children}</div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}
