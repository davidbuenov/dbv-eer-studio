import { X } from 'lucide-react';

interface ModalHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de ayuda mostrando la guía de sintaxis DSL para EER Studio
 */
export function ModalHelp({ isOpen, onClose }: ModalHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Guía de Sintaxis EER</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 overflow-y-auto p-2">
          <div>
            <h3 className="mb-2 font-bold text-indigo-600">Entidades y Relaciones</h3>
            <ul className="space-y-2">
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">ent NOMBRE (x, y)</code> <span>Entidad. Coords opcionales.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">weak_ent NOMBRE</code> <span>Entidad débil.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">rel NOMBRE</code> <span>Relación.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">ident_rel NOMBRE</code> <span>Relación identificativa.</span></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-bold text-indigo-600">Atributos</h3>
            <ul className="space-y-2">
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">att NOMBRE -&gt; ENTIDAD</code> <span>Atributo simple.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">key_att NOMBRE -&gt; ENTIDAD</code> <span>Atributo clave.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">derived_att NOMBRE -&gt; ENTIDAD</code> <span>Derivado.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">multivalued_att NOMBRE -&gt; ENTIDAD</code> <span>Multivaluado.</span></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-bold text-indigo-600">Conexiones</h3>
            <ul className="space-y-2">
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">link A B "1"</code> <span>Conexión simple.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">link A B "N" [total]</code> <span>Participación total.</span></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-bold text-indigo-600">EER (Avanzado)</h3>
            <ul className="space-y-2">
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">spec d -&gt; SUPERCLASE</code> <span>Especialización.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">link d SUBCLASE</code> <span>Conecta subclase.</span></li>
              <li className="flex flex-col"><code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 w-fit">union u</code> <span>Categoría de Unión.</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-4 text-center flex-shrink-0">
          <button onClick={onClose} className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">Entendido</button>
        </div>
      </div>
    </div>
  );
}
