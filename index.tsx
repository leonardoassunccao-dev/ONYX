import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { logDiagnostic } from './utils/error';

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logDiagnostic('Unhandled Promise Rejection', event.reason);
});

// Global error handling for general runtime errors
window.addEventListener('error', (event) => {
  logDiagnostic('Runtime Error', event.error || event.message);
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
      .then(reg => console.log("SW registered", reg))
      .catch(err => console.log("SW failed", err));
  });
}