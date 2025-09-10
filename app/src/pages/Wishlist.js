import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FlightIcon from '@mui/icons-material/Flight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useAuth } from '../contexts/AuthContext';
import { destinations } from '../data/destinations';

function Wishlist() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [savedFlights, setSavedFlights] = useState([]);
  const [monitoredPrices, setMonitoredPrices] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [flightToPurchase, setFlightToPurchase] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Carregar destinos salvos
    const destinations = JSON.parse(localStorage.getItem('savedDestinations') || '[]');
    setSavedDestinations(destinations);

    // Carregar voos salvos
    const flights = JSON.parse(localStorage.getItem('savedFlights') || '[]');
    setSavedFlights(flights);

    // Carregar monitoramentos de preço
    const monitored = JSON.parse(localStorage.getItem('monitoredPrices') || '{}');
    setMonitoredPrices(monitored);
  }, [isAuthenticated, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteItem = (type, id) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'destination') {
      const updatedDestinations = savedDestinations.filter(dest => dest.id !== itemToDelete.id);
      setSavedDestinations(updatedDestinations);
      localStorage.setItem('savedDestinations', JSON.stringify(updatedDestinations));
    } else if (itemToDelete.type === 'flight') {
      const updatedFlights = savedFlights.filter(flight => flight.id !== itemToDelete.id);
      setSavedFlights(updatedFlights);
      localStorage.setItem('savedFlights', JSON.stringify(updatedFlights));

      // Remover também do monitoramento de preços
      const updatedMonitored = { ...monitoredPrices };
      delete updatedMonitored[itemToDelete.id];
      setMonitoredPrices(updatedMonitored);
      localStorage.setItem('monitoredPrices', JSON.stringify(updatedMonitored));
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleToggleMonitor = (flightId) => {
    const updatedMonitored = { ...monitoredPrices };
    
    if (updatedMonitored[flightId]) {
      delete updatedMonitored[flightId];
    } else {
      updatedMonitored[flightId] = true;
    }
    
    setMonitoredPrices(updatedMonitored);
    localStorage.setItem('monitoredPrices', JSON.stringify(updatedMonitored));
  };

  const handlePurchaseFlight = (flight) => {
    setFlightToPurchase(flight);
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (!flightToPurchase) return;
    
    // Redirecionar para a página de compra
    navigate(`/voos/selecionar/${flightToPurchase.id}/${flightToPurchase.date || 'any'}`);
    
    setPurchaseDialogOpen(false);
    setFlightToPurchase(null);
  };

  const handleViewDestination = (destinationId) => {
    navigate(`/destinos/${destinationId}`);
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Minha Lista de Desejos
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="wishlist tabs"
        >
          <Tab label="Destinos" />
          <Tab label="Voos" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          {savedDestinations.length === 0 ? (
            <Alert severity="info">
              Você ainda não adicionou nenhum destino à sua lista de desejos.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {savedDestinations.map((destination) => (
                <Grid item xs={12} sm={6} md={4} key={destination.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="140"
                      image={destination.image}
                      alt={destination.name}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {destination.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {destination.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button 
                          size="small" 
                          onClick={() => handleViewDestination(destination.id)}
                        >
                          Ver Detalhes
                        </Button>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteItem('destination', destination.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          {savedFlights.length === 0 ? (
            <Alert severity="info">
              Você ainda não adicionou nenhum voo à sua lista de desejos.
            </Alert>
          ) : (
            <List>
              {savedFlights.map((flight) => (
                <React.Fragment key={flight.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${flight.origin} → ${flight.destination}`}
                      secondary={`Data: ${flight.date === 'any' ? 'Qualquer data' : flight.date}`}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!monitoredPrices[flight.id]}
                              onChange={() => handleToggleMonitor(flight.id)}
                              color="primary"
                            />
                          }
                          label={
                            monitoredPrices[flight.id] ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <NotificationsIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="body2">Monitorando</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <NotificationsOffIcon fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="body2">Monitorar</Typography>
                              </Box>
                            )
                          }
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<FlightIcon />}
                          size="small"
                          onClick={() => handlePurchaseFlight(flight)}
                          sx={{ mx: 1 }}
                        >
                          Comprar
                        </Button>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteItem('flight', flight.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja remover este item da sua lista de desejos?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error">Excluir</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmação de compra */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={() => setPurchaseDialogOpen(false)}
      >
        <DialogTitle>Comprar passagem</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deseja prosseguir para a compra deste voo?
          </DialogContentText>
          {flightToPurchase && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                {flightToPurchase.origin} → {flightToPurchase.destination}
              </Typography>
              <Typography variant="body2">
                Data: {flightToPurchase.date === 'any' ? 'Qualquer data' : flightToPurchase.date}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmPurchase} color="primary" variant="contained">
            Prosseguir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Wishlist;
