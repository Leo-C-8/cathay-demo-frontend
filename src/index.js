import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// React 18 的標準入口點
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);