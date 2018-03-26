import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppContent from '../view/AppContent';
import { createMuiTheme } from 'material-ui/styles';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#5e92f3',
      main: '#1565c0',
      dark: '#003c8f',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ffc947',
      main: '#ff9800',
      dark: '#c66900',
      contrastText: '#000',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 500,
      md: 650,
      lg: 1280,
      xl: 1920,
    }
  },
  mixins: {
    toolbar: {
      '@media (min-width:600px)' : {
        minHeight: 48,
      },
    }
  }
});

const App = () => (
  <MuiThemeProvider theme={theme}>
    <AppContent />
  </MuiThemeProvider>
);

ReactDOM.render(
  <App />,
  document.getElementById('app')
);