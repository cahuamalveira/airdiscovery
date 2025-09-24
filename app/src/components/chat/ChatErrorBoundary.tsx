import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Container,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              textAlign: 'center',
              gap: 3,
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                maxWidth: 500,
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                }}
              />
              
              <Typography variant="h5" color="error" gutterBottom>
                Oops! Algo deu errado
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                Ocorreu um erro inesperado no chat. Nossa equipe foi notificada e está trabalhando para resolver o problema.
              </Typography>

              <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>Erro:</strong> {this.state.error?.message || 'Erro desconhecido'}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Tentar Novamente
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/destinations'}
                >
                  Voltar ao Início
                </Button>
              </Box>
            </Paper>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  maxWidth: '100%',
                  overflow: 'auto',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Detalhes do Erro (Desenvolvimento)
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Paper>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}