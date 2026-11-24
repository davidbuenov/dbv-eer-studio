// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import { describe, it, expect } from 'vitest';
import { getAIPrompt, AI_PROMPT_PLACEHOLDER } from './aiPrompt';
import { compileEER } from '../utils/compiler';

const DSL_COMMANDS = ['ent', 'weak_ent', 'att', 'key_att', 'partial_key_att', 'derived_att', 'multivalued_att', 'rel', 'ident_rel', 'link', 'spec', 'union'];

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

  // La IA aprende sobre todo del ejemplo: debe usar toda la notación (§3.11), no solo describirla.
  it.each(['es', 'en'] as const)('el ejemplo completo del prompt %s usa toda la notación', lang => {
    const { nodes, links } = compileEER(fullExample(getAIPrompt(lang)));
    const node = (id: string) => nodes.find(n => n.id === id);
    expect(new Set(nodes.map(n => n.type))).toEqual(
      new Set([
        'entity', 'weak_entity', 'relationship', 'identifying_relationship', 'attribute', 'key_attribute',
        'partial_key_attribute', 'derived_attribute', 'multivalued_attribute', 'specialization', 'union',
      ])
    );
    expect(nodes.some(n => n.isUnique)).toBe(true); // clave alternativa
    expect(nodes.some(n => n.isPartial)).toBe(true); // especialización parcial
    expect(nodes.some(n => n.definingAttribute)).toBe(true); // especialización definida por atributo
    expect(links.filter(l => l.role)).toHaveLength(2); // recursiva con roles
    expect(links.some(l => node(l.source)?.type === 'attribute' && node(l.target)?.type === 'attribute')).toBe(true); // compuesto
    const degree = (relId: string) => links.filter(l => l.source === relId || l.target === relId).filter(l => node(l.source === relId ? l.target : l.source)?.type === 'entity').length;
    expect(nodes.filter(n => n.type === 'relationship').some(r => degree(r.id) === 3)).toBe(true); // ternaria
    expect(links.some(l => l.style === 'double')).toBe(true);
  });

  it('el ejemplo ES y el EN tienen la misma estructura (solo cambian los nombres)', () => {
    const shape = (lang: 'es' | 'en') => {
      const { nodes, links } = compileEER(fullExample(getAIPrompt(lang)));
      // La etiqueta es una cardinalidad o, en la arista de una especialización, un nombre (se traduce).
      const label = (l: string | undefined) => (/^(\d+|[NMP])?$/.test(l ?? '') ? l : '<nombre>');
      return { types: nodes.map(n => n.type), links: links.map(l => `${label(l.label)}|${l.style}|${l.role ? 'rol' : ''}`) };
    };
    expect(shape('en')).toEqual(shape('es'));
  });

  it.each(['es', 'en'] as const)('el prompt %s no contiene restos de plantilla', lang => {
    expect(getAIPrompt(lang)).not.toMatch(/\$nl|\$\{/);
  });
});
