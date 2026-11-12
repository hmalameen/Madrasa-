import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initSecureServiceWorker} from './components/PWAInstallManager';

initSecureServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);

