# 🛫 Fluxo de Seleção e Checkout de Voos - Implementação Completa

## 📋 Resumo da Implementação

Esta implementação refatora o fluxo de seleção e checkout de voos para criar entidades `Flight` internas com UUID próprio, melhorando o contexto de checkout e simplificando a criação de bookings.

## 🏗️ Arquitetura do Fluxo

### 1. **Seleção de Voo**
```
Frontend seleciona voo → POST /flights/from-offer → Retorna { flightId: UUID }
```

### 2. **Checkout** 
```
Frontend navega para checkout → GET /flights/:flightId → Recebe contexto completo
```

### 3. **Booking**
```
Frontend cria booking → POST /bookings com flightId → Booking usa Flight interna
```

## 📂 Arquivos Modificados

### 1. **Entidade Flight** (`flight.entity.ts`)
- ✅ Adicionada coluna `amadeusOfferPayload: any` (JSON)
- ✅ Mantém UUID interno (`id`)
- ✅ Armazena `amadeusOfferId` para referência

### 2. **FlightsService** (`flights.service.ts`)
**Novos Métodos:**
- `createFlightFromOffer(dto)`: Cria Flight a partir de oferta Amadeus
- `findFlightById(flightId)`: Busca Flight pelo UUID interno

**Características:**
- Verifica duplicatas pelo `amadeusOfferId`
- Extrai dados do payload Amadeus automaticamente
- Armazena payload completo para contexto de checkout

### 3. **FlightsController** (`flights.controller.ts`)
**Novos Endpoints:**
- `POST /flights/from-offer`: Cria Flight e retorna `{ flightId }`
- `GET /flights/:flightId`: Retorna contexto completo da Flight

### 4. **BookingService** (`booking.service.ts`)
**Simplificações:**
- ✅ Remove lógica complexa de criação/atualização de Flight
- ✅ Requer `flightId` obrigatório
- ✅ Busca Flight existente por UUID
- ✅ `flightInfo` marcada como deprecated

### 5. **DTO Criado**
- `CreateFlightFromOfferDto`: Recebe `amadeusOfferId` + `offerPayload`

### 6. **Migração**
- Nova coluna `amadeus_offer_payload` (JSON)

## 🔌 API Endpoints

### 📤 POST /flights/from-offer
**Descrição:** Cria uma entidade Flight a partir de oferta Amadeus

**Request Body:**
```json
{
  "amadeusOfferId": "string",
  "offerPayload": {
    // Payload completo da oferta Amadeus
    "id": "1",
    "price": {
      "grandTotal": "450.00",
      "currency": "USD"
    },
    "itineraries": [...],
    // ... resto dos dados da Amadeus
  }
}
```

**Response:**
```json
{
  "flightId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 📥 GET /flights/:flightId
**Descrição:** Retorna contexto completo da Flight para checkout

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amadeusOfferId": "1",
  "flightNumber": "AA123",
  "departureCode": "JFK",
  "arrivalCode": "LAX",
  "departureDateTime": "2024-03-15T14:30:00Z",
  "arrivalDateTime": "2024-03-15T17:45:00Z",
  "priceTotal": 450.00,
  "currency": "USD",
  "amadeusOfferPayload": {
    // Payload completo da Amadeus
  }
}
```

## 🧪 Testes com Postman/cURL

### 1. **Criar Flight a partir de Oferta**
```bash
curl -X POST http://localhost:3000/flights/from-offer \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "amadeusOfferId": "TEST_OFFER_123",
    "offerPayload": {
      "id": "TEST_OFFER_123",
      "price": {
        "grandTotal": "299.99",
        "currency": "USD"
      },
      "itineraries": [{
        "segments": [{
          "departure": {
            "iataCode": "NYC",
            "at": "2024-03-15T08:00:00"
          },
          "arrival": {
            "iataCode": "LAX", 
            "at": "2024-03-15T11:30:00"
          },
          "number": "AA101"
        }]
      }]
    }
  }'
```

### 2. **Buscar Flight para Checkout**
```bash
curl -X GET http://localhost:3000/flights/YOUR_FLIGHT_ID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. **Criar Booking com Flight ID**
```bash
curl -X POST http://localhost:3000/bookings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "flightId": "YOUR_FLIGHT_ID",
    "passengers": [{
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "document": "AB123456",
      "birthDate": "1990-01-01"
    }],
    "totalAmount": 29999,
    "currency": "USD"
  }'
```

## ⚡ Pontos-Chave da Implementação

### 🔒 **Segurança**
- UUID interno previne IDOR (Insecure Direct Object Reference)
- Relacionamentos usam UUIDs, não IDs sequenciais

### 🚀 **Performance** 
- Evita recriar Flight entities desnecessariamente
- Payload JSON indexável no PostgreSQL
- Busca eficiente por UUID

### 🧹 **Clean Code**
- Separação de responsabilidades clara
- BookingService simplificado
- DTOs específicos para cada operação

### 🔄 **Fluxo Otimizado**
1. **Seleção**: Frontend → `POST /flights/from-offer` → Recebe `flightId`
2. **Contexto**: Frontend → `GET /flights/:flightId` → Carrega dados completos
3. **Booking**: Frontend → `POST /bookings` → Usa `flightId` interno

### 🛠️ **Manutenibilidade**
- Flight payload preservado para auditoria
- Migração backward-compatible
- `flightInfo` deprecated gradualmente

## 🎯 Benefícios Alcançados

✅ **Contexto Completo**: Checkout tem acesso a todos os dados da oferta  
✅ **Relacionamentos Limpos**: Bookings referenciam Flight UUID interno  
✅ **Eliminação de Duplicação**: Não recria Flight entities  
✅ **Auditoria**: Payload Amadeus preservado  
✅ **Escalabilidade**: Estrutura preparada para múltiplas fontes de voo  

## 🔄 Migração Necessária

Execute a migração para adicionar a nova coluna:

```bash
npm run migration:run
```

## 🚨 Breaking Changes

- `BookingService.create()` agora requer `flightId` obrigatório
- `flightInfo` no DTO é deprecated (ainda funciona mas será removida)
- Frontend deve adaptar fluxo: criar Flight antes do checkout