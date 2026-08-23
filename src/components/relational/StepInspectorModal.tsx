// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React from 'react';
import { X, BookOpen, CheckCircle, Info, HelpCircle } from 'lucide-react';
import type { StepTrace, RelationalTable } from '../../types/relational';

interface StepInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: RelationalTable | null;
}

const FORMAL_STEPS = [
  {
    step: 1,
    title: 'Paso 1: Entidades Fuertes',
    desc: 'Por cada tipo de entidad fuerte E, se crea una relación (tabla) R. Los atributos simples se incluyen directamente como columnas. La clave primaria de E se convierte en la PK de R.',
  },
  {
    step: 2,
    title: 'Paso 2: Entidades Débiles',
    desc: 'Se crea una tabla para la entidad débil W. Se propaga la PK de la entidad propietaria como FK y se combina con la clave parcial de W para formar su PK compuesta (con ON DELETE CASCADE).',
  },
  {
    step: 3,
    title: 'Paso 3: Relaciones Binarias 1:1',
    desc: 'Se elige la relación con participación total e incluye como FK la clave primaria de la otra tabla, marcándola con restricción UNIQUE.',
  },
  {
    step: 4,
    title: 'Paso 4: Relaciones Binarias 1:N',
    desc: 'Se propaga la clave primaria de la tabla del lado 1 como clave ajena (FK) en la tabla del lado N. Los atributos de la relación migran al lado N.',
  },
  {
    step: 5,
    title: 'Paso 5: Relaciones Binarias M:N',
    desc: 'Se crea una tabla puente de correspondencia. Su PK es la combinación de las FKs que referencian a las dos entidades participantes.',
  },
  {
    step: 6,
    title: 'Paso 6: Atributos Multivalorados',
    desc: 'Para cada atributo multivalor se crea una tabla independiente con la PK del propietario y el valor del atributo (evitando violar la 1FN).',
  },
  {
    step: 7,
    title: 'Paso 7: Relaciones n-arias (n > 2)',
    desc: 'Se crea una tabla de relación n-vías que incluye las PKs de todas las entidades participantes como claves ajenas.',
  },
  {
    step: 8,
    title: 'Paso 8: Especialización y Generalización',
    desc: 'Se aplican las opciones de herencia: 8A (varias tablas con FK a la superclase), 8B (tablas solo por subclase), 8C (tabla única con discriminador) u 8D (banderas booleanas).',
  },
  {
    step: 9,
    title: 'Paso 9: Categorías (Tipos de Unión)',
    desc: 'Se crea una tabla de categoría con clave sustituta artificial (Caso 9.1) o PK unificada compartida (Caso 9.2).',
  },
];

export const StepInspectorModal: React.FC<StepInspectorModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
}) => {
  if (!isOpen) return null;

  const currentTrace: StepTrace | undefined = selectedTable?.stepTrace;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Guía Docente: Algoritmo de Mapeo EER ➔ Relacional
              </h2>
              <p className="text-xs text-slate-400">
                Explicación didáctica de los 9 pasos formales para estudiantes universitarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedTable && currentTrace && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Inspección Activa: Tabla '{selectedTable.name}'</span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                {currentTrace.stepTitle}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentTrace.description}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              Resumen Teórico de los 9 Pasos del Algoritmo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FORMAL_STEPS.map(item => {
                const isCurrent = currentTrace?.stepNumber === item.step;
                return (
                  <div
                    key={item.step}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-200 mb-1 flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        Paso {item.step}
                      </span>
                    </div>
                    <p className="leading-relaxed text-slate-300">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            Basado en la especificación formal <code>eer-to-relational-mapping.md</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
