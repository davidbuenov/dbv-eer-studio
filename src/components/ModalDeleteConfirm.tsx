import { X, Trash2 } from 'lucide-react';
import type { NodeData } from '../types';
import { useLanguage } from '../i18n/language';
import type { TranslationKey } from '../i18n/es';

interface ModalDeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nodes: NodeData[];
}

// Indexado por `NodeType` (el tipo real del nodo), no por el nombre de la herramienta de la toolbar.
const NODE_TYPE_KEYS: Record<string, TranslationKey> = {
  entity: 'nodeType.entity',
  weak_entity: 'nodeType.weak_entity',
  relationship: 'nodeType.relationship',
  identifying_relationship: 'nodeType.ident_rel',
  attribute: 'nodeType.attribute',
  key_attribute: 'nodeType.key_attr',
  derived_attribute: 'nodeType.derived_attr',
  multivalued_attribute: 'nodeType.multivalued_attr',
  specialization: 'nodeType.specialization',
  union: 'nodeType.union',
};

export function ModalDeleteConfirm({ isOpen, onClose, onConfirm, nodes }: ModalDeleteConfirmProps) {
  const { t } = useLanguage();

  if (!isOpen || nodes.length === 0) return null;

  const [first] = nodes;
  const message = nodes.length === 1
    ? t('modalDeleteConfirm.message', { typeName: t(NODE_TYPE_KEYS[first!.type] ?? 'nodeType.default'), label: first!.label })
    : t('modalDeleteConfirm.messageMultiple', { count: nodes.length, labels: nodes.map(n => n.label).join(', ') });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-red-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">{t('modalDeleteConfirm.title')}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-700 break-words">{message}</p>
          <p className="text-sm text-slate-500 mt-2">
            {t('modalDeleteConfirm.subMessage')}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            autoFocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            {t('modalDeleteConfirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
