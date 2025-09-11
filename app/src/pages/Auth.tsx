import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useAuthUI } from '../hooks/useAuthUI';
import {
  signInSchema,
  signUpSchema,
  confirmationSchema,
  SignInFormData,
  SignUpFormData,
  ConfirmationFormData,
} from '../schemas/authSchemas';

/**
 * Componente de autenticação refatorado
 * 
 * Features:
 * - Gerenciamento de estado centralizado com react-hook-form
 * - Validação robusta com Zod
 * - Estado de UI gerenciado por hook personalizado
 * - Acessibilidade completa (ARIA, labels, etc.)
 * - Tipagem completa em TypeScript
 * - Tratamento de erros específicos do Cognito
 */
function Auth() {
  const navigate = useNavigate();
  const { login, signUp, confirmSignUp, resendConfirmationCode, isAuthenticated, loading } = useAuth();
  const {
    uiState,
    startLoading,
    showError,
    showSuccess,
    transitionTo,
    handleConfirmationRequired,
  } = useAuthUI();

  // Configuração dos formulários com react-hook-form e validação Zod
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const confirmationForm = useForm<ConfirmationFormData>({
    resolver: zodResolver(confirmationSchema),
    mode: 'onBlur',
    defaultValues: {
      confirmationCode: '',
    },
  });

  // Handler para login
  const handleSignIn: SubmitHandler<SignInFormData> = async (data) => {
    startLoading();

    try {
      await login({ email: data.email, password: data.password });
      showSuccess('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Tratamento específico para usuário não confirmado
      if (error.name === 'UserNotConfirmedException') {
        handleConfirmationRequired(data.email);
        return;
      }
      
      showError(error);
    }
  };

  // Handler para cadastro
  const handleSignUp: SubmitHandler<SignUpFormData> = async (data) => {
    startLoading();

    try {
      await signUp({ 
        email: data.email, 
        password: data.password, 
        name: data.name 
      });
      
      transitionTo('confirmSignUp', data.email);
      showSuccess('Conta criada! Verifique seu email para o código de confirmação.');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      showError(error);
    }
  };

  // Handler para confirmação de código
  const handleConfirmSignUp: SubmitHandler<ConfirmationFormData> = async (data) => {
    startLoading();

    try {
      await confirmSignUp(uiState.pendingEmail, data.confirmationCode);
      
      transitionTo('signIn');
      showSuccess('Email confirmado! Você pode fazer login agora.');
      confirmationForm.reset();
    } catch (error: any) {
      console.error('Erro na confirmação:', error);
      showError(error);
    }
  };

  // Handler para reenvio de código
  const handleResendCode = async () => {
    if (!uiState.pendingEmail) return;

    startLoading();

    try {
      await resendConfirmationCode(uiState.pendingEmail);
      showSuccess('Código de confirmação reenviado!');
    } catch (error: any) {
      console.error('Erro ao reenviar código:', error);
      showError(error);
    }
  };

  // Handler para mudança de abas
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const newState = newValue === 0 ? 'signIn' : 'signUp';
    transitionTo(newState);
    
    // Reset dos formulários ao trocar de aba
    signInForm.reset();
    signUpForm.reset();
  };


    // Se ainda está carregando, mostrar indicador
  if (loading) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verificando autenticação...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          AIR Discovery
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          Descubra seu destino ideal
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        {uiState.currentState !== 'confirmSignUp' && (
          <Tabs
            value={uiState.currentState === 'signIn' ? 0 : 1}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            aria-label="auth tabs"
          >
            <Tab label="Entrar" id="signin-tab" aria-controls="signin-panel" />
            <Tab label="Cadastrar" id="signup-tab" aria-controls="signup-panel" />
          </Tabs>
        )}

        <Box sx={{ mt: 3 }}>
          {uiState.error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert" aria-live="polite">
              {uiState.error}
            </Alert>
          )}
          
          {uiState.success && (
            <Alert severity="success" sx={{ mb: 2 }} role="alert" aria-live="polite">
              {uiState.success}
            </Alert>
          )}

          {uiState.currentState === 'confirmSignUp' ? (
            <form onSubmit={confirmationForm.handleSubmit(handleConfirmSignUp)}>
              <Typography variant="h6" gutterBottom>
                Confirmar Email
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Digite o código de confirmação enviado para {uiState.pendingEmail}
              </Typography>
              
              <TextField
                {...confirmationForm.register('confirmationCode')}
                label="Código de Confirmação"
                fullWidth
                margin="normal"
                required
                autoFocus
                error={!!confirmationForm.formState.errors.confirmationCode}
                helperText={confirmationForm.formState.errors.confirmationCode?.message}
                aria-invalid={!!confirmationForm.formState.errors.confirmationCode}
                disabled={uiState.isLoading}
              />

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={uiState.isLoading || !confirmationForm.formState.isValid}
                  sx={{ flex: 1 }}
                  aria-describedby={uiState.error ? 'error-message' : undefined}
                >
                  {uiState.isLoading ? (
                    <CircularProgress size={24} aria-label="Confirmando..." />
                  ) : (
                    'Confirmar'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleResendCode}
                  disabled={uiState.isLoading}
                  sx={{ flex: 1 }}
                >
                  {uiState.isLoading ? (
                    <CircularProgress size={24} aria-label="Reenviando..." />
                  ) : (
                    'Reenviar Código'
                  )}
                </Button>
              </Box>
            </form>
          ) : uiState.currentState === 'signIn' ? (
            <div role="tabpanel" id="signin-panel" aria-labelledby="signin-tab">
              <form onSubmit={signInForm.handleSubmit(handleSignIn)}>
                <TextField
                  {...signInForm.register('email')}
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="email"
                  error={!!signInForm.formState.errors.email}
                  helperText={signInForm.formState.errors.email?.message}
                  aria-invalid={!!signInForm.formState.errors.email}
                  disabled={uiState.isLoading}
                />
                <TextField
                  {...signInForm.register('password')}
                  label="Senha"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="current-password"
                  error={!!signInForm.formState.errors.password}
                  helperText={signInForm.formState.errors.password?.message}
                  aria-invalid={!!signInForm.formState.errors.password}
                  disabled={uiState.isLoading}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={uiState.isLoading || !signInForm.formState.isValid}
                  sx={{ mt: 3 }}
                  aria-describedby={uiState.error ? 'error-message' : undefined}
                >
                  {uiState.isLoading ? (
                    <CircularProgress size={24} aria-label="Entrando..." />
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div role="tabpanel" id="signup-panel" aria-labelledby="signup-tab">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)}>
                <TextField
                  {...signUpForm.register('name')}
                  label="Nome"
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="name"
                  error={!!signUpForm.formState.errors.name}
                  helperText={signUpForm.formState.errors.name?.message}
                  aria-invalid={!!signUpForm.formState.errors.name}
                  disabled={uiState.isLoading}
                />
                <TextField
                  {...signUpForm.register('email')}
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="email"
                  error={!!signUpForm.formState.errors.email}
                  helperText={signUpForm.formState.errors.email?.message}
                  aria-invalid={!!signUpForm.formState.errors.email}
                  disabled={uiState.isLoading}
                />
                <TextField
                  {...signUpForm.register('password')}
                  label="Senha"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="new-password"
                  error={!!signUpForm.formState.errors.password}
                  helperText={
                    signUpForm.formState.errors.password?.message ||
                    'Mínimo 8 caracteres com letras maiúsculas, minúsculas, números e símbolos'
                  }
                  aria-invalid={!!signUpForm.formState.errors.password}
                  disabled={uiState.isLoading}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={uiState.isLoading || !signUpForm.formState.isValid}
                  sx={{ mt: 3 }}
                  aria-describedby={uiState.error ? 'error-message' : undefined}
                >
                  {uiState.isLoading ? (
                    <CircularProgress size={24} aria-label="Cadastrando..." />
                  ) : (
                    'Cadastrar'
                  )}
                </Button>
              </form>
            </div>
          )}
        </Box>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardMedia
            component="img"
            height="200"
            image="https://images.unsplash.com/photo-1488085061387-422e29b40080"
            alt="Viagem"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Descubra o mundo com AIR Discovery
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Faça login ou cadastre-se para acessar roteiros personalizados, salvar destinos favoritos e receber recomendações exclusivas para suas viagens.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Auth;
