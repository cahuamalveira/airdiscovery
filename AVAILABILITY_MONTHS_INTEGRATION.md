# Integração de Disponibilidade de Meses com Busca de Voos

## 📋 Visão Geral

Este documento descreve como o campo `availability_months` é coletado pelo chatbot e convertido automaticamente em `departureDate` e `returnDate` para busca de voos na API Amadeus.

## 🔄 Fluxo Completo

### 1. Coleta de Dados pelo Chatbot

O chatbot agora coleta **5 informações obrigatórias** na seguinte ordem:

1. **Origem** (`origin_name` + `origin_iata`)
2. **Orçamento** (`budget_in_brl`)
3. **✨ Disponibilidade** (`availability_months`) - **NOVO**
4. **Atividades** (`activities`)
5. **Propósito** (`purpose`)

### 2. Estrutura dos Dados Coletados

```typescript
interface CollectedData {
  origin_name: string | null;           // Ex: "São Paulo"
  origin_iata: string | null;           // Ex: "GRU"
  destination_name: string | null;      // Ex: "Florianópolis"
  destination_iata: string | null;      // Ex: "FLN"
  budget_in_brl: number | null;         // Ex: 3000
  availability_months: string[] | null; // Ex: ["Janeiro", "Fevereiro"]
  activities: string[] | null;          // Ex: ["Praia", "Vida Noturna"]
  purpose: string | null;               // Ex: "Lazer"
  hobbies: string[] | null;             // Ex: null
}
```

## 🎯 Como Usar no Frontend

### Opção 1: Usar os Dados da Sessão Diretamente (Recomendado)

O frontend já recebe `collectedData` através do WebSocket. Quando o chatbot finaliza a recomendação:

```typescript
// No evento chatResponse do WebSocket
socket.on('chatResponse', (response: JsonStreamChunk) => {
  if (response.metadata?.collectedData) {
    const data = response.metadata.collectedData;
    
    // Quando is_final_recommendation for true, você tem todos os dados
    if (data.is_final_recommendation) {
      // Dados estão prontos para buscar voos!
      const searchParams = {
        origin: data.origin_iata,
        destination: data.destination_iata,
        // availability_months será convertido automaticamente no backend
      };
    }
  }
});
```

### Opção 2: Usar o Método Helper do Backend

O `ChatbotService` possui um método que converte automaticamente os meses em datas:

```typescript
// Backend: chatbot.service.ts
async getFlightSearchParamsFromSession(sessionId: string): Promise<{
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;     // Gerado a partir de availability_months
  returnDate: string;        // Calculado baseado na duração
  adults: number;
  nonStop: boolean;
} | null>
```

**Você pode expor isso via REST ou WebSocket conforme necessário.**

## 🔧 Lógica de Conversão de Datas

### Arquivo: `date-converter.util.ts`

```typescript
convertAvailabilityToDateRange(
  availabilityMonths: ["Janeiro", "Fevereiro"],
  tripDuration: 7  // dias
)
// Retorna:
{
  departureDate: "2026-01-15",  // Meio do primeiro mês disponível
  returnDate: "2026-01-22"      // + 7 dias
}
```

### Regras de Conversão

1. **Usa o primeiro mês disponível** da lista
2. **Data de partida**: dia 15 do mês (meio do mês)
3. **Mínimo 14 dias no futuro**: se o mês já passou ou está próximo, usa o mesmo mês do ano seguinte
4. **Duração da viagem**: calculada baseada no orçamento
   - Orçamento >= R$ 5.000 → 10 dias
   - Orçamento >= R$ 3.000 → 7 dias
   - Orçamento >= R$ 1.500 → 5 dias
   - Orçamento < R$ 1.500 → 3 dias

### Meses Aceitos

Aceita tanto nomes completos quanto abreviações:

- Português completo: "Janeiro", "Fevereiro", "Março", etc.
- Abreviações: "Jan", "Fev", "Mar", etc.
- **Case-insensitive** e remove acentos automaticamente

## 📡 Integração com API Amadeus

### Cenário 1: Busca Direta no Frontend

```typescript
// Quando o usuário clica em "Ver Recomendações"
const sessionData = getSessionFromContext();

// Chama o backend para converter os meses em datas
const response = await fetch(`/api/chatbot/sessions/${sessionId}/flight-params`);
const flightParams = await response.json();

// Usa os parâmetros para buscar voos
const flights = await fetch('/api/destinations/search', {
  method: 'POST',
  body: JSON.stringify({
    origin: flightParams.originLocationCode,
    destination: flightParams.destinationLocationCode,
    departureDate: flightParams.departureDate,  // ✅ Convertido automaticamente
    returnDate: flightParams.returnDate,        // ✅ Convertido automaticamente
    adults: flightParams.adults,
    nonStop: flightParams.nonStop
  })
});
```

