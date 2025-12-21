import React from 'react';
import { Square, SquareDashed, Diamond, Zap, Circle, GitBranch, Layers } from 'lucide-react';

interface ToolbarProps {
  selectedTool: string | null;
  onToolSelect: (tool: string | null) => void;
}

export function Toolbar({ selectedTool, onToolSelect }: ToolbarProps) {
  const toolButtons = [
    {
      id: 'entity',
      label: 'Entidad',
      icon: Square,
      title: 'Entidad fuerte (click en canvas)',
      group: 'entities'
    },
    {
      id: 'weak_entity',
      label: 'Entidad Débil',
      icon: SquareDashed,
      title: 'Entidad débil (click en canvas)',
      group: 'entities'
    },
    {
      id: 'relationship',
      label: 'Relación',
      icon: Diamond,
      title: 'Relación fuerte (click en canvas)',
      group: 'relationships'
    },
    {
      id: 'ident_rel',
      label: 'Rel. Identif.',
      icon: Zap,
      title: 'Relación identificativa (click en canvas)',
      group: 'relationships'
    },
    {
      id: 'attribute',
      label: 'Atributo',
      icon: Circle,
      title: 'Atributo simple (click en canvas)',
      group: 'attributes'
    },
    {
      id: 'key_attr',
      label: 'Atrib. Clave',
      icon: Zap,
      title: 'Atributo clave (click en canvas)',
      group: 'attributes'
    },
    {
      id: 'specialization',
      label: 'Especialización',
      icon: GitBranch,
      title: 'Especialización/Generalización',
      group: 'hierarchy'
    },
    {
      id: 'union',
      label: 'Unión',
      icon: Layers,
      title: 'Unión/Categoría',
      group: 'hierarchy'
    }
  ];

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
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">Insertar:</span>
      
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
    </div>
  );
}
