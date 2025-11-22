# Fix: Botões de Seleção de Passageiros

## Problema Identificado

O usuário relatou que o fluxo de seleção de passageiros está quebrado - em vez de botões clicáveis aparecendo na interface, o usuário tinha que digitar texto livre como "2 adultos" e "nenhuma".

## Causa Raiz

O LLM (Large Language Model) não estava gerando consistentemente o campo `button_options` no JSON de resposta durante a etapa de coleta de dados de passageiros (`collecting_passengers`).

## Solução Implementada

### Simplificação Drástica do Prompt

O prompt estava muito verboso e "bloated" com exemplos duplicados. Simplificamos drasticamente:

#### a) Regras Críticas Simplificadas

De 9 regras verbosas para 4 regras concisas:

```
1. Retorne APENAS JSON válido em uma linha
2. NUNCA use quebras de linha, markdown ou texto extra
3. **SEMPRE inclua button_options ao coletar passageiros**
4. NUNCA peça texto livre para passageiros - use botões
```

#### b) Schema JSON Compacto

Removemos verbosidade e mantivemos apenas o essencial:

```typescript
"button_options": [{"label": string, "value": string}]|null

**button_options é OBRIGATÓRIO para collecting_passengers**
```

#### c) Instruções de Passageiros Simplificadas

De 3 sub-etapas detalhadas para instruções diretas:

```
- SEMPRE use button_options - NUNCA peça texto livre
- Pergunte em sequência: adultos → crianças → idade de cada criança
- Botões adultos: [{"label":"1 adulto","value":"1"},{"label":"2 adultos","value":"2"}...]
- Botões crianças: [{"label":"Nenhuma","value":"0"},{"label":"1 criança","value":"1"}...]
- Botões idade: [{"label":"0-2 anos","value":"1"},{"label":"3-5 anos","value":"4"}...]
```

#### d) Exemplos Reduzidos

De ~200 linhas de exemplos duplicados para 4 exemplos essenciais em JSON compacto:

1. Pergunta sobre adultos com botões
2. Após clicar "2 adultos" → pergunta sobre crianças
3. Após clicar "1 criança" → pergunta sobre idade
4. Após clicar idade → avança para próxima etapa

## Estrutura dos Botões

### Botões para Adultos
```json
[
  {"label": "1 adulto", "value": "1"},
  {"label": "2 adultos", "value": "2"},
  {"label": "3 adultos", "value": "3"},
  {"label": "4 adultos", "value": "4"},
  {"label": "Mais...", "value": "more"}
]
```

### Botões para Crianças
```json
[
  {"label": "Nenhuma", "value": "0"},
  {"label": "1 criança", "value": "1"},
  {"label": "2 crianças", "value": "2"},
  {"label": "3 crianças", "value": "3"},
  {"label": "Mais...", "value": "more"}
]
```

### Botões para Idade
```json
[
  {"label": "0-2 anos", "value": "1"},
  {"label": "3-5 anos", "value": "4"},
  {"label": "6-11 anos", "value": "8"},
  {"label": "12-17 anos", "value": "14"}
]
```

## Fluxo Frontend

O frontend já estava preparado para receber e renderizar os botões:

1. **Hook `useJsonSocketConnection`** (linha 105): Extrai `button_options` do JSON
2. **Componente `ChatButtons`**: Renderiza os botões com estilo Material-UI
3. **ChatPageV2** (linha 407-412): Renderiza botões quando disponíveis
4. **Função `handleButtonClick`** (linha 127): Envia o label do botão como mensagem do usuário

## Verificação

Para verificar se o fix está funcionando:

1. Inicie uma nova conversa no chat
2. Responda as perguntas de origem e orçamento
3. **VERIFIQUE**: Quando chegar na pergunta sobre passageiros, botões devem aparecer automaticamente
4. **NÃO DEVE**: Aparecer campo de texto livre para digitar

## Testes

Os testes de integração já cobrem o fluxo completo:
- `passenger-integration.spec.ts`: 8 testes ✅
- `flight-search-passenger-integration.spec.ts`: 7 testes ✅
- `checkout-passenger-integration.spec.ts`: 9 testes ✅

Total: 24 testes passando

## Próximos Passos

1. **Teste Manual**: Seguir o guia em `MANUAL_E2E_TESTING_GUIDE.md`
2. **Monitoramento**: Verificar logs do backend para confirmar que `button_options` está sendo gerado
3. **Ajustes**: Se o LLM ainda não gerar botões consistentemente, pode ser necessário:
   - Adicionar mais exemplos no prompt
   - Usar um modelo de LLM diferente
   - Implementar validação no backend para forçar button_options

## Arquivos Modificados

- `backend/airdiscovery/src/modules/chatbot/utils/json-prompt-builder.ts`
- `backend/airdiscovery/MANUAL_E2E_TESTING_GUIDE.md`

## Arquivos Relacionados (Não Modificados)

- `app/src/components/chat/ChatButtons.tsx` - Componente de botões (já funcionando)
- `app/src/hooks/useJsonSocketConnection.ts` - Hook que processa button_options (já funcionando)
- `app/src/pages/ChatPageV2.tsx` - Página que renderiza botões (já funcionando)