### Cenário 2: Backend Processa Tudo

O frontend apenas informa o `sessionId` e o backend:
1. Busca a sessão
2. Converte `availability_months` em datas
3. Chama a API Amadeus
4. Retorna os voos

```typescript
// Frontend
const flights = await fetch(`/api/chatbot/sessions/${sessionId}/search-flights`);
```

```typescript
// Backend (novo endpoint a ser criado)
@Get(':sessionId/search-flights')
async searchFlightsFromSession(@Param('sessionId') sessionId: string) {
  const params = await this.chatbotService.getFlightSearchParamsFromSession(sessionId);
  
  if (!params) {
    throw new BadRequestException('Dados insuficientes para busca');
  }
  
  return await this.destinationsService.searchDestinations(params);
}
```

## 🧪 Exemplos de Uso

### Exemplo 1: Usuário diz "Janeiro ou Fevereiro"

```typescript
// LLM extrai:
{
  availability_months: ["Janeiro", "Fevereiro"]
}

// Backend converte para:
{
  departureDate: "2026-01-15",  // Primeiro mês disponível
  returnDate: "2026-01-22"      // +7 dias (baseado no orçamento)
}
```

### Exemplo 2: Usuário diz "Junho"

```typescript
// Se hoje é 12 de Novembro de 2025:
{
  availability_months: ["Junho"]
}

// Backend converte para:
{
  departureDate: "2026-06-15",  // Junho do próximo ano (já passou 2025)
  returnDate: "2026-06-25"      // +10 dias (orçamento alto)
}
```

### Exemplo 3: Usuário não especifica mês

```typescript
// Se availability_months for null ou vazio:
{
  availability_months: null
}

// Backend usa padrão de 30 dias no futuro:
{
  departureDate: "2025-12-12",  // +30 dias de hoje
  returnDate: "2025-12-19"      // +7 dias
}
```

## ✅ Checklist de Implementação

### Backend ✅
- [x] Interface `CollectedData` atualizada com `availability_months`
- [x] `JsonPromptBuilder` atualizado com nova pergunta
- [x] `JsonResponseParser` validando o novo campo
- [x] Função `convertAvailabilityToDateRange()` criada
- [x] Função `getFlightSearchParamsFromSession()` no service
- [x] Lógica de duração de viagem baseada em orçamento
- [x] Lógica de voos diretos baseada em propósito

### Frontend 🔄
- [ ] Atualizar tipos TypeScript com `availability_months`
- [ ] Criar endpoint ou usar WebSocket para obter parâmetros de busca
- [ ] Integrar conversão de meses na página de resultados
- [ ] Exibir datas calculadas para o usuário revisar
- [ ] Permitir ajuste manual das datas (opcional)

## 📚 Arquivos Relevantes

- **Backend**:
  - `backend/airdiscovery/src/modules/chatbot/interfaces/json-response.interface.ts`
  - `backend/airdiscovery/src/modules/chatbot/utils/json-prompt-builder.ts`
  - `backend/airdiscovery/src/modules/chatbot/utils/date-converter.util.ts`
  - `backend/airdiscovery/src/modules/chatbot/utils/flight-search-builder.util.ts`
  - `backend/airdiscovery/src/modules/chatbot/chatbot.service.ts`

- **Frontend** (a atualizar):
  - `app/src/types/chat.ts`
  - `app/src/hooks/useFlightSearch.ts`
  - `app/src/pages/ResultsPage.tsx` (ou similar)

## 🚀 Próximos Passos

1. **Expor endpoint REST** para obter parâmetros de busca:
   ```typescript
   GET /api/chatbot/sessions/:sessionId/flight-params
   ```

2. **Ou adicionar evento WebSocket**:
   ```typescript
   socket.emit('getFlightSearchParams', { sessionId });
   socket.on('flightSearchParams', (params) => { /* usar params */ });
   ```

3. **Atualizar frontend** para usar os parâmetros convertidos

4. **Adicionar UI** para mostrar as datas calculadas e permitir ajuste

---

**Data de Criação**: 12 de Novembro de 2025  
**Versão**: 1.0  
**Autor**: Sistema de Chatbot AIR Discovery
