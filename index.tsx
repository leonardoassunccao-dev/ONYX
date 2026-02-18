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
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      // Explicitly construct URL using current origin to verify scope matches
      const swUrl = new URL('/service-worker.js', window.location.origin).href;
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log("Service Worker registered:", registration.scope);
    } catch (error) {
      // Log error but do not crash application flow
      console.warn("Service Worker registration failed:", error);
    }
  }
};

// Execute registration logic based on document state
if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener("load", registerServiceWorker);
}