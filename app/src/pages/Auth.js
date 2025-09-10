import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Tabs,
  Tab,
  Paper,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Simular login (em um sistema real, isso seria uma chamada à API)
    login({ email, name: email.split('@')[0], isAdmin });
    navigate('/');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Simular registro (em um sistema real, isso seria uma chamada à API)
    login({ email, name, isAdmin });
    navigate('/');
  };

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
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="auth tabs"
        >
          <Tab label="Entrar" />
          <Tab label="Cadastrar" />
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {tabValue === 0 ? (
            <form onSubmit={handleLogin}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Senha"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    color="primary"
                  />
                }
                label="Entrar como administrador"
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
              >
                Entrar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <TextField
                label="Nome"
                fullWidth
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Senha"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    color="primary"
                  />
                }
                label="Registrar como administrador"
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
              >
                Cadastrar
              </Button>
            </form>
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
