import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <Container>
      <Box sx={{ textAlign: 'center', my: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Página não encontrada
        </Typography>
        <Typography variant="body1" paragraph>
          A página que você está procurando não existe ou foi movida.
        </Typography>
        <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>
          Voltar para a página inicial
        </Button>
      </Box>
    </Container>
  );
}

export default NotFound;
