import React from 'react';
import { createRoot } from 'react-dom/client'; // Gunakan named import
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Langsung gunakan createRoot yang sudah diimport
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);