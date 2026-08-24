import { Code, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n/language';

interface CodePanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  onClear: () => void;
  onEditStart?: () => void;
}

export function CodePanel({ code, onCodeChange, onClear, onEditStart }: CodePanelProps) {
  const { t } = useLanguage();

  const handleCodeChange = (newCode: string) => {
    onCodeChange(newCode);
  };

  const handleTextareaFocus = () => {
    if (onEditStart) {
      onEditStart();
    }
  };

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
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        onFocus={handleTextareaFocus}
        className="flex-1 resize-none bg-slate-50 p-4 font-mono text-xs md:text-sm leading-relaxed text-slate-700 focus:outline-none selection:bg-indigo-100"
        spellCheck={false}
      />
    </div>
  );
}
