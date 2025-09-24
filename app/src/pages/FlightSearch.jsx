import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import { format, addDays, addYears, isWithinInterval, parseISO } from 'date-fns';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import { useAuth } from '../contexts/AuthContext';
import { destinations } from '../data/destinations';

// Função para gerar datas disponíveis para voos (todas as datas no próximo ano)
const generateAvailableDates = () => {
  const dates = [];
  const today = new Date();
  const oneYearLater = addYears(today, 1);
  
  let currentDate = today;
  while (currentDate <= oneYearLater) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

// Gerar voos estáticos para todas as cidades
const generateStaticFlights = () => {
  const flights = [];
  const origins = [
    { code: 'GRU', name: 'São Paulo' },
    { code: 'SDU', name: 'Rio de Janeiro' },
    { code: 'BSB', name: 'Brasília' },
    { code: 'POA', name: 'Porto Alegre' },
    { code: 'CWB', name: 'Curitiba' },
    { code: 'REC', name: 'Recife' },
    { code: 'SSA', name: 'Salvador' },
    { code: 'FLN', name: 'Florianópolis' },
    { code: 'IGU', name: 'Foz do Iguaçu' },
    { code: 'BEL', name: 'Belém' },
    { code: 'MAO', name: 'Manaus' },
    { code: 'FOR', name: 'Fortaleza' }
  ];
  
  const destinationCodes = {
    'rio': 'GIG',
    'saopaulo': 'GRU',
    'salvador': 'SSA',
    'florianopolis': 'FLN',
    'fozdoiguacu': 'IGU'
  };
  
  const destinationNames = {
    'rio': 'Rio de Janeiro',
    'saopaulo': 'São Paulo',
    'salvador': 'Salvador',
    'florianopolis': 'Florianópolis',
    'fozdoiguacu': 'Foz do Iguaçu'
  };
  
  const airlines = [
    { code: 'LA', name: 'LATAM Airlines', logo: 'https://images.unsplash.com/photo-1540339832862-474599807836' },
    { code: 'G3', name: 'GOL Linhas Aéreas', logo: 'https://images.unsplash.com/photo-1540339832862-474599807836' },
    { code: 'AD', name: 'Azul Linhas Aéreas', logo: 'https://images.unsplash.com/photo-1540339832862-474599807836' },
    { code: 'JJ', name: 'TAM Airlines', logo: 'https://images.unsplash.com/photo-1540339832862-474599807836' }
  ];
  
  const departureTimes = ['07:00', '09:30', '12:15', '15:45', '18:20', '21:00'];
  const arrivalTimes = ['08:30', '11:00', '13:45', '17:15', '19:50', '22:30'];
  const durations = ['1h30m', '2h15m', '1h45m', '2h30m', '3h00m', '1h50m'];
  const classes = ['Econômica', 'Premium Economy', 'Executiva', 'Primeira Classe'];
  
  let id = 1;
  
  // Para cada origem
  origins.forEach(origin => {
    // Para cada destino
    Object.keys(destinationCodes).forEach(destId => {
      // Não criar voos da cidade para ela mesma
      if ((origin.code === destinationCodes[destId]) || 
          (origin.name === destinationNames[destId])) {
        return;
      }
      
      // Para cada companhia aérea
      airlines.forEach(airline => {
        // Para cada horário
        for (let i = 0; i < departureTimes.length; i++) {
          // Para cada classe
          classes.forEach(flightClass => {
            // Criar voo estático
            flights.push({
              id: `flight-${id++}`,
              originCode: origin.code,
              originName: origin.name,
              destinationCode: destinationCodes[destId],
              destinationName: destinationNames[destId],
              destinationId: destId,
              airlineCode: airline.code,
              airlineName: airline.name,
              airlineLogo: airline.logo,
              departureTime: departureTimes[i],
              arrivalTime: arrivalTimes[i],
              duration: durations[i],
              class: flightClass,
              basePrice: 500, // Preço fixo de R$500 para todos os voos
              availableDates: generateAvailableDates() // Todas as datas no próximo ano
            });
          });
        }
      });
    });
  });
  
  return flights;
};

// Gerar voos estáticos
const staticFlights = generateStaticFlights();

// Função para buscar voos com base nos critérios
const searchFlights = (origin, destination, date) => {
  // Filtrar voos com base nos critérios
  return staticFlights.filter(flight => {
    // Verificar origem
    const originMatch = !origin || 
                        flight.originCode.toLowerCase() === origin.toLowerCase() || 
                        flight.originName.toLowerCase().includes(origin.toLowerCase());
    
    // Verificar destino
    const destinationMatch = !destination || 
                             flight.destinationId === destination || 
                             flight.destinationCode.toLowerCase() === destination.toLowerCase() || 
                             flight.destinationName.toLowerCase().includes(destination.toLowerCase());
    
    // Verificar data (se fornecida)
    let dateMatch = true;
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      dateMatch = flight.availableDates.includes(formattedDate);
    }
    
    return originMatch && destinationMatch && dateMatch;
  });
};

function FlightSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Extrair parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const destParam = params.get('destination');
    
    if (destParam) {
      setDestination(destParam);
    }
    
    // Configurar cidades disponíveis
    const availableCities = [
      ...new Set([
        ...staticFlights.map(flight => flight.originName),
        ...staticFlights.map(flight => flight.destinationName)
      ])
    ].sort();
    
    setCities(availableCities);
    
    // Configurar datas disponíveis (todas as datas no próximo ano)
    setAvailableDates(generateAvailableDates());
    
  }, [location.search]);
  
  // Função para verificar se uma data está disponível
  const isDateAvailable = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return availableDates.includes(formattedDate);
  };
  
  // Função para buscar voos
  const handleSearch = () => {
    setLoading(true);
    
    // Simular tempo de busca
    setTimeout(() => {
      const results = searchFlights(origin, destination, date);
      setSearchResults(results);
      setSearched(true);
      setLoading(false);
    }, 1000);
  };
  
  // Função para salvar voo na lista de desejos
  const handleSaveToWishlist = (flight) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    // Obter lista de desejos atual
    const savedFlights = JSON.parse(localStorage.getItem('savedFlights') || '[]');
    
    // Verificar se o voo já está na lista
    const isAlreadySaved = savedFlights.some(f => f.id === flight.id);
    
    if (!isAlreadySaved) {
      // Adicionar à lista
      savedFlights.push({
        id: flight.id,
        origin: flight.originName,
        destination: flight.destinationName,
        date: date ? format(date, 'yyyy-MM-dd') : 'any'
      });
      
      // Salvar no localStorage
      localStorage.setItem('savedFlights', JSON.stringify(savedFlights));
      
      alert('Voo adicionado à lista de desejos!');
    } else {
      alert('Este voo já está na sua lista de desejos.');
    }
  };
  
  // Função para selecionar voo
  const handleSelectFlight = (flight) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    navigate(`/checkout/${flight.id}/${date ? format(date, 'yyyy-MM-dd') : 'any'}`, {
      state: {
        flightDetails: flight,
        selectedDate: date ? format(date, 'yyyy-MM-dd') : null
      }
    });
  };
  
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Buscar Voos
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={cities}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Origem" 
                  fullWidth 
                  placeholder="De onde você vai partir?"
                />
              )}
              value={origin}
              onChange={(event, newValue) => {
                setOrigin(newValue || '');
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={destinations.map(dest => dest.name)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Destino" 
                  fullWidth 
                  placeholder="Para onde você vai?"
                />
              )}
              value={destination ? destinations.find(d => d.id === destination)?.name || destination : ''}
              onChange={(event, newValue) => {
                const dest = destinations.find(d => d.name === newValue);
                setDestination(dest ? dest.id : newValue || '');
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="Data"
              value={date}
              onChange={(newValue) => {
                setDate(newValue);
              }}
              shouldDisableDate={(date) => !isDateAvailable(date)}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleSearch}
                startIcon={<FlightTakeoffIcon />}
                disabled={loading}
              >
                {loading ? 'Buscando...' : 'Buscar Voos'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {searched && !loading && searchResults.length === 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Nenhum voo encontrado com os critérios selecionados. Tente outras datas ou destinos.
        </Alert>
      )}
      
      {searched && !loading && searchResults.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            {searchResults.length} voos encontrados
          </Typography>
          
          <Grid container spacing={3}>
            {searchResults.slice(0, 10).map((flight) => (
              <Grid item xs={12} key={flight.id}>
                <Card sx={{ display: 'flex' }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 120 }}
                    image={flight.airlineLogo}
                    alt={flight.airlineName}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography component="div" variant="h6">
                            {flight.departureTime} <FlightTakeoffIcon sx={{ fontSize: 16, mx: 1 }} /> {flight.arrivalTime}
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary">
                            {flight.originName} ({flight.originCode}) <FlightLandIcon sx={{ fontSize: 16, mx: 1 }} /> {flight.destinationName} ({flight.destinationCode})
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                            R$ {flight.basePrice},00
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {flight.airlineName} • {flight.class}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Duração: {flight.duration}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          variant="outlined" 
                          onClick={() => handleSaveToWishlist(flight)}
                          sx={{ mr: 2 }}
                        >
                          Salvar
                        </Button>
                        <Button 
                          variant="contained" 
                          onClick={() => handleSelectFlight(flight)}
                        >
                          Selecionar Voo
                        </Button>
                      </Box>
                    </CardContent>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}

export default FlightSearch;
