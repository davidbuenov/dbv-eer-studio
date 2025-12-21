import { X, BookOpen } from 'lucide-react';

interface ModalCreditsProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de créditos mostrando información del autor y contribuidores
 */
export function ModalCredits({ isOpen, onClose }: ModalCreditsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-indigo-50 to-white p-8 shadow-2xl border border-indigo-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-indigo-900">Créditos</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-indigo-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
        <div className="space-y-6 text-slate-700">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-indigo-900 mb-2">EER Studio</h3>
            <p className="text-sm text-slate-600">Editor de Diagramas Entidad-Relación Extendido</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="text-sm leading-relaxed">
              <strong className="text-indigo-900">Desarrollado por:</strong><br />
              <a href="https://davidbuenov.com/" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors">
                David Bueno Vallejo
              </a>
              <br />
              <a href="https://github.com/davidbuenov/eer-studio" target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-block text-slate-500 hover:text-slate-700 hover:underline transition-colors">
                Repositorio GitHub · https://github.com/davidbuenov/eer-studio
              </a>
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="text-sm leading-relaxed">
              <strong className="text-indigo-900">Asistencia de IA:</strong><br />
              Este proyecto fue desarrollado con la ayuda de <strong>Gemini</strong> y <strong>GitHub Copilot</strong>,
              herramientas de inteligencia artificial que facilitaron el desarrollo y la implementación de funcionalidades.
            </p>
          </div>

          <div className="text-center pt-4 border-t border-indigo-100">
            <p className="text-xs text-slate-500">
              © 2025 David Bueno Vallejo<br />
              Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
