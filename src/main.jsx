import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { VaultProvider } from './context/VaultContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { AIProvider } from './context/AIContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <UIProvider>
          <VaultProvider>
            <AIProvider>
              <App />
            </AIProvider>
          </VaultProvider>
        </UIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);