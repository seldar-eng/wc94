import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const initializeReactApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Fatal Error: Root element with id 'root' not found. Ensure it exists in your HTML.");
    // Fallback: try to append a new root to body if possible, or throw
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    // Re-check, though this is a last resort.
    const fallbackRootElement = document.getElementById('root');
    if(!fallbackRootElement) {
        throw new Error("Could not find or create root element to mount to");
    }
     const root = ReactDOM.createRoot(fallbackRootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    return;
  }

  // Standard React 18+ root creation
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReactApp);
} else {
  // DOMContentLoaded has already fired or document is interactive/complete
  initializeReactApp();
}