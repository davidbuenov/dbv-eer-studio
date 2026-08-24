// =============================================================================
// eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

import type { RelationalSchema } from '../../types/relational';
import { CARD_WIDTH, HEADER_HEIGHT, ROW_HEIGHT, FOOTER_HEIGHT, getTableHeight, computeFKEdges } from './relationalGeometry';
import { RELATIONAL_COLORS as C } from './relationalColors';
import { translateStepTitle } from '../../i18n/steps';
import type { Language } from '../../i18n/language';
import { translate } from '../../i18n/translate';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera un SVG completo y autocontenido del Modelo Relacional actual, reconstruyendo
 * manualmente las tarjetas (que en pantalla son HTML, no SVG) con `<rect>`/`<text>`, y
 * reutilizando la misma geometría (`relationalGeometry.ts`) que `RelationalViewer.tsx`
 * para que el resultado exportado coincida con la vista en pantalla.
 */
export function exportRelationalToSVG(schema: RelationalSchema, lang: Language = 'es'): string {
  if (schema.tables.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="${C.canvasBg}" /></svg>`;
  }

  const maxX = Math.max(...schema.tables.map(table => table.x + CARD_WIDTH)) + 80;
  const maxY = Math.max(...schema.tables.map(table => table.y + getTableHeight(table))) + 80;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}" font-family="ui-sans-serif, system-ui, sans-serif">`);
  parts.push(`<rect x="0" y="0" width="${maxX}" height="${maxY}" fill="${C.canvasBg}" />`);
  parts.push(
    `<defs>` +
      `<marker id="fk-arrow-dashed-export" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="${C.arrowRegular}" /></marker>` +
      `<marker id="fk-arrow-solid-export" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="${C.arrowIdentifying}" /></marker>` +
      `</defs>`
  );

  // Flechas de Integridad Referencial. El trazado lo calcula `computeFKEdges`, la misma
  // función que usa la vista en pantalla; aquí solo se le pone estilo y se serializa.
  computeFKEdges(schema).forEach(edge => {
    const lineColor = edge.isIdentifying ? C.arrowIdentifying : C.arrowRegular;
    const markerId = edge.isIdentifying ? 'url(#fk-arrow-solid-export)' : 'url(#fk-arrow-dashed-export)';
    const dashAttr = edge.isIdentifying ? '' : ' stroke-dasharray="6,4"';
    const rectX = -edge.textWidth / 2;

    parts.push(
      `<g>` +
        `<path d="${edge.pathData}" fill="none" stroke="${C.arrowHalo}" stroke-width="4" stroke-opacity="0.25" />` +
        `<path d="${edge.pathData}" fill="none" stroke="${lineColor}" stroke-width="2"${dashAttr} marker-end="${markerId}" />` +
        `<circle cx="${edge.sourceAnchor.x}" cy="${edge.sourceAnchor.y}" r="3" fill="${lineColor}" />` +
        `<circle cx="${edge.targetAnchor.x}" cy="${edge.targetAnchor.y}" r="3" fill="${lineColor}" />` +
        `<g transform="translate(${edge.midX}, ${edge.midY})">` +
        `<rect x="${rectX}" y="-12" width="${edge.textWidth}" height="24" rx="12" fill="${C.labelBg}" stroke="${lineColor}" stroke-width="1.5" />` +
        `<text x="0" y="4" text-anchor="middle" fill="${lineColor}" font-size="9.5" font-weight="bold" font-family="ui-monospace, Menlo, monospace">${escapeXml(edge.labelText)}</text>` +
        `</g>` +
        `</g>`
    );
  });

  // Tarjetas de Tablas (reconstruidas manualmente: HTML en pantalla, SVG puro aquí)
  schema.tables.forEach(table => {
    const height = getTableHeight(table);
    const stepTitle = translateStepTitle(lang, table.stepTrace.stepKey, table.stepTrace.params);
    const stepLabel = translate(lang, 'common.step', { n: table.stepTrace.stepNumber });

    parts.push(`<g transform="translate(${table.x}, ${table.y})">`);
    parts.push(`<rect x="0" y="0" width="${CARD_WIDTH}" height="${height}" rx="12" fill="${C.cardBg}" stroke="${C.cardBorder}" stroke-width="1" />`);

    // Cabecera
    parts.push(`<path d="M 0 12 A 12 12 0 0 1 12 0 L ${CARD_WIDTH - 12} 0 A 12 12 0 0 1 ${CARD_WIDTH} 12 L ${CARD_WIDTH} ${HEADER_HEIGHT} L 0 ${HEADER_HEIGHT} Z" fill="${C.headerBg}" />`);
    parts.push(`<line x1="0" y1="${HEADER_HEIGHT}" x2="${CARD_WIDTH}" y2="${HEADER_HEIGHT}" stroke="${C.headerBorder}" stroke-width="1" />`);
    parts.push(`<text x="16" y="${HEADER_HEIGHT / 2 + 4}" fill="${C.tableName}" font-size="12" font-weight="bold" letter-spacing="0.5">${escapeXml(table.name)}</text>`);

    // Columnas
    table.columns.forEach((col, index) => {
      const rowY = HEADER_HEIGHT + index * ROW_HEIGHT;
      if (index > 0) {
        parts.push(`<line x1="0" y1="${rowY}" x2="${CARD_WIDTH}" y2="${rowY}" stroke="${C.rowDivider}" stroke-width="1" />`);
      }
      const nameColor = col.isPrimaryKey ? C.pkText : col.isForeignKey ? C.fkText : C.regularText;
      const underlineAttr = col.isPrimaryKey ? ' text-decoration="underline"' : '';
      parts.push(
        `<text x="30" y="${rowY + ROW_HEIGHT / 2 + 4}" fill="${nameColor}" font-size="11" font-weight="${col.isPrimaryKey ? 'bold' : '500'}"${underlineAttr} font-family="ui-monospace, Menlo, monospace">${escapeXml(col.name)}</text>`
      );

      const typeText = col.dataType;
      const typeWidth = Math.max(34, Math.round(typeText.length * 6 + 12));
      const typeX = CARD_WIDTH - typeWidth - 12;
      parts.push(`<rect x="${typeX}" y="${rowY + ROW_HEIGHT / 2 - 9}" width="${typeWidth}" height="18" rx="3" fill="${C.dataTypeBg}" />`);
      parts.push(
        `<text x="${typeX + typeWidth / 2}" y="${rowY + ROW_HEIGHT / 2 + 4}" fill="${C.dataTypeText}" font-size="9" text-anchor="middle" font-family="ui-monospace, Menlo, monospace">${escapeXml(typeText)}</text>`
      );
    });

    // Pie con indicador de Regla del Algoritmo
    const footerY = HEADER_HEIGHT + table.columns.length * ROW_HEIGHT;
    parts.push(`<line x1="0" y1="${footerY}" x2="${CARD_WIDTH}" y2="${footerY}" stroke="${C.rowDivider}" stroke-width="1" />`);
    parts.push(`<path d="M 0 ${footerY} L ${CARD_WIDTH} ${footerY} L ${CARD_WIDTH} ${footerY + FOOTER_HEIGHT - 12} A 12 12 0 0 1 ${CARD_WIDTH - 12} ${footerY + FOOTER_HEIGHT} L 12 ${footerY + FOOTER_HEIGHT} A 12 12 0 0 1 0 ${footerY + FOOTER_HEIGHT - 12} Z" fill="${C.footerBg}" />`);
    parts.push(`<text x="12" y="${footerY + FOOTER_HEIGHT / 2 + 3}" fill="${C.footerText}" font-size="9">${escapeXml(stepTitle)}</text>`);
    parts.push(
      `<text x="${CARD_WIDTH - 12}" y="${footerY + FOOTER_HEIGHT / 2 + 3}" fill="${C.footerStep}" font-size="9" text-anchor="end" font-family="ui-monospace, Menlo, monospace">${escapeXml(stepLabel)}</text>`
    );

    parts.push(`</g>`);
  });

  parts.push(`</svg>`);
  return parts.join('\n');
}
