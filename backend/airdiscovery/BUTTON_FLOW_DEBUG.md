# Debug: Fluxo de Botões de Passageiros

## Checklist de Verificação

### 1. Backend - Geração do JSON
- [ ] O LLM está gerando `button_options` no JSON?
- [ ] O campo está no formato correto: `[{"label":"...", "value":"..."}]`?
- [ ] O `conversation_stage` está correto: `"collecting_passengers"`?

**Como verificar:**
```bash
# Olhe os logs do backend quando a pergunta sobre passageiros é feita
# Procure por: "button_options"
```

**JSON esperado:**
```json
{
  "conversation_stage": "collecting_passengers",
  "button_options": [
    {"label": "1 adulto", "value": "1"},
    {"label": "2 adultos", "value": "2"},
    {"label": "3 adultos", "value": "3"},
    {"label": "4 adultos", "value": "4"}
  ],
  ...
}
```

### 2. WebSocket - Transmissão
- [ ] O WebSocket está enviando o JSON completo?
- [ ] O campo `button_options` está chegando no frontend?

**Como verificar:**
```javascript
// No console do navegador (F12), aba Network > WS
// Procure pela mensagem do tipo "chatResponse"
// Verifique se button_options está presente
```

### 3. Frontend - Hook useJsonSocketConnection
- [ ] O hook está extraindo `button_options` corretamente?
- [ ] Linha 105: `buttonOptions: response.jsonData?.button_options`

**Como verificar:**
```javascript
// No console do navegador, adicione um log temporário:
console.log('Button options:', response.jsonData?.button_options);
```

### 4. Frontend - Estado da Mensagem
- [ ] A mensagem do assistente tem `buttonOptions` populado?
- [ ] `message.buttonOptions` é um array com elementos?

**Como verificar:**
```javascript
// No ChatPageV2.tsx, adicione log temporário na linha 370:
console.log('Message:', message);
console.log('Button options:', message.buttonOptions);
console.log('Show buttons:', showButtons);
```

### 5. Frontend - Renderização
- [ ] A condição `showButtons` está true?
- [ ] O componente `ChatButtons` está sendo renderizado?
- [ ] Os botões aparecem na tela?

**Condição para mostrar botões (linha 370):**
```typescript
const showButtons = isLastMessage && 
                    message.role === 'assistant' && 
                    message.buttonOptions && 
                    message.buttonOptions.length > 0;
```

## Problemas Comuns

### Problema 1: Botões não aparecem
**Causa:** LLM não está gerando `button_options`
**Solução:** Verificar logs do backend, reiniciar servidor

### Problema 2: Stage volta para collecting_origin
**Causa:** LLM não entende que deve manter o stage durante coleta de passageiros
**Solução:** Já corrigido no prompt com instruções explícitas

### Problema 3: Botões aparecem mas não funcionam
**Causa:** `handleButtonClick` não está funcionando
**Solução:** Verificar se a função está enviando a mensagem corretamente

### Problema 4: ConversationStage não reconhecido
**Causa:** Tipo TypeScript não inclui `collecting_passengers`
**Solução:** Já corrigido em `app/src/types/json-chat.ts`

## Teste Manual Rápido

1. Abra o chat
2. Digite origem: "Brasília"
3. Digite orçamento: "5000"
4. **VERIFIQUE:** Botões devem aparecer automaticamente
5. Se não aparecerem:
   - Abra F12 > Console
   - Procure por erros
   - Verifique Network > WS > última mensagem
   - Procure por `button_options` no JSON

## Logs Úteis

### Backend (NestJS)
```bash
# Procure por estas linhas nos logs:
[ChatbotService] JSON response: {...}
# Verifique se button_options está presente
```

### Frontend (Browser Console)
```javascript
// Adicione temporariamente no useJsonSocketConnection.ts linha 105:
console.log('📦 Response:', response);
console.log('🔘 Button options:', response.jsonData?.button_options);
```

## Status Atual

✅ Prompt atualizado com instruções claras sobre button_options
✅ Prompt corrigido para manter stage durante coleta de passageiros
✅ Frontend preparado para receber e renderizar botões
✅ Tipo ConversationStage atualizado com collecting_passengers
⏳ Aguardando teste manual para confirmar funcionamento

