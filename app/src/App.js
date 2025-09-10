import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';

// Contextos
import { AuthProvider } from './contexts/AuthContext';

// Componentes
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';

// Páginas
import Home from './pages/Home';
import DestinationSelection from './pages/DestinationSelection';
import ProfileQuestions from './pages/ProfileQuestions';
import Results from './pages/Results';
import FlightSearch from './pages/FlightSearch';
import FlightPurchase from './pages/FlightPurchase';
import Auth from './pages/Auth';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="destinos" element={<DestinationSelection />} />
                <Route path="destinos/:destinationId/perguntas" element={<ProfileQuestions />} />
                <Route path="resultados/:destinationId/:profileType" element={<Results />} />
                <Route path="voos" element={<FlightSearch />} />
                <Route path="voos/selecionar/:flightId/:date" element={
                  <AuthGuard>
                    <FlightPurchase />
                  </AuthGuard>
                } />
                <Route path="auth" element={<Auth />} />
                <Route path="wishlist" element={
                  <AuthGuard>
                    <Wishlist />
                  </AuthGuard>
                } />
                <Route path="admin" element={
                  <AuthGuard>
                    <AdminDashboard />
                  </AuthGuard>
                } />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
