import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Paper,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import staticFlights, { getFlightDetails } from '../data/staticFlights';

function FlightPurchase() {
  const { flightId, date } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [flight, setFlight] = useState(null);
  const [passengerData, setPassengerData] = useState({
    name: '',
    email: user?.email || '',
    document: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [pixCode, setPixCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Carregar detalhes do voo
    const flightDetails = getFlightDetails(flightId);
    if (flightDetails) {
      setFlight(flightDetails);
    } else {
      // Voo não encontrado, redirecionar para busca
      navigate('/voos');
    }

    setLoading(false);
  }, [flightId, date, isAuthenticated, navigate]);

  const handleNext = () => {
    if (activeStep === 3) {
      // Finalizar compra
      handleCompletePurchase();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePassengerDataChange = (e) => {
    setPassengerData({
      ...passengerData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleCardDataChange = (e) => {
    setCardData({
      ...cardData,
      [e.target.name]: e.target.value
    });
  };

  const handleCompletePurchase = () => {
    // Simular finalização da compra
    // Em um sistema real, isso enviaria os dados para processamento no backend

    // Salvar histórico de compra no localStorage
    const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
    purchaseHistory.push({
      id: `purchase-${Date.now()}`,
      flightId: flight.id,
      date: date === 'any' ? new Date().toISOString().split('T')[0] : date,
      passenger: passengerData.name,
      origin: flight.originName,
      destination: flight.destinationName,
      price: flight.basePrice,
      purchaseDate: new Date().toISOString()
    });
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));

    // Redirecionar para página de confirmação
    navigate('/');
    alert('Compra realizada com sucesso! Obrigado por escolher a AIR Discovery.');
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        // Detalhes do voo - sempre válido
        return true;
      case 1:
        // Dados do passageiro
        return (
          passengerData.name.trim() !== '' &&
          passengerData.email.trim() !== '' &&
          passengerData.document.trim() !== '' &&
          passengerData.phone.trim() !== ''
        );
      case 2:
        // Pagamento
        if (paymentMethod === 'credit') {
          return (
            cardData.number.trim() !== '' &&
            cardData.name.trim() !== '' &&
            cardData.expiry.trim() !== '' &&
            cardData.cvv.trim() !== ''
          );
        } else if (paymentMethod === 'pix') {
          return true; // PIX sempre válido
        } else if (paymentMethod === 'boleto') {
          return true; // Boleto sempre válido
        }
        return false;
      case 3:
        // Confirmação - sempre válido
        return true;
      default:
        return false;
    }
  };

  if (loading || !flight) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Carregando...
        </Typography>
      </Container>
    );
  }

  const steps = ['Detalhes do Voo', 'Dados do Passageiro', 'Pagamento', 'Confirmação'];

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Comprar Passagem
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4, mb: 4 }}>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Detalhes do Voo
              </Typography>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" gutterBottom>
                        {flight.originName} ({flight.originCode}) → {flight.destinationName} ({flight.destinationCode})
                      </Typography>
                      <Typography variant="body1">
                        Data: {date === 'any' ? 'Primeira data disponível' : date}
                      </Typography>
                      <Typography variant="body1">
                        Horário: {flight.departureTime} - {flight.arrivalTime}
                      </Typography>
                      <Typography variant="body1">
                        Duração: {flight.duration}
                      </Typography>
                      <Typography variant="body1">
                        Companhia: {flight.airlineName}
                      </Typography>
                      <Typography variant="body1">
                        Classe: {flight.class}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                          R$ {flight.basePrice},00
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Preço por pessoa
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Typography variant="body1" paragraph>
                Este voo está disponível para a data selecionada. Clique em "Próximo" para continuar com a compra.
              </Typography>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Dados do Passageiro
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Nome Completo"
                    value={passengerData.name}
                    onChange={handlePassengerDataChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    value={passengerData.email}
                    onChange={handlePassengerDataChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="document"
                    label="CPF"
                    value={passengerData.document}
                    onChange={handlePassengerDataChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="phone"
                    label="Telefone"
                    value={passengerData.phone}
                    onChange={handlePassengerDataChange}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Forma de Pagamento
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <RadioGroup
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={handlePaymentMethodChange}
                >
                  <FormControlLabel value="credit" control={<Radio />} label="Cartão de Crédito" />
                  <FormControlLabel value="pix" control={<Radio />} label="PIX" />
                  <FormControlLabel value="boleto" control={<Radio />} label="Boleto Bancário" />
                </RadioGroup>
              </FormControl>

              {paymentMethod === 'credit' && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="number"
                      label="Número do Cartão"
                      value={cardData.number}
                      onChange={handleCardDataChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="name"
                      label="Nome no Cartão"
                      value={cardData.name}
                      onChange={handleCardDataChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="expiry"
                      label="Validade (MM/AA)"
                      value={cardData.expiry}
                      onChange={handleCardDataChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="cvv"
                      label="CVV"
                      value={cardData.cvv}
                      onChange={handleCardDataChange}
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>
              )}

              {paymentMethod === 'pix' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" paragraph>
                    Escaneie o QR Code abaixo ou copie o código PIX para pagamento.
                  </Typography>
                  <Box
                    sx={{
                      width: 200,
                      height: 200,
                      bgcolor: 'grey.200',
                      mx: 'auto',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    QR Code PIX
                  </Box>
                  <TextField
                    value="00020126580014BR.GOV.BCB.PIX0136a629532e-7693-4846-b028-f142082d7b8752040000530398654041.005802BR5925AIR DISCOVERY VIAGENS6009SAO PAULO62070503***63041234"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Box>
              )}

              {paymentMethod === 'boleto' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" paragraph>
                    Clique no botão abaixo para gerar o boleto bancário.
                  </Typography>
                  <Button variant="outlined">
                    Gerar Boleto
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    O boleto tem vencimento em 3 dias úteis. A confirmação da compra ocorrerá após a compensação do pagamento.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Confirmação da Compra
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Detalhes do Voo
                </Typography>
                <Typography variant="body1">
                  {flight.originName} ({flight.originCode}) → {flight.destinationName} ({flight.destinationCode})
                </Typography>
                <Typography variant="body1">
                  Data: {date === 'any' ? 'Primeira data disponível' : date}
                </Typography>
                <Typography variant="body1">
                  Horário: {flight.departureTime} - {flight.arrivalTime}
                </Typography>
                <Typography variant="body1">
                  Companhia: {flight.airlineName}
                </Typography>
                <Typography variant="body1">
                  Classe: {flight.class}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Passageiro
                </Typography>
                <Typography variant="body1">
                  Nome: {passengerData.name}
                </Typography>
                <Typography variant="body1">
                  Email: {passengerData.email}
                </Typography>
                <Typography variant="body1">
                  CPF: {passengerData.document}
                </Typography>
                <Typography variant="body1">
                  Telefone: {passengerData.phone}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Pagamento
                </Typography>
                <Typography variant="body1">
                  Método: {
                    paymentMethod === 'credit' ? 'Cartão de Crédito' :
                    paymentMethod === 'pix' ? 'PIX' : 'Boleto Bancário'
                  }
                </Typography>
                {paymentMethod === 'credit' && (
                  <Typography variant="body1">
                    Cartão: **** **** **** {cardData.number.slice(-4)}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1">
                    Total:
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                    R$ {flight.basePrice},00
                  </Typography>
                </Box>
              </Paper>

              <Typography variant="body1" paragraph>
                Ao clicar em "Finalizar Compra", você concorda com os termos e condições da AIR Discovery.
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            {activeStep === steps.length - 1 ? 'Finalizar Compra' : 'Próximo'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default FlightPurchase;
