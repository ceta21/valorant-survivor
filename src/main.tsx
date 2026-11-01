import { createRoot } from 'react-dom/client';
import App from './App';
// escucha cuanto antes si el navegador permite instalar el juego como app (botón «Descargar»)
import './utils/install';
import { startPadNav } from './utils/gamepad';
// fuentes servidas desde la propia web: así no se envía nada a Google al abrir el juego
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/press-start-2p/400.css';
import './styles/index.css';

// mando: moverse por los menús con la cruceta, A para pulsar y B para volver
startPadNav();

createRoot(document.getElementById('root')!).render(<App />);
