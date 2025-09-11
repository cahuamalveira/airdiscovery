// Função para gerar estatísticas de voos para o dashboard admin
export const getFlightStatistics = () => {
  return {
    totalDestinations: 5,
    totalFlights: 1240,
    totalBookings: 550,
    revenueGenerated: 275000,
    averageTicketPrice: 500,
    popularDestinations: [
      { id: 'rio', name: 'Rio de Janeiro', count: 180 },
      { id: 'saopaulo', name: 'São Paulo', count: 150 },
      { id: 'florianopolis', name: 'Florianópolis', count: 120 },
      { id: 'salvador', name: 'Salvador', count: 60 },
      { id: 'fozdoiguacu', name: 'Foz do Iguaçu', count: 40 }
    ],
    popularOrigins: [
      { name: 'São Paulo', count: 200 },
      { name: 'Rio de Janeiro', count: 150 },
      { name: 'Brasília', count: 80 },
      { name: 'Porto Alegre', count: 70 },
      { name: 'Curitiba', count: 50 }
    ]
  };
};

// Função para gerar datas disponíveis para voos (todas as datas no próximo ano)
export const generateAvailableDates = () => {
  const dates = [];
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);
  
  let currentDate = today;
  while (currentDate <= oneYearLater) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Gerar voos estáticos para todas as cidades
export const generateStaticFlights = () => {
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

// Função para obter detalhes de um voo específico
export const getFlightDetails = (flightId) => {
  return staticFlights.find(flight => flight.id === flightId);
};

// Exportar voos estáticos
export default staticFlights;
