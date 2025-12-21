import { X } from 'lucide-react';
import type { NodeData } from '../types';
import type { ModalState } from '../hooks/useModalState';

interface ModalPropertiesProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NodeData[];
  modalState: ModalState;
  setters: {
    setElementName: (v: string) => void;
    setElementType2: (v: string) => void;
    setSelectedEntity: (v: string) => void;
    setSelectedEntity1: (v: string) => void;
    setSelectedEntity2: (v: string) => void;
    setCardinalityE1: (v: string) => void;
    setCardinalityE2: (v: string) => void;
    setCustomCard1: (v: string) => void;
    setCustomCard2: (v: string) => void;
    setTotalE1: (v: boolean) => void;
    setTotalE2: (v: boolean) => void;
    setSpecType: (v: string) => void;
    setSpecSuperclass: (v: string) => void;
    setSpecSubclasses: (v: string[]) => void;
    setUnionName: (v: string) => void;
    setUnionSuperclasses: (v: string[]) => void;
    setUnionCategory: (v: string) => void;
  };
  onConfirm: () => void;
}

/**
 * Modal para configurar propiedades de elementos (entidades, relaciones, atributos, etc.)
 * 
 * Cambia dinámicamente según el tipo de elemento seleccionado:
 * - Entidades: nombre
 * - Relaciones: nombre, entidades participantes, cardinalidades
 * - Atributos: nombre, tipo, entidad asociada
 * - Especializaciones: tipo, superclase, subclases
 * - Uniones: nombre, superclases, categoría
 */
export function ModalProperties({ 
  isOpen, 
  onClose, 
  nodes, 
  modalState: state,
  setters,
  onConfirm 
}: ModalPropertiesProps) {
  if (!isOpen) return null;

  const entities = nodes
    .filter(n => ['entity', 'weak_entity'].includes(n.type))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-indigo-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {['entity', 'weak_entity'].includes(state.elementType || '') ? 'Propiedades de la Entidad' : 
             ['relationship', 'ident_rel'].includes(state.elementType || '') ? 'Propiedades de la Relación' :
             state.elementType === 'specialization' ? 'Especialización/Generalización' :
             state.elementType === 'union' ? 'Unión/Categoría' :
             'Propiedades del Atributo'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {['entity', 'weak_entity'].includes(state.elementType || '') ? 'Nombre de la Entidad' : 
               ['relationship', 'ident_rel'].includes(state.elementType || '') ? 'Nombre de la Relación' :
               'Nombre del Atributo'}
            </label>
            <input
              type="text"
              value={state.elementName}
              onChange={(e) => setters.setElementName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
              placeholder={['entity', 'weak_entity'].includes(state.elementType || '') ? 'ej: EMPLEADO, CLIENTE' : 
                          ['relationship', 'ident_rel'].includes(state.elementType || '') ? 'ej: TRABAJA_EN, PERTENECE_A' :
                          'ej: Nombre, DNI, Teléfono'}
            />
          </div>

          {/* Configuración de relaciones */}
          {['relationship', 'ident_rel'].includes(state.elementType || '') && (
            <>
              {/* Primera Entidad */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-600 uppercase mb-3">Primera Entidad</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Entidad</label>
                    <select
                      value={state.selectedEntity1}
                      onChange={(e) => setters.setSelectedEntity1(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Selecciona --</option>
                      {entities.map(n => (
                        <option key={n.id} value={n.label}>{n.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad</label>
                    <select
                      value={state.cardinalityE1}
                      onChange={(e) => setters.setCardinalityE1(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="1">1</option>
                      <option value="N">N</option>
                      <option value="M">M</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  {state.cardinalityE1 === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad Personalizada</label>
                      <input
                        type="text"
                        value={state.customCard1}
                        onChange={(e) => setters.setCustomCard1(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                        placeholder="ej: (0..N), (1..4)"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.totalE1}
                      onChange={(e) => setters.setTotalE1(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label className="text-sm text-slate-700">Participación Total</label>
                  </div>
                </div>
              </div>

              {/* Segunda Entidad */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-600 uppercase mb-3">Segunda Entidad</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Entidad</label>
                    <select
                      value={state.selectedEntity2}
                      onChange={(e) => setters.setSelectedEntity2(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Selecciona --</option>
                      {entities.map(n => (
                        <option key={n.id} value={n.label}>{n.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad</label>
                    <select
                      value={state.cardinalityE2}
                      onChange={(e) => setters.setCardinalityE2(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="1">1</option>
                      <option value="N">N</option>
                      <option value="M">M</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  {state.cardinalityE2 === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cardinalidad Personalizada</label>
                      <input
                        type="text"
                        value={state.customCard2}
                        onChange={(e) => setters.setCustomCard2(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                        placeholder="ej: (0..N), (1..4)"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.totalE2}
                      onChange={(e) => setters.setTotalE2(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label className="text-sm text-slate-700">Participación Total</label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tipo de atributo */}
          {['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'].includes(state.elementType || '') && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Atributo</label>
                <select
                  value={state.elementType2}
                  onChange={(e) => setters.setElementType2(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="simple">Simple</option>
                  <option value="key">Clave (identificador)</option>
                  <option value="derived">Derivado</option>
                  <option value="multivalued">Multivaluado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asociar a Entidad</label>
                <select
                  value={state.selectedEntity}
                  onChange={(e) => setters.setSelectedEntity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Selecciona una entidad --</option>
                  {entities.map(n => (
                    <option key={n.id} value={n.label}>{n.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Especialización */}
          {state.elementType === 'specialization' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Especialización</label>
                <select
                  value={state.specType}
                  onChange={(e) => setters.setSpecType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="d">Disjunta (d)</option>
                  <option value="o">Solapada (o)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Superclase</label>
                <select
                  value={state.specSuperclass}
                  onChange={(e) => setters.setSpecSuperclass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Selecciona superclase --</option>
                  {entities.map(n => (
                    <option key={n.id} value={n.label}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subclases (selecciona múltiples)</label>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                  {entities
                    .filter(n => n.label !== state.specSuperclass)
                    .map(n => (
                      <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={state.specSubclasses.includes(n.label)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setters.setSpecSubclasses([...state.specSubclasses, n.label]);
                            } else {
                              setters.setSpecSubclasses(state.specSubclasses.filter(s => s !== n.label));
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{n.label}</span>
                      </label>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Unión */}
          {state.elementType === 'union' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Unión</label>
                <input
                  type="text"
                  value={state.unionName}
                  onChange={(e) => setters.setUnionName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                  placeholder="ej: u, u1, u2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Superclases (selecciona múltiples)</label>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                  {entities.map(n => (
                    <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={state.unionSuperclasses.includes(n.label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setters.setUnionSuperclasses([...state.unionSuperclasses, n.label]);
                          } else {
                            setters.setUnionSuperclasses(state.unionSuperclasses.filter(s => s !== n.label));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">{n.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select
                  value={state.unionCategory}
                  onChange={(e) => setters.setUnionCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Selecciona categoría --</option>
                  {entities.map(n => (
                    <option key={n.id} value={n.label}>{n.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
