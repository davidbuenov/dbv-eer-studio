// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

/**
 * Copia al portapapeles con respaldo. Dentro del iframe del reproductor SCORM la Clipboard API
 * suele estar bloqueada (falta `allow="clipboard-write"`) y SEB puede restringirla, así que se
 * prueba después `execCommand('copy')`. Si ambos fallan, quien llama muestra el texto
 * seleccionado para que el alumno lo copie con Ctrl+C: nunca se falla en silencio.
 */

export type CopyMethod = 'clipboard' | 'execCommand' | 'failed';

interface CopyEnvironment {
  clipboard?: Pick<Clipboard, 'writeText'>;
  document?: Document;
}

function copyWithExecCommand(text: string, doc: Document): boolean {
  const textarea = doc.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  doc.body.appendChild(textarea);
  try {
    textarea.select();
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    doc.body.removeChild(textarea);
  }
}

export async function copyText(
  text: string,
  env: CopyEnvironment = { clipboard: globalThis.navigator?.clipboard, document: globalThis.document },
): Promise<CopyMethod> {
  if (env.clipboard) {
    try {
      await env.clipboard.writeText(text);
      return 'clipboard';
    } catch {
      // Bloqueada por permisos del iframe o del navegador: se intenta el método antiguo.
    }
  }
  if (env.document && copyWithExecCommand(text, env.document)) return 'execCommand';
  return 'failed';
}
