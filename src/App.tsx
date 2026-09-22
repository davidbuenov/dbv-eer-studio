/**
 * EER Studio - Enhanced Entity-Relationship Diagram Editor
 * Copyright (c) 2025-2026 David Bueno Vallejo
 * 
 * Developed with the assistance of Gemini and GitHub Copilot AI
 * 
 * This software is provided as-is, without warranty of any kind.
 */

import EERDiagrammer from './EERDiagramer';
import { LanguageProvider } from './i18n/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh' }}>
        <LanguageProvider>
          <EERDiagrammer />
        </LanguageProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;