// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * Descarga un contenido de texto como fichero.
 *
 * Único punto del proyecto que crea un object URL para descargar: repartir este patrón
 * en varios sitios ya había hecho que unas copias revocasen el URL y otras no, dejando
 * el Blob anclado en memoria durante toda la vida del proceso (relevante en la app de
 * escritorio, que se mantiene abierta horas).
 */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
