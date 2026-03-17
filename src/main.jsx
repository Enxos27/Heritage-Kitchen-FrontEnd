import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';

// IMPORTANTE: I CSS devono essere caricati prima di App
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

const theme = createTheme({
  primaryColor: 'orange',
});

const rootElement = document.getElementById('root');

ReactDOM.createRoot(rootElement).render(
  // MantineProvider è il provider del tema di Mantine che avvolge tutta l'applicazione, permettendoci di accedere al tema e alle funzionalità di Mantine in qualsiasi componente. Qui passiamo il tema personalizzato e impostiamo il colore primario su arancione, oltre a specificare che il tema di default è chiaro (light).
  <MantineProvider theme={theme} defaultColorScheme="light">
      {/* Notifications è il componente che gestisce le notifiche di Mantine. Deve essere posizionato all'interno del provider per funzionare correttamente. Qui lo mettiamo all'inizio dell'app per assicurarci che sia sempre disponibile per mostrare notifiche in qualsiasi pagina o componente. */}
    <Notifications />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MantineProvider>
);