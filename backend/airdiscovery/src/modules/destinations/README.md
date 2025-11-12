# Módulo de Destinos - Integração com Amadeus API

Este módulo implementa a integração com a API do Amadeus para busca de voos e destinos, atendendo aos requisitos RF016 e RF017 do projeto AIR Discovery.

## Funcionalidades Implementadas

### 1. Busca de Voos (RF016, RF017)
- **Endpoint**: `GET /destinations`
- **Descrição**: Consulta voos disponíveis na API do Amadeus em tempo real
- **Parâmetros**:
  - `origin`: Código IATA do aeroporto de origem (3 caracteres)
  - `destination`: Código IATA do aeroporto de destino (3 caracteres)
  - `departureDate`: Data de partida (formato: YYYY-MM-DD)
  - `returnDate`: Data de retorno (opcional, formato: YYYY-MM-DD)
  - `adults`: Número de adultos (1-5)
  - `nonStop`: Voos diretos apenas (opcional, boolean)

### 2. Busca de Aeroportos
- **Endpoint**: `GET /destinations/airports`
- **Descrição**: Busca aeroportos por palavra-chave (cidade ou código IATA)
- **Parâmetros**:
  - `keyword`: Palavra-chave para busca (mínimo 2 caracteres)

## Configuração da API Amadeus

### 1. Obter Credenciais
1. Acesse [Amadeus for Developers](https://developers.amadeus.com/)
2. Crie uma conta e um novo projeto
3. Obtenha seu `Client ID` e `Client Secret`

### 2. Configurar Variáveis de Ambiente
Adicione as seguintes variáveis no arquivo `.env`:

```bash
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

## Estrutura da Resposta

### Busca de Voos
```json
{
  "meta": {
    "count": 10,
    "searchCriteria": {
      "origin": "MAD",
      "destination": "ATH",
      "departureDate": "2024-11-01",
      "adults": 1
    }
  },
  "data": [
    {
      "id": "1",
      "source": "GDS",
      "instantTicketingRequired": false,
      "oneWay": false,
      "lastTicketingDate": "2024-10-31",
      "numberOfBookableSeats": 5,
      "itineraries": [
        {
          "duration": "PT13H5M",
          "segments": [
            {
              "departure": {
                "iataCode": "MAD",
                "terminal": "1",
                "at": "2024-11-01T06:50:00"
              },
              "arrival": {
                "iataCode": "ATH",
                "terminal": "A",
                "at": "2024-11-01T11:35:00"
              },
              "carrierCode": "IB",
              "number": "3154",
              "aircraft": {
                "code": "321"
              },
              "duration": "PT3H45M",
              "numberOfStops": 0
            }
          ]
        }
      ],
      "price": {
        "currency": "EUR",
        "total": "250.00",
        "base": "200.00",
        "grandTotal": "250.00"
      },
      "validatingAirlineCodes": ["IB"]
    }
  ],
  "dictionaries": {
    "locations": {
      "MAD": {
        "cityCode": "MAD",
        "countryCode": "ES"
      }
    },
    "carriers": {
      "IB": "IBERIA"
    }
  }
}
```

## Exemplos de Uso

### 1. Buscar Voos
```bash
# Voo ida e volta
GET /destinations?origin=MAD&destination=ATH&departureDate=2024-11-01&returnDate=2024-11-08&adults=2

# Voo somente ida
GET /destinations?origin=GRU&destination=JFK&departureDate=2024-12-15&adults=1&nonStop=true
```

### 2. Buscar Aeroportos
```bash
# Buscar por cidade
GET /destinations/airports?keyword=Madrid

# Buscar por código IATA
GET /destinations/airports?keyword=MAD
```

## Validações Implementadas

### 1. Validação de Datas
- Data de partida não pode ser anterior à data atual
- Data de retorno não pode ser anterior à data de partida

### 2. Validação de Parâmetros
- Códigos IATA devem ter exatamente 3 caracteres
- Número de adultos entre 1 e 5
- Formato de data: YYYY-MM-DD

## Tratamento de Erros

### 1. Erros da API Amadeus
- **401**: Token expirado (renovação automática)
- **400**: Parâmetros inválidos
- **429**: Limite de requisições excedido
- **500**: Erro interno da API

### 2. Erros de Validação
- **400**: Parâmetros obrigatórios ausentes
- **400**: Formato de data inválido
- **400**: Códigos IATA inválidos

## Performance e Otimizações

### 1. Cache de Token
- Token de acesso é armazenado em memória
- Renovação automática 5 minutos antes do vencimento

### 2. Limitação de Resultados
- Máximo de 50 voos por busca para otimizar performance
- Timeout de 30 segundos para requisições

## Integração com Frontend

### 1. Fluxo de Busca (RF014, RF015)
1. Frontend chama endpoint de busca com parâmetros
2. Backend valida parâmetros e consulta Amadeus
3. Resposta é transformada e retornada padronizada
4. Frontend exibe lista de voos (RF017)

### 2. Autocomplete de Aeroportos
1. Frontend chama endpoint de aeroportos conforme usuário digita
2. Backend retorna sugestões de aeroportos
3. Frontend exibe opções para seleção

## Monitoramento e Logs

### 1. Logs Implementados
- Requisições realizadas à API Amadeus
- Erros de autenticação e validação
- Performance de requisições
- Número de resultados retornados

### 2. Métricas Sugeridas
- Tempo de resposta médio
- Taxa de erro por endpoint
- Uso de quota da API Amadeus
- Conversão de buscas em seleções

## Próximos Passos

1. **Cache de Resultados**: Implementar cache Redis para buscas frequentes
2. **Histórico de Buscas**: Salvar buscas do usuário para análise
3. **Filtros Avançados**: Adicionar filtros por companhia aérea, preço, etc.
4. **Notificações de Preço**: Alert de mudança de preços
5. **Integração com Wishlist**: Salvar voos selecionados (RF019-RF023)

## Documentação Adicional

- [Amadeus API Documentation](https://developers.amadeus.com/self-service)
- [Flight Offers Search API](https://developers.amadeus.com/self-service/category/air/api-doc/flight-offers-search)
- [Airport & City Search API](https://developers.amadeus.com/self-service/category/air/api-doc/airport-and-city-search)
