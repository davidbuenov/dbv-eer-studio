import { X } from 'lucide-react';

interface ModalClearConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal de confirmación para limpiar todo el diagrama
 */
export function ModalClearConfirm({ isOpen, onClose, onConfirm }: ModalClearConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-red-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Confirmar Limpieza</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600">
            ¿Estás seguro de que deseas borrar toda la definición? Esta acción no se puede deshacer.
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
            Borrar Todo
          </button>
        </div>
      </div>
    </div>
  );
}
