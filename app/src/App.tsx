import React from 'react';
import { Amplify } from 'aws-amplify';
import amplifyConfig from './config/amplify';
Amplify.configure(amplifyConfig);

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '@aws-amplify/ui-react/styles.css';

// Contextos
import { AuthProvider } from './contexts/AuthContext';

// Componentes
import Layout from './components/Layout';

// Páginas
import Home from './pages/Home';
import DestinationSelection from './pages/DestinationSelection';
import RecommendationsPage from './pages/RecommendationsPage';
import ProfileQuestions from './pages/ProfileQuestions';
import Results from './pages/Results';
import FlightSearch from './pages/FlightSearch';
import FlightPurchase from './pages/FlightPurchase';
import Wishlist from './pages/Wishlist';
import ChatPage from './pages/SimpleChatPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import CustomAuthenticator from './components/CustomAuthenticator';
import ChatPageV2WithErrorBoundary from './pages/ChatPageV2';

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

// Configurar QueryClient com configurações otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
      retry: (failureCount, error) => {
        // Não tentar novamente para erros 4xx
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    if (isHomePage) {
        return (
            <Routes>
                <Route path="/" element={<Layout isAuthenticated={false} user={null} logout={() => { }} />}>
                    <Route index element={<Home />} />
                </Route>
            </Routes>
        );
    }

    return (
        <CustomAuthenticator>
            {({ signOut, user }) => (
                <AuthProvider signOut={signOut} user={user}>
                    <Routes>
                        <Route path="/" element={<Layout isAuthenticated={!!user} user={user} logout={signOut} />}>
                            <Route path="destinos" element={<DestinationSelection />} />
                            <Route path="recomendacoes" element={<RecommendationsPage />} />
                            <Route path="destinos/:destinationId/perguntas" element={<ProfileQuestions />} />
                            <Route path="resultados/:destinationId/:profileType" element={<Results />} />
                            <Route path="voos" element={<FlightSearch />} />
                            <Route path="voos/selecionar/:flightId/:date" element={<FlightPurchase />} />
                            <Route path="wishlist" element={<Wishlist />} />
                            <Route path="chat" element={<ChatPageV2WithErrorBoundary />} />
                            <Route path="admin" element={<AdminDashboard />} />
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
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                    <BrowserRouter>
                        <AppContent />
                    </BrowserRouter>
                </LocalizationProvider>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default App;
