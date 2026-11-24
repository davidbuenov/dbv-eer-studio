import React, { useMemo } from 'react';
import { Square, SquareDashed, Diamond, Zap, Circle, GitBranch, Layers, Undo2, Redo2 } from 'lucide-react';
import { useLanguage } from '../i18n/language';

/** Deshacer/rehacer del DSL EER (§3.11 H). */
export interface ToolbarHistory {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface ToolbarProps {
  selectedTool: string | null;
  onToolSelect: (tool: string | null) => void;
  history?: ToolbarHistory;
}

const historyButtonClass =
  'flex items-center rounded-md border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40';

function ToolbarComponent({ selectedTool, onToolSelect, history }: ToolbarProps) {
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

      {history && (
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={history.onUndo}
            disabled={!history.canUndo}
            title={t('toolbar.undo')}
            aria-label={t('toolbar.undo')}
            className={historyButtonClass}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={history.onRedo}
            disabled={!history.canRedo}
            title={t('toolbar.redo')}
            aria-label={t('toolbar.redo')}
            className={historyButtonClass}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export const Toolbar = React.memo(ToolbarComponent, (prevProps, nextProps) => {
  // Retorna true si NO debería re-renderizar (props son iguales). El comparador es a mano:
  // cualquier prop nueva que cambie el aspecto debe añadirse aquí o la barra no se actualiza.
  return (
    prevProps.selectedTool === nextProps.selectedTool &&
    prevProps.onToolSelect === nextProps.onToolSelect &&
    prevProps.history?.canUndo === nextProps.history?.canUndo &&
    prevProps.history?.canRedo === nextProps.history?.canRedo &&
    prevProps.history?.onUndo === nextProps.history?.onUndo &&
    prevProps.history?.onRedo === nextProps.history?.onRedo
  );
});
