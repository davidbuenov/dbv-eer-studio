// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useRef } from 'react';
import { Code, Trash2, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/language';
import type { TranslationKey } from '../i18n/es';
import type { Diagnostic } from '../types/compiler';

interface CodePanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  onClear: () => void;
  onEditStart?: () => void;
  diagnostics?: Diagnostic[];
  isValid?: boolean;
  elementCount?: { entities: number; relations: number };
  countSummary?: string;
}

export function CodePanel({
  code,
  onCodeChange,
  onClear,
  onEditStart,
  diagnostics,
  isValid = true,
  elementCount,
  countSummary,
}: CodePanelProps) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeChange = (newCode: string) => {
    onCodeChange(newCode);
  };

  const handleTextareaFocus = () => {
    if (onEditStart) {
      onEditStart();
    }
  };

  // Permite hacer clic en el mensaje de error para situar el cursor en la línea
  const handleDiagnosticClick = (lineNum: number) => {
    if (!textareaRef.current) return;
    const lines = code.split('\n');
    let charPos = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
      charPos += (lines[i]?.length ?? 0) + 1;
    }
    textareaRef.current.focus();
    const lineLength = lines[lineNum - 1]?.length ?? 0;
    textareaRef.current.setSelectionRange(charPos, charPos + lineLength);
  };

  const firstError = diagnostics?.find(d => d.severity === 'error');
  const firstWarning = diagnostics?.find(d => d.severity === 'warning');

  return (
    <div className="flex flex-col h-full border-r border-slate-200 bg-white shadow-lg z-20 w-full">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 bg-slate-50">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Code className="h-3 w-3" /> {t('codePanel.definition')}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!code.trim()) {
                onCodeChange('');
              } else {
                onClear();
              }
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
            title={t('codePanel.clearTitle')}
          >
            <Trash2 className="h-3 w-3" /> {t('codePanel.clear')}
          </button>
          <div className="text-[10px] text-slate-400">{t('codePanel.hint')}</div>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        onFocus={handleTextareaFocus}
        className="flex-1 resize-none bg-slate-50 p-4 font-mono text-xs md:text-sm leading-relaxed text-slate-700 focus:outline-none selection:bg-indigo-100"
        spellCheck={false}
      />

      {/* Barra inferior de Diagnósticos y Compilación (Linter EER) */}
      {diagnostics !== undefined && (
        <div
          className={`flex items-center justify-between px-3 py-1.5 border-t text-xs select-none transition-colors ${
            !isValid && firstError
              ? 'bg-red-50 border-red-200 text-red-700 cursor-pointer hover:bg-red-100'
              : firstWarning
              ? 'bg-amber-50 border-amber-200 text-amber-800 cursor-pointer hover:bg-amber-100'
              : 'bg-emerald-50/70 border-emerald-200/60 text-emerald-800'
          }`}
          onClick={() => {
            if (firstError) handleDiagnosticClick(firstError.line);
            else if (firstWarning) handleDiagnosticClick(firstWarning.line);
          }}
          title={
            firstError || firstWarning
              ? 'Clic para ir a la línea en el editor'
              : undefined
          }
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
            {!isValid && firstError ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span className="font-semibold text-red-800 shrink-0">
                  {t('compiler.line', { line: firstError.line })}:
                </span>
                <span className="truncate text-red-700 font-medium">
                  {t(firstError.messageKey as TranslationKey, firstError.params)}
                </span>
              </>
            ) : firstWarning ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold text-amber-800 shrink-0">
                  {t('compiler.line', { line: firstWarning.line })}:
                </span>
                <span className="truncate text-amber-700 font-medium">
                  {t(firstWarning.messageKey as TranslationKey, firstWarning.params)}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-emerald-700">
                  {t('compiler.valid')}
                </span>
                {code.trim() ? (
                  countSummary ? (
                    <span className="text-[11px] text-emerald-600/80">
                      ({countSummary})
                    </span>
                  ) : elementCount ? (
                    <span className="text-[11px] text-emerald-600/80">
                      ({t('compiler.entitiesAndRelations', {
                        entities: elementCount.entities,
                        relations: elementCount.relations,
                      })})
                    </span>
                  ) : null
                ) : (
                  <span className="text-[11px] text-slate-400">
                    ({t('compiler.empty')})
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
