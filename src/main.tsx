import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import RebuildApp from './rebuild/RebuildApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname.startsWith('/rebuild') ? <RebuildApp /> : <App />}
  </StrictMode>
);
