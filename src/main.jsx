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
  <MantineProvider theme={theme} defaultColorScheme="light">
    <Notifications />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MantineProvider>
);