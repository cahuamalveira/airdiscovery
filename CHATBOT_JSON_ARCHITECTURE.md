# Nova Arquitetura do Chatbot com Respostas JSON Estruturadas

## Visão Geral

A refatoração completa do sistema de chatbot elimina a necessidade de parsing manual de strings, substituindo-a por uma abordagem baseada em respostas JSON estruturadas do LLM. Esta mudança traz maior confiabilidade, facilidade de manutenção e funcionalidades mais avançadas.

## Principais Melhorias

### 1. **Respostas JSON Estruturadas**
- ✅ LLM retorna sempre JSON válido e estruturado
- ✅ Eliminação de regex complexos e parsing manual de strings
- ✅ Dados extraídos de forma confiável e consistente
- ✅ Validação robusta com múltiplas estratégias de fallback

### 2. **Nova Arquitetura de Componentes**

#### Backend (`/backend/airdiscovery/src/modules/chatbot/`)
```
├── interfaces/
│   └── json-response.interface.ts     # Interfaces TypeScript para JSON
├── utils/
│   ├── json-prompt-builder.ts         # Builder de prompts otimizados
│   └── json-response-parser.ts        # Parser e validador robusto
├── json-chatbot.service.ts            # Novo serviço limpo do zero
└── dto/                               # DTOs atualizados
```

#### Frontend (`/app/src/`)
```
├── types/
│   └── json-chat.ts                   # Interfaces TypeScript frontend
├── hooks/
│   ├── useJsonSocket.ts               # WebSocket para JSON
│   └── useJsonChat.ts                 # Hook principal integrado
├── reducers/
│   └── jsonChatReducer.ts             # State management específico
└── components/
    └── JsonChatInterface.tsx          # Componente exemplo
```

## Estrutura da Resposta JSON

```typescript
interface ChatbotJsonResponse {
  conversation_stage: ConversationStage;
  data_collected: {
    origin_name: string | null;
    origin_iata: string | null;
    destination_name: string | null;
    destination_iata: string | null;
    activities: string[] | null;
    budget_in_brl: number | null;
    purpose: string | null;
    hobbies: string[] | null;
  };
  next_question_key: string | null;
  assistant_message: string;
  is_final_recommendation: boolean;
}
```

## Fluxo de Funcionamento

### 1. **Prompt System Avançado**
- Prompts otimizados especificamente para retorno JSON
- Múltiplos exemplos e validações
- Instruções claras sobre códigos IATA brasileiros
- Contexto dinâmico baseado no estado da sessão

### 2. **Parsing Robusto**
- **4 estratégias de parsing** em ordem de prioridade:
  1. Parse direto do JSON
  2. Limpeza básica + parse
  3. Extração de JSON do texto
  4. Correção de problemas comuns + parse
- Fallback inteligente em caso de falhas
- Sanitização de caracteres problemáticos

### 3. **State Management Avançado**
- Estado imutável com reducer dedicado
- Seletores especializados para diferentes consultas
- Metadados de progresso calculados automaticamente
- Tracking de completude e recomendações

### 4. **WebSocket Integrado**
- Eventos específicos para dados JSON
- Streaming com metadados estruturados
- Reconexão automática com state preservation
- Tratamento de erros granular

## Vantagens da Nova Arquitetura

### ✅ **Confiabilidade**
- Eliminação de falsos positivos em extração de dados
- Validação robusta com múltiplos fallbacks
- Parsing consistente independente da variabilidade do LLM

### ✅ **Manutenibilidade**
- Código limpo e modular
- Interfaces TypeScript em toda aplicação
- Separação clara de responsabilidades
- Facilidade para adicionar novos campos

### ✅ **Funcionalidades Avançadas**
- Progresso em tempo real do preenchimento
- Metadados ricos sobre o estado da conversa
- Recomendações estruturadas e navegáveis
- Debug info detalhado para desenvolvimento

### ✅ **Performance**
- Menor processamento no frontend
- Streams otimizados com metadados
- State updates eficientes
- Menos re-renders desnecessários

## Como Usar

### 1. **Hook Principal**
```typescript
const {
  state,           // Estado completo do chat
  sendMessage,     // Função para enviar mensagens
  resetChat,       // Reset do chat
  isReady,         // Status de prontidão
  recommendation,  // Recomendação final estruturada
  progress        // Progresso atual (0-100%)
} = useJsonChat({ isOpen, user, socket });
```

### 2. **Hooks Auxiliares**
```typescript
// Progresso detalhado
const progressInfo = useJsonChatProgress(state);

// Formatadores de dados
const formatters = useJsonChatFormatters();

// Ações do chat
const actions = useJsonChatActions(state, dispatch);

// Debug info
const debugInfo = useJsonChatDebug(state);
```

### 3. **Componente de Chat**
```typescript
<JsonChatInterface
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  user={user}
/>
```

## Migração do Sistema Antigo

### Passos para Migração:
1. **Substituir imports** dos hooks antigos pelos novos
2. **Atualizar componentes** para usar as novas interfaces
3. **Configurar backend** para usar o `JsonChatbotService`
4. **Testar fluxo completo** com dados reais
5. **Monitorar parsing** e ajustar prompts se necessário

### Compatibilidade:
- ✅ Mantém mesmas funcionalidades do sistema anterior
- ✅ Melhora confiabilidade sem breaking changes na UX
- ✅ WebSocket events podem coexistir durante transição
- ✅ Dados coletados mantêm mesma estrutura essencial

## Próximos Passos

1. **Integração com Gateway** existente
2. **Testes A/B** com sistema anterior
3. **Monitoramento de parsing** em produção
4. **Otimização de prompts** baseada em dados reais
5. **Expansão para outros idiomas/destinos**

## Conclusão

Esta nova arquitetura representa uma evolução significativa na confiabilidade e manutenibilidade do sistema de chatbot. A abordagem baseada em JSON estruturado elimina os principais pontos de falha do sistema anterior, enquanto introduz funcionalidades avançadas de tracking e debugging.

O sistema está pronto para produção e pode ser integrado gradualmente, mantendo compatibilidade com o sistema existente durante a transição.