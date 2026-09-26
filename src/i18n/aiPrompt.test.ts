// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { getAIPrompt, AI_PROMPT_PLACEHOLDER } from './aiPrompt';
import { compileEER } from '../utils/compiler';

const DSL_COMMANDS = ['ent', 'weak_ent', 'att', 'key_att', 'derived_att', 'multivalued_att', 'rel', 'ident_rel', 'link', 'spec', 'union'];

/** Comandos del DSL que aparecen al inicio de un ejemplo en código (`\`cmd ...`). */
function commandsUsed(prompt: string): string[] {
  return DSL_COMMANDS.filter(cmd => new RegExp('`' + cmd + ' ').test(prompt));
}

/** Bloque del "ejemplo completo": líneas entre el título del ejemplo y la sección de la tarea. */
function fullExample(prompt: string): string {
  const lines = prompt.split('\n');
  const start = lines.findIndex(l => l.startsWith('### 📋'));
  const end = lines.findIndex((l, i) => i > start && l.startsWith('### '));
  return lines.slice(start + 1, end).join('\n');
}

describe('Prompt IA bilingüe', () => {
  it('ES y EN enseñan exactamente los mismos comandos del DSL (no se traducen)', () => {
    expect(commandsUsed(getAIPrompt('en'))).toEqual(commandsUsed(getAIPrompt('es')));
    expect(commandsUsed(getAIPrompt('es'))).toEqual(DSL_COMMANDS);
  });

  it.each(['es', 'en'] as const)('el prompt %s termina con su marcador para pegar el enunciado', lang => {
    expect(getAIPrompt(lang).trimEnd().endsWith(AI_PROMPT_PLACEHOLDER[lang])).toBe(true);
  });

  it.each(['es', 'en'] as const)('el ejemplo completo del prompt %s compila sin diagnósticos', lang => {
    const result = compileEER(fullExample(getAIPrompt(lang)));
    expect(result.nodes.length).toBeGreaterThan(5);
    expect(result.diagnostics).toEqual([]);
  });
});
