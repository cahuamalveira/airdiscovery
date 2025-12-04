import React from 'react';
import { Amplify } from 'aws-amplify';
import amplifyConfig from './config/amplify';
Amplify.configure(amplifyConfig);

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
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

// Páginas - Lazy loading para melhor performance
import Home from './pages/Home';
import CustomAuthenticator from './components/CustomAuthenticator';

// Lazy load páginas autenticadas
const RecommendationsPage = React.lazy(() => import('./pages/RecommendationsPage'));
//const Results = React.lazy(() => import('./pages/Results'));
//const FlightSearch = React.lazy(() => import('./pages/FlightSearch'));
//const FlightPurchase = React.lazy(() => import('./pages/FlightPurchase'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const ConfirmationPage = React.lazy(() => import('./pages/ConfirmationPage'));
//const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const BookingHistoryPage = React.lazy(() => import('./pages/BookingHistoryPage'));
const BookingDetailPage = React.lazy(() => import('./pages/BookingDetailPage'));
const ChatSessionManager = React.lazy(() => import('./pages/ChatSessionManager'));
const ChatPageV2WithErrorBoundary = React.lazy(() => import('./pages/ChatPageV2'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Configurar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
            staleTime: 1 * 60 * 1000, // 1 minuto - dados considerados frescos
            gcTime: 10 * 60 * 1000, // 10 minutos - tempo de cache (antes era cacheTime)
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
            // Stale-while-revalidate: mostra dados em cache enquanto busca novos
            refetchOnMount: 'always',
            // Mantém dados anteriores enquanto busca novos
            placeholderData: (previousData: unknown) => previousData,
        },
    },
});

// Loading fallback component
const LoadingFallback: React.FC = () => (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
    >
        <CircularProgress />
    </Box>
);

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
                    <React.Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<Layout isAuthenticated={!!user} user={user} logout={signOut} />}>
                                <Route path="recomendacoes/:origin/:destination" element={<RecommendationsPage />} />
                                <Route path="checkout/:flightId" element={<CheckoutPage />} />
                                <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
                                <Route path="minhas-reservas" element={<BookingHistoryPage />} />
                                <Route path="minhas-reservas/:bookingId" element={<BookingDetailPage />} />
                                <Route path="chat" element={<ChatSessionManager />} />
                                <Route path="chat/session/:sessionId" element={<ChatPageV2WithErrorBoundary />} />
                                <Route path="admin" element={<AdminDashboard />} />
                                <Route path="*" element={<NotFound />} />
                            </Route>
                        </Routes>
                    </React.Suspense>
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
                        <Elements stripe={stripePromise}>
                            <AppContent />
                        </Elements>
                    </BrowserRouter>
                </LocalizationProvider>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default App;
