// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { useState } from 'react';
import { X, Layers, Database, BookOpen } from 'lucide-react';
import { useLanguage } from '../i18n/language';

interface ModalHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de ayuda mostrando la guía de sintaxis DSL tanto para EER como para el Modelo Relacional
 */
export function ModalHelp({ isOpen, onClose }: ModalHelpProps) {
  const { t } = useLanguage();
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
              <h2 className="text-lg font-bold text-slate-800">{t('modalHelp.title')}</h2>
              <p className="text-xs text-slate-500">{t('modalHelp.subtitle')}</p>
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
            <span>{t('modalHelp.tabEER')}</span>
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
            <span>{t('modalHelp.tabRelational')}</span>
          </button>
        </div>

        {/* Contenido según Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-4 mt-2">
          {activeTab === 'eer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600 flex items-center gap-2">{t('modalHelp.eer.entitiesTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">entity EMPLEADO (100, 150)</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.entity.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">weak_entity DEPENDIENTE</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.weakEntity.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">relationship TRABAJA_EN</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.relationship.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">identifying_relationship ES_DE</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.identRel.desc')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">{t('modalHelp.eer.attributesTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att Nombre -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.attrSimple.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att DNI [key] -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.attrKey.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att Edad [derived] -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.attrDerived.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">att Telefono [multivalued] -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.attrMultivalued.desc')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">{t('modalHelp.eer.connectionsTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">link EMPLEADO TRABAJA_EN "N"</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.link.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">link DEPARTAMENTO TRABAJA_EN "1" [total]</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.linkTotal.desc')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">{t('modalHelp.eer.hierarchyTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">spec d -&gt; EMPLEADO</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.spec.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">link d INGENIERO</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.specLink.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">union u</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.eer.union.desc')}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'relational' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">{t('modalHelp.rel.tablesTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">table EMPLEADO [x: 60, y: 60] &#123; ... &#125;</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.tableCoords.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">table DEPARTAMENTO &#123; ... &#125;</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.tableAuto.desc')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">{t('modalHelp.rel.columnsTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">DNI NUMBER(10) PK</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.colPK.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">NOMBRE VARCHAR2(100) NOT NULL</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.colNotNull.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">FECHA_INGRESO DATE NULLable</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.colNullable.desc')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">{t('modalHelp.rel.fkTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">DEPT_ID NUMBER(10) FK -&gt; DEPARTAMENTO(NUMERO)</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.fkRegular.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">EMP_ID NUMBER(10) PK FK -&gt; EMPLEADO(ID)</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.fkPk.desc')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2.5 font-bold text-indigo-600">{t('modalHelp.rel.constraintsTitle')}</h3>
                <ul className="space-y-3">
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">GERENTE_ID NUMBER(10) FK UNIQUE</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.unique.desc')}</span>
                  </li>
                  <li className="flex flex-col">
                    <code className="bg-slate-100 px-2 py-1 rounded text-indigo-950 font-mono text-xs w-fit">ON DELETE CASCADE / SET NULL</code>
                    <span className="text-xs text-slate-500 mt-0.5">{t('modalHelp.rel.cascade.desc')}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="mt-4 border-t border-slate-200 pt-4 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            {t('modalHelp.footer.activeSyntax', { syntax: activeTab === 'eer' ? t('modalHelp.footer.eerDsl') : t('modalHelp.footer.relDsl') })}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
          >
            {t('common.understood')}
          </button>
        </div>
      </div>
    </div>
  );
}
