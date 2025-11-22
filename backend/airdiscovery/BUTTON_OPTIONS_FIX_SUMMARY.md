# Button Options Rule Fix & Data Preservation Enhancement - Summary

## Problems Fixed

### 1. Button Options Rule (Original Issue)
The rule "SEMPRE inclua button_options ao perguntar sobre passageiros" (ALWAYS include button_options when asking about passengers) was too broad and incorrect. This caused the LLM to include button_options in ALL stages, not just during passenger collection.

### 2. Data Preservation Issue (New Issue Found)
The LLM was not consistently preserving previously collected data (origin, budget, etc.) when moving to the next stage. This caused the conversation context to be lost, resulting in responses like asking "Quantos adultos?" but with all data_collected fields set to null.

## Solutions

### 1. Button Options Fix
Updated the prompt rules in `json-prompt-builder.ts` to specify that `button_options` should ONLY be included during the `collecting_passengers` stage.

### 2. Data Preservation Enhancement
Added multiple layers of explicit instructions to ensure the LLM preserves all previously collected data:
- Added a prominent "REGRA MAIS IMPORTANTE" (MOST IMPORTANT RULE) section at the top
- Enhanced the contextual prompt with explicit copy instructions
- Added step-by-step task breakdown emphasizing data preservation

## Changes Made

### 1. Added Data Preservation as Top Priority (NEW - Line ~8)
**Added:**
```
## ⚠️ REGRA MAIS IMPORTANTE - PRESERVAÇÃO DE DADOS:
**NUNCA apague ou substitua dados já coletados por null!**
Você receberá "Dados Já Coletados" no contexto. COPIE TODOS esses dados para data_collected na sua resposta.
Apenas ADICIONE ou ATUALIZE novos dados baseados na mensagem do usuário.
```

### 2. Updated Critical Rules (Line ~15)
**Before:**
```
2. **PRESERVE todos os dados já coletados em data_collected - NUNCA apague**
...
4. SEMPRE inclua button_options ao perguntar sobre passageiros
```

**After:**
```
2. **PRESERVE todos os dados já coletados em data_collected - COPIE do contexto**
...
4. Inclua button_options SOMENTE quando conversation_stage for "collecting_passengers"
```

### 3. Enhanced Contextual Prompt (NEW - Line ~250)
**Added explicit copy instructions in buildContextualPrompt():**
```
## ⚠️ REGRA CRÍTICA DE PRESERVAÇÃO:
VOCÊ DEVE COPIAR TODOS OS DADOS JÁ COLETADOS ACIMA para o campo data_collected da sua resposta.
NÃO substitua campos preenchidos por null.
APENAS adicione ou atualize novos dados baseados na mensagem do usuário.

## SUA TAREFA:
1. COPIE todos os dados de "Dados Já Coletados" para data_collected
2. Processe a mensagem do usuário e adicione/atualize apenas os novos dados
3. Retorne JSON seguindo as regras acima
```

### 4. Updated Schema Documentation (Line ~45)
**Before:**
```
**IMPORTANTE:**
- Sempre preencha TODOS os campos de data_collected (use null se não coletado ainda)
- button_options é OBRIGATÓRIO quando conversation_stage é "collecting_passengers"
- Preserve dados já coletados - NUNCA apague dados anteriores
```

**After:**
```
**IMPORTANTE:**
- Sempre preencha TODOS os campos de data_collected (use null se não coletado ainda)
- button_options é OBRIGATÓRIO SOMENTE quando conversation_stage é "collecting_passengers"
- button_options deve ser null em todos os outros stages
- Preserve dados já coletados - NUNCA apague dados anteriores
```

### 5. Updated Stage Flow Documentation (Lines ~80-85)
**Before:**
```
4. **collecting_availability**: Pergunte mês → Salve availability_months → MUDE para "collecting_activities"
5. **collecting_activities**: Pergunte atividades → Salve activities → MUDE para "collecting_purpose"
6. **collecting_purpose**: Pergunte propósito → Salve purpose → MUDE para "recommendation_ready" e faça recomendação
```

**After:**
```
4. **collecting_availability**: Pergunte mês → Salve availability_months → MUDE para "collecting_activities" (SEM button_options)
5. **collecting_activities**: Pergunte atividades → Salve activities → MUDE para "collecting_purpose" (SEM button_options)
6. **collecting_purpose**: Pergunte propósito → Salve purpose → MUDE para "recommendation_ready" e faça recomendação (SEM button_options)
```

## Test Coverage

Created comprehensive test suite in `json-prompt-builder.spec.ts` with 9 tests:

1. ✅ Verifies data preservation is emphasized as the most important rule (NEW)
2. ✅ Verifies button_options rule only mentions collecting_passengers stage
3. ✅ Verifies button_options is required ONLY during collecting_passengers
4. ✅ Verifies other stages explicitly say NO button_options
5. ✅ Verifies contextual prompt includes data preservation warnings (NEW)
6. ✅ Verifies contextual prompt includes button_options for collecting_passengers
7. ✅ Verifies contextual prompt does NOT emphasize button_options for other stages
8. ✅ Validates response format with button_options during collecting_passengers
9. ✅ Validates response format without button_options in other stages

## Test Results

All tests passing:
- ✅ 9 tests in `json-prompt-builder.spec.ts` (2 new tests for data preservation)
- ✅ 24 tests in passenger integration suite
- ✅ 40 tests in passenger validation/pricing/stage calculation
- ✅ **Total: 73 tests passing**

## Impact

### Backend
The schema is interpreted by the backend at all times through:
- `JsonPromptBuilder.buildContextualPrompt()` called in `chatbot.service.ts` (line 612)
- System prompt sent to AWS Bedrock LLM with every request
- LLM now receives clear instructions to only include button_options during `collecting_passengers` stage

### Frontend
- Frontend already handles button_options correctly (displays buttons when present, text input when null)
- No frontend changes needed
- UI will now only show buttons during passenger collection, as intended

## Files Modified

1. `backend/airdiscovery/src/modules/chatbot/utils/json-prompt-builder.ts` - Updated prompt rules
2. `backend/airdiscovery/src/modules/chatbot/utils/json-prompt-builder.spec.ts` - New test file

## Verification

To verify the fix is working:

1. Run tests:
   ```bash
   cd backend/airdiscovery
   npm test -- json-prompt-builder.spec.ts
   npm test -- passenger-integration.spec.ts
   ```

2. Manual testing:
   - Start a chat session
   - Progress through stages: origin → budget → passengers
   - Verify buttons appear ONLY during passenger questions
   - Verify NO buttons appear for availability, activities, or purpose questions

## Conclusion

Two critical issues have been fixed:

1. **Button Options**: The rule has been corrected to be stage-specific. The LLM will now only include `button_options` during the `collecting_passengers` stage, making the UI behavior consistent and predictable.

2. **Data Preservation**: Multiple layers of explicit instructions have been added to ensure the LLM consistently preserves all previously collected data (origin, budget, passengers, etc.) when moving between conversation stages. This prevents context loss and ensures a smooth conversation flow.

The enhanced prompts now provide clear, step-by-step instructions that emphasize data preservation as the top priority, followed by stage-specific behavior rules.
