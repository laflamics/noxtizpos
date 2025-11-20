import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ensureProcessPolyfill } from './polyfills/process';
import { NotificationProvider } from './components/NotificationProvider';

ensureProcessPolyfill();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);

