// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useEffect, useRef, useState } from 'react';
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
  /** Líneas (base 0) a resaltar: las del elemento seleccionado en el diagrama. */
  highlightedLines?: readonly number[];
  /** Línea (base 0) que debe quedar visible; el editor se desplaza hasta ella. */
  focusLine?: number | null;
}

// Debe coincidir con el padding `p-4` del textarea para que las bandas caigan sobre sus líneas.
const EDITOR_PADDING_PX = 16;
const NO_HIGHLIGHTS: readonly number[] = [];

export function CodePanel({
  code,
  onCodeChange,
  onClear,
  onEditStart,
  diagnostics,
  isValid = true,
  elementCount,
  countSummary,
  highlightedLines = NO_HIGHLIGHTS,
  focusLine = null,
}: CodePanelProps) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [lineHeight, setLineHeight] = useState(20);

  // El interlineado cambia con el breakpoint (text-xs / md:text-sm): se mide del estilo real.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const observer = new ResizeObserver(() => {
      const measured = parseFloat(getComputedStyle(textarea).lineHeight);
      if (!Number.isNaN(measured)) setLineHeight(measured);
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  // Desplaza el editor hasta el elemento seleccionado sin enfocarlo: enfocar el textarea
  // dispararía `onEditStart`, que deselecciona el nodo y apagaría el propio resaltado.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || focusLine === null) return;
    const lineTop = EDITOR_PADDING_PX + focusLine * lineHeight;
    const isVisible = lineTop >= textarea.scrollTop && lineTop + lineHeight <= textarea.scrollTop + textarea.clientHeight;
    if (!isVisible) {
      textarea.scrollTop = Math.max(0, lineTop - textarea.clientHeight / 2);
    }
  }, [focusLine, lineHeight]);

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

      <div className="relative flex-1 overflow-hidden bg-slate-50">
        {/* Capa de resaltado detrás del texto: sin ajuste de línea, línea N = banda N */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {highlightedLines.map(line => (
            <div
              key={line}
              className="absolute left-0 right-0 border-l-4 border-indigo-500 bg-indigo-100/80"
              style={{ top: EDITOR_PADDING_PX + line * lineHeight - scrollTop, height: lineHeight }}
            />
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          wrap="off"
          onChange={(e) => handleCodeChange(e.target.value)}
          onFocus={handleTextareaFocus}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          className="relative h-full w-full resize-none bg-transparent p-4 font-mono text-xs md:text-sm leading-relaxed text-slate-700 focus:outline-none selection:bg-indigo-200 whitespace-pre overflow-auto"
          spellCheck={false}
        />
      </div>

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
              ? t('codePanel.goToLine')
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
