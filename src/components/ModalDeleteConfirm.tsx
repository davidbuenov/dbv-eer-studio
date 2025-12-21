import { X, Trash2 } from 'lucide-react';
import type { NodeData } from '../types';

interface ModalDeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  node: NodeData | null;
}

export function ModalDeleteConfirm({ isOpen, onClose, onConfirm, node }: ModalDeleteConfirmProps) {
  if (!isOpen || !node) return null;

  const getNodeTypeName = (type: string) => {
    const types: Record<string, string> = {
      entity: 'Entidad',
      weak_entity: 'Entidad Débil',
      relationship: 'Relación',
      ident_rel: 'Relación Identificativa',
      attribute: 'Atributo',
      key_attr: 'Atributo Clave',
      derived_attr: 'Atributo Derivado',
      multivalued_attr: 'Atributo Multivaluado',
      specialization: 'Especialización'
    };
    return types[type] || 'Elemento';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-red-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Confirmar Eliminación</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-700">
            ¿Estás seguro de que deseas eliminar <span className="font-semibold">{getNodeTypeName(node.type)}</span> "<span className="font-semibold text-indigo-600">{node.label}</span>"?
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Esta acción no se puede deshacer. También se eliminarán todas las conexiones relacionadas.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
