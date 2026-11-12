import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cleanup transient or oversized event keys to ensure clean quota on load
try {
  localStorage.removeItem('whisperwave-signal-event');
} catch {
  // Ignore
}

createRoot(document.getElementById('root')!).render(<App />);
