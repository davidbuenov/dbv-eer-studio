// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertOctagon, Copy, Check, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

/**
 * Límite de errores React para garantizar la disponibilidad continua del editor
 * y evitar que cualquier excepción imprevista desmonte la aplicación o pierda datos.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[EER-Studio ErrorBoundary] Excepción capturada:', error, errorInfo);
    try {
      // Intento de rescate de emergencia en localStorage
      const backupData = {
        error: error.message,
        stack: error.stack,
        time: new Date().toISOString(),
      };
      localStorage.setItem('eer_studio_crash_report', JSON.stringify(backupData));
    } catch {
      // Ignorar fallos de almacenamiento si localStorage está deshabilitado
    }
  }

  handleCopyDetails = () => {
    const errorDetails = `EER Studio Error Report\nDate: ${new Date().toISOString()}\nError: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-100 p-6">
          <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertOctagon className="h-8 w-8 shrink-0" />
              <h2 className="text-lg font-bold text-slate-800">
                Se ha producido un error inesperado
              </h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              El editor ha contenido el error para proteger el trabajo. Puedes copiar el reporte técnico o recargar la aplicación.
            </p>

            {this.state.error && (
              <div className="mb-4 rounded-lg bg-slate-900 p-3 font-mono text-xs text-red-300 max-h-36 overflow-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={this.handleCopyDetails}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {this.state.copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {this.state.copied ? '¡Reporte copiado!' : 'Copiar reporte'}
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Recargar aplicación
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
