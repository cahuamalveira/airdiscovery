import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import amplifyConfig from './config/amplify';
Amplify.configure(amplifyConfig);

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import '@aws-amplify/ui-react/styles.css';

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
import CustomAuthenticator from './components/CustomAuthenticator';
import { AuthUser } from 'aws-amplify/auth';

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

const AppContent: React.FC = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    // Render home page without authentication
    if (isHomePage) {
        return (
            <Routes>
                <Route path="/" element={<Layout isAuthenticated={false} user={null} logout={() => { }} />}>
                    <Route index element={<Home />} />
                </Route>
            </Routes>
        );
    }

    // Render protected routes with authentication
    return (
        <CustomAuthenticator>
            {({ signOut, user }) => (
                <AuthProvider signOut={signOut} user={user}>
                    <Routes>
                        <Route path="/" element={<Layout isAuthenticated={!!user} user={user} logout={signOut} />}>
                            <Route path="destinos" element={<DestinationSelection />} />
                            <Route path="destinos/:destinationId/perguntas" element={<ProfileQuestions />} />
                            <Route path="resultados/:destinationId/:profileType" element={<Results />} />
                            <Route path="voos" element={<FlightSearch />} />
                            <Route path="voos/selecionar/:flightId/:date" element={<FlightPurchase />} />
                            <Route path="wishlist" element={<Wishlist />} />
                            <Route path="admin" element={<AdminDashboard />} />
                            <Route path="auth" element={<Auth />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Routes>
                </AuthProvider>
            )}
        </CustomAuthenticator>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </LocalizationProvider>
        </ThemeProvider>
    );
};

export default App;
