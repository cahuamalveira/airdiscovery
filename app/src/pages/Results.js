import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SchoolIcon from '@mui/icons-material/School';
import TerrainIcon from '@mui/icons-material/Terrain';
import SpaIcon from '@mui/icons-material/Spa';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import { destinations } from '../data/destinations';

// Ícones para cada tipo de perfil
const profileIcons = {
  athletic: <DirectionsRunIcon />,
  intellectual: <SchoolIcon />,
  adventurous: <TerrainIcon />,
  relaxed: <SpaIcon />,
  cultural: <TheaterComedyIcon />
};

// Nomes dos perfis em português
const profileNames = {
  athletic: 'Atlético',
  intellectual: 'Intelectual',
  adventurous: 'Aventureiro',
  relaxed: 'Relaxado',
  cultural: 'Cultural'
};

// Descrições dos perfis
const profileDescriptions = {
  athletic: 'Você gosta de atividades físicas e esportes. Seu roteiro inclui locais para praticar esportes e manter-se ativo durante a viagem.',
  intellectual: 'Você valoriza o conhecimento e a aprendizagem. Seu roteiro inclui museus, bibliotecas e centros culturais para estimular sua mente.',
  adventurous: 'Você busca adrenalina e novas experiências. Seu roteiro inclui atividades de aventura e locais fora do comum.',
  relaxed: 'Você prefere um ritmo mais tranquilo e momentos de descanso. Seu roteiro inclui praias, spas e locais para relaxar.',
  cultural: 'Você aprecia arte, história e tradições locais. Seu roteiro inclui pontos históricos, teatros e experiências culturais autênticas.'
};

function Results() {
  const { destinationId, profileType } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Encontrar o destino selecionado
    const selectedDestination = destinations.find(dest => dest.id === destinationId);
    
    if (selectedDestination && selectedDestination.attractions && selectedDestination.attractions[profileType]) {
      setDestination(selectedDestination);
      setAttractions(selectedDestination.attractions[profileType]);
    } else {
      // Redirecionar para a página de seleção de destino se o destino ou perfil não for encontrado
      navigate('/destinos');
    }
  }, [destinationId, profileType, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveDestination = () => {
    if (!destination) return;
    
    // Salvar destino na lista de desejos
    const savedDestinations = JSON.parse(localStorage.getItem('savedDestinations') || '[]');
    
    // Verificar se o destino já está salvo
    const isAlreadySaved = savedDestinations.some(dest => dest.id === destination.id);
    
    if (!isAlreadySaved) {
      savedDestinations.push({
        id: destination.id,
        name: destination.name,
        image: destination.image,
        description: destination.description
      });
      
      localStorage.setItem('savedDestinations', JSON.stringify(savedDestinations));
      alert('Destino adicionado à lista de desejos!');
    } else {
      alert('Este destino já está na sua lista de desejos.');
    }
  };

  const handleSearchFlights = () => {
    navigate(`/voos?destination=${destinationId}`);
  };

  if (!destination || !attractions) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Carregando...
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Seu Roteiro Personalizado
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 4 }}>
            <CardMedia
              component="img"
              height="300"
              image={destination.image}
              alt={destination.name}
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                {destination.name}
              </Typography>
              <Typography variant="body1" paragraph>
                {destination.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {profileIcons[profileType]}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Seu perfil: {profileNames[profileType]}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {profileDescriptions[profileType]}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleSaveDestination}
                >
                  Salvar na Lista de Desejos
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSearchFlights}
                >
                  Buscar Voos
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          <Typography variant="h5" gutterBottom>
            Atrações Recomendadas
          </Typography>
          
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="attraction tabs"
            >
              <Tab label="Todas" />
              {attractions.map((attraction, index) => (
                <Tab key={index} label={attraction.name} />
              ))}
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 ? (
                <Grid container spacing={3}>
                  {attractions.map((attraction, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={attraction.image}
                          alt={attraction.name}
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h6" component="div">
                            {attraction.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {attraction.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  <CardMedia
                    component="img"
                    height="300"
                    image={attractions[tabValue - 1].image}
                    alt={attractions[tabValue - 1].name}
                    sx={{ mb: 2 }}
                  />
                  <Typography gutterBottom variant="h5" component="div">
                    {attractions[tabValue - 1].name}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {attractions[tabValue - 1].description}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Roteiro Sugerido
            </Typography>
            <List>
              {attractions.map((attraction, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <PlaceIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={attraction.name}
                      secondary={`Dia ${index + 1}`}
                    />
                  </ListItem>
                  {index < attractions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Outras Experiências
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Além das atrações recomendadas para seu perfil, {destination.name} oferece experiências para todos os gostos.
            </Alert>
            <List>
              {Object.keys(profileNames).filter(profile => profile !== profileType).map((profile, index) => (
                <ListItem key={index} button onClick={() => navigate(`/resultados/${destinationId}/${profile}`)}>
                  <ListItemIcon>
                    {profileIcons[profile]}
                  </ListItemIcon>
                  <ListItemText
                    primary={`Roteiro ${profileNames[profile]}`}
                    secondary={`Ver atrações para perfil ${profileNames[profile]}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Results;
