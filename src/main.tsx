import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RebuildApp from './rebuild/RebuildApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RebuildApp />
  </StrictMode>
);
