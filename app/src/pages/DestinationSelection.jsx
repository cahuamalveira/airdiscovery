import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  Paper
} from '@mui/material';
import { destinations } from '../data/destinations';

function DestinationSelection() {
  const navigate = useNavigate();
  const [allDestinations, setAllDestinations] = useState([]);

  useEffect(() => {
    // Carregar todos os destinos disponíveis
    setAllDestinations(destinations);
  }, []);

  const handleDestinationSelect = (destinationId) => {
    // Navegar para a página de perguntas de perfil com o destino selecionado
    navigate(`/destinos/${destinationId}/perguntas`);
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Escolha seu Destino
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Selecione um destino para começar a personalizar sua experiência de viagem
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {allDestinations.map((destination) => (
          <Grid item xs={12} sm={6} md={4} key={destination.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleDestinationSelect(destination.id)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={destination.image}
                  alt={destination.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {destination.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {destination.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Como funciona?
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center', flex: '1 1 0', minWidth: '200px', p: 2 }}>
            <Typography variant="h6" color="primary">1</Typography>
            <Typography variant="body1">Escolha seu destino</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: '1 1 0', minWidth: '200px', p: 2 }}>
            <Typography variant="h6" color="primary">2</Typography>
            <Typography variant="body1">Responda algumas perguntas sobre suas preferências</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: '1 1 0', minWidth: '200px', p: 2 }}>
            <Typography variant="h6" color="primary">3</Typography>
            <Typography variant="body1">Receba um roteiro personalizado baseado no seu perfil</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: '1 1 0', minWidth: '200px', p: 2 }}>
            <Typography variant="h6" color="primary">4</Typography>
            <Typography variant="body1">Encontre voos e planeje sua viagem</Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default DestinationSelection;
