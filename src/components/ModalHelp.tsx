// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useState } from 'react';
import { X, Layers, Database, BookOpen } from 'lucide-react';


interface ModalHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de ayuda mostrando la guía de sintaxis DSL tanto para EER como para el Modelo Relacional
 */
export function ModalHelp({ isOpen, onClose }: ModalHelpProps) {
  const [activeTab, setActiveTab] = useState<'eer' | 'relational'>('eer');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal con Pestañas */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Guía de Sintaxis DSL</h2>
              <p className="text-xs text-slate-500">Referencia rápida de código para diagramas EER y esquemas relacionales</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Selector de Pestaña (EER vs Relacional) */}
        <div className="flex items-center gap-2 mt-4 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('eer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'eer'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sintaxis Diagrama EER</span>
          </button>

          <button
            onClick={() => setActiveTab('relational')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'relational'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Sintaxis Modelo Relacional</span>
          </button>
        </div>

        {/* Contenido según Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-4 mt-2">
          {activeTab === 'eer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600 flex items-center gap-2">Entidades y Relaciones</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">entity EMPLEADO (100, 150)</code>
                    <span className="text-xs text-slate-500 mt-0.5">Entidad fuerte con coordenadas opcionales (x, y).</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">weak_entity DEPENDIENTE</code>
                    <span className="text-xs text-slate-500 mt-0.5">Entidad débil que depende de una propietaria.</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">relationship TRABAJA_EN</code>
                    <span className="text-xs text-slate-500 mt-0.5">Relación binaria regular.</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">identifying_relationship ES_DE</code>
                    <span className="text-xs text-slate-500 mt-0.5">Relación identificativa para entidad débil.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">Atributos</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att Nombre -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">Atributo simple regular.</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att DNI [key] -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">Atributo clave primaria (subrayado).</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att Edad [derived] -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">Atributo derivado (línea discontinua).</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att Telefono [multivalued] -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">Atributo multivalorado (elipse doble).</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">Conexiones y Cardinalidad</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">link EMPLEADO TRABAJA_EN "N"</code>
                    <span className="text-xs text-slate-500 mt-0.5">Conexión con cardinalidad "1", "N" o "M".</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">link DEPARTAMENTO TRABAJA_EN "1" [total]</code>
                    <span className="text-xs text-slate-500 mt-0.5">Participación total (línea doble).</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">Jerarquías EER (Avanzado)</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">spec d -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">Especialización disjunta (d) u solapada (o).</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">link d INGENIERO</code>
                    <span className="text-xs text-slate-500 mt-0.5">Conecta una subclase al nodo de especialización.</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">union u</code>
                    <span className="text-xs text-slate-500 mt-0.5">Categoría (Tipo de Unión Paso 9).</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'relational' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">Definición de Tablas y Posición</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">table EMPLEADO [x: 60, y: 60] &#123; ... &#125;</code>
                    <span className="text-xs text-slate-500 mt-0.5">Declara una tabla relacional con sus coordenadas 2D.</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">table DEPARTAMENTO &#123; ... &#125;</code>
                    <span className="text-xs text-slate-500 mt-0.5">Declara una tabla con posicionamiento automático.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">Columnas y Claves Primarias</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">DNI NUMBER(10) PK</code>
                    <span className="text-xs text-slate-500 mt-0.5">Columna Clave Primaria (PK).</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">NOMBRE VARCHAR2(100) NOT NULL</code>
                    <span className="text-xs text-slate-500 mt-0.5">Atributo regular obligatorio.</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">FECHA_INGRESO DATE NULLable</code>
                    <span className="text-xs text-slate-500 mt-0.5">Atributo opcional que permite nulos.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">Claves Ajenas (FK) e Integridad Referencial</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">DEPT_ID NUMBER(10) FK -&gt; DEPARTAMENTO(NUMERO)</code>
                    <span className="text-xs text-slate-500 mt-0.5">Clave ajena regular (relación 1:N no identificativa).</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">EMP_ID NUMBER(10) PK FK -&gt; EMPLEADO(ID)</code>
                    <span className="text-xs text-slate-500 mt-0.5">FK que forma parte de PK (relación identificativa / herencia).</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">Restricciones de Unicidad y Cascada</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">GERENTE_ID NUMBER(10) FK UNIQUE</code>
                    <span className="text-xs text-slate-500 mt-0.5">Restricción de unicidad para relaciones 1:1.</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">ON DELETE CASCADE / SET NULL</code>
                    <span className="text-xs text-slate-500 mt-0.5">Reglas de eliminación referencial.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="mt-4 border-t border-slate-200 pt-4 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            Sintaxis activa: {activeTab === 'eer' ? 'Diagrama EER DSL' : 'Modelo Relacional DSL'}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
