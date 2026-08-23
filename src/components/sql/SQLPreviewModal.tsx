// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import React, { useState } from 'react';
import { X, Copy, Download, Check, Database, FileCode } from 'lucide-react';
import type { RelationalSchema } from '../../types/relational';
import { relationalToSQL, type SQLDialect } from '../../utils/relational/relationalToSQL';


interface SQLPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: RelationalSchema;
}

export const SQLPreviewModal: React.FC<SQLPreviewModalProps> = ({
  isOpen,
  onClose,
  schema,
}) => {
  const [dialect, setDialect] = useState<SQLDialect>('oracle');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlCode = relationalToSQL(schema, dialect);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esquema_${dialect}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Exportar Script SQL DDL</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {dialect.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generación automática de sentencias DDL limpias y comentadas
              </p>
            </div>
          </div>

          {/* Selector de Dialecto SGBD */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">SGBD:</label>
            <select
              value={dialect}
              onChange={e => setDialect(e.target.value as SQLDialect)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="oracle">Oracle SQL (Universitario)</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="ansi">ANSI SQL</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visor de Código SQL */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-emerald-300 leading-relaxed border-b border-slate-800">
          <pre>{sqlCode}</pre>
        </div>

        {/* Barra Inferior de Acciones */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>{schema.tables.length} Tablas Relacionales Exportadas</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/30 transition"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .sql</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
