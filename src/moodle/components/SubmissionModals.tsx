// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/language';
import { ExamModal } from './ExamModal';

const primaryButton = 'flex-1 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50';
const textareaClass = 'h-64 w-full resize-none rounded-md border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none';

/** Último recurso si no se pudo copiar: el bloque ya seleccionado para copiarlo con Ctrl+C. */
export function CopyFallbackModal({ text, onClose }: { text: string | null; onClose: () => void }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (text !== null) ref.current?.select();
  }, [text]);

  return (
    <ExamModal isOpen={text !== null} title={t('moodle.copyFallback.title')} onClose={onClose} size="lg">
      <p>{t('moodle.copyFallback.message')}</p>
      <textarea ref={ref} readOnly value={text ?? ''} onFocus={e => e.currentTarget.select()} className={textareaClass} />
    </ExamModal>
  );
}

interface LoadSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Devuelve un mensaje de error si el texto no se pudo cargar, o `null` si se cargó. */
  onLoad: (text: string) => string | null;
}

/** Pegar un bloque de entrega (o el HTML de la Tarea) para reconstruir el diagrama. */
export function LoadSubmissionModal({ isOpen, onClose, onLoad }: LoadSubmissionModalProps) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setText('');
    setError(null);
    onClose();
  };

  const load = () => {
    const failure = onLoad(text);
    if (failure) setError(failure);
    else close();
  };

  return (
    <ExamModal
      isOpen={isOpen}
      title={t('moodle.paste.title')}
      onClose={close}
      size="lg"
      actions={
        <button onClick={load} disabled={!text.trim()} className={`${primaryButton} bg-indigo-600 hover:bg-indigo-700`}>
          {t('moodle.paste.confirm')}
        </button>
      }
    >
      <p>{t('moodle.paste.message')}</p>
      <textarea
        autoFocus
        value={text}
        onChange={e => {
          setText(e.target.value);
          setError(null);
        }}
        placeholder="=== EER-STUDIO BEGIN v1 ==="
        className={textareaClass}
      />
      {error && <p className="font-medium text-red-600">{error}</p>}
    </ExamModal>
  );
}

/** Confirmación genérica de dos botones (copiar con errores, empezar de nuevo). */
export function ConfirmModal({ isOpen, title, message, confirmLabel, danger = false, onClose, onConfirm }: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ExamModal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      actions={
        <button
          onClick={() => {
            onClose();
            onConfirm();
          }}
          className={`${primaryButton} ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {confirmLabel}
        </button>
      }
    >
      <p>{message}</p>
    </ExamModal>
  );
}
