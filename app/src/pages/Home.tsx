import React from 'react';
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
  Paper
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import ExploreIcon from '@mui/icons-material/Explore';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          AIR Discovery
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Descubra seu destino ideal baseado no seu perfil
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          onClick={() => navigate('/chat')}
          startIcon={<ExploreIcon />}
          sx={{ mt: 2, mb: 6 }}
        >
          Começar Agora
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardMedia
              component="img"
              height="240"
              image="https://images.unsplash.com/photo-1488085061387-422e29b40080"
              alt="Destinos turísticos"
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Destinos Personalizados
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Responda algumas perguntas simples e descubra roteiros turísticos personalizados que combinam com seu perfil e preferências.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/destinos')}
              >
                Explorar Destinos
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardMedia
              component="img"
              height="240"
              image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05"
              alt="Passagens aéreas"
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Passagens Aéreas
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Encontre as melhores ofertas de passagens aéreas para seu destino escolhido, com opções de voos saindo de diversas cidades brasileiras.
              </Typography>
              <Button 
                variant="outlined"
                onClick={() => navigate('/voos')}
                startIcon={<FlightTakeoffIcon />}
              >
                Buscar Voos
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 6, p: 4, bgcolor: 'primary.light', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          Como Funciona
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                1. Escolha seu Destino
              </Typography>
              <Typography variant="body1">
                Selecione entre diversos destinos turísticos disponíveis no Brasil.
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                2. Responda ao Questionário
              </Typography>
              <Typography variant="body1">
                Responda perguntas simples para identificarmos seu perfil de viajante.
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                3. Receba Recomendações
              </Typography>
              <Typography variant="body1">
                Obtenha roteiros personalizados baseados no seu perfil e destino escolhido.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Home;
