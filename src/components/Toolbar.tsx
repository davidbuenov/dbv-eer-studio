import React, { useMemo } from 'react';
import { Square, SquareDashed, Diamond, Zap, Circle, GitBranch, Layers } from 'lucide-react';
import { useLanguage } from '../i18n/language';

interface ToolbarProps {
  selectedTool: string | null;
  onToolSelect: (tool: string | null) => void;
}

function ToolbarComponent({ selectedTool, onToolSelect }: ToolbarProps) {
  const { t } = useLanguage();

  const toolButtons = useMemo(() => [
    {
      id: 'entity',
      label: t('toolbar.entity.label'),
      icon: Square,
      title: t('toolbar.entity.title'),
      group: 'entities'
    },
    {
      id: 'weak_entity',
      label: t('toolbar.weakEntity.label'),
      icon: SquareDashed,
      title: t('toolbar.weakEntity.title'),
      group: 'entities'
    },
    {
      id: 'relationship',
      label: t('toolbar.relationship.label'),
      icon: Diamond,
      title: t('toolbar.relationship.title'),
      group: 'relationships'
    },
    {
      id: 'ident_rel',
      label: t('toolbar.identRel.label'),
      icon: Zap,
      title: t('toolbar.identRel.title'),
      group: 'relationships'
    },
    {
      id: 'attribute',
      label: t('toolbar.attribute.label'),
      icon: Circle,
      title: t('toolbar.attribute.title'),
      group: 'attributes'
    },
    {
      id: 'key_attr',
      label: t('toolbar.keyAttr.label'),
      icon: Zap,
      title: t('toolbar.keyAttr.title'),
      group: 'attributes'
    },
    {
      id: 'specialization',
      label: t('toolbar.specialization.label'),
      icon: GitBranch,
      title: t('toolbar.specialization.title'),
      group: 'hierarchy'
    },
    {
      id: 'union',
      label: t('toolbar.union.label'),
      icon: Layers,
      title: t('toolbar.union.title'),
      group: 'hierarchy'
    }
  ], [t]);

  const renderButtonGroup = (groupId: string, buttons: typeof toolButtons) => {
    const groupButtons = buttons.filter(b => b.group === groupId);
    return (
      <React.Fragment key={groupId}>
        {groupButtons.map((btn) => {
          const Icon = btn.icon;
          const isSelected = selectedTool === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => onToolSelect(isSelected ? null : btn.id)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              title={btn.title}
            >
              <Icon className="h-4 w-4" /> {btn.label}
            </button>
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">{t('toolbar.insert')}</span>
      
      {/* Entities */}
      {renderButtonGroup('entities', toolButtons)}
      
      <div className="w-px bg-slate-200 mx-1 h-6"></div>
      
      {/* Relationships */}
      {renderButtonGroup('relationships', toolButtons)}
      
      <div className="w-px bg-slate-200 mx-1 h-6"></div>
      
      {/* Attributes */}
      {renderButtonGroup('attributes', toolButtons)}
      
      <div className="w-px bg-slate-200 mx-1 h-6"></div>
      
      {/* Hierarchy */}
      {renderButtonGroup('hierarchy', toolButtons)}
      
      <div className="w-px bg-slate-200 mx-1 h-6"></div>
      
      {/* Instrucción sobre Shift */}
      <div className="text-xs text-slate-500 ml-auto flex items-center gap-2" title={t('toolbar.shiftHint.title')}>
        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Shift</kbd>
        <span>{t('toolbar.shiftHint.text')}</span>
      </div>
    </div>
  );
}

export const Toolbar = React.memo(ToolbarComponent, (prevProps, nextProps) => {
  // Retorna true si NO debería re-renderizar (props son iguales)
  return (
    prevProps.selectedTool === nextProps.selectedTool &&
    prevProps.onToolSelect === nextProps.onToolSelect
  );
});
