// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

// Punto de entrada de la edición Moodle (moodle.html). La edición completa sigue en src/main.tsx.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LanguageProvider } from '../i18n/LanguageContext';
import { MoodleExamApp } from './MoodleExamApp';
import { readExamConfig } from './examConfig';

const config = readExamConfig();
if (config.title) document.title = config.title;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <MoodleExamApp config={config} />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
