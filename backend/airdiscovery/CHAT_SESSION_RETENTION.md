# Configuração de Retenção de Sessões de Chat

## 📋 **Resumo das Alterações**

Implementado um sistema de retenção de sessões por 30 dias, em vez de deletar as sessões imediatamente após a desconexão do usuário.

## 🔄 **Mudanças Implementadas**

### 1. TTL do DynamoDB - 30 Dias
**Arquivo**: `src/modules/chatbot/repositories/chat-session.repository.ts`
- **Antes**: TTL fixo de 24 horas
- **Depois**: TTL configurável de 30 dias (padrão)
- **Configuração**: Variável de ambiente `CHAT_SESSION_TTL_DAYS` (padrão: 30)

### 2. Comportamento de Desconexão
**Arquivo**: `src/modules/chatbot/chatbot.gateway.ts`
- **Antes**: `handleDisconnect` deletava a sessão completamente
- **Depois**: `handleDisconnect` apenas remove os dados do socket
- **Resultado**: Sessões permanecem disponíveis para reconexão por 30 dias

### 3. Limpeza Manual de Sessões
**Arquivo**: `src/modules/chatbot/repositories/chat-session.repository.ts`
- **Método**: `cleanupExpiredSessions`
- **Antes**: Padrão de 24 horas
- **Depois**: Usa o valor configurado (30 dias por padrão)

## ⚙️ **Configuração**

### Variável de Ambiente
```bash
CHAT_SESSION_TTL_DAYS=30  # Padrão: 30 dias
```

### Como Funciona
1. **Sessão Criada**: TTL definido para `CHAT_SESSION_TTL_DAYS` dias no futuro
2. **Usuário Desconecta**: Socket limpo, sessão preservada
3. **Usuário Reconecta**: Sessão recuperada se ainda dentro do TTL
4. **Expiração**: DynamoDB remove automaticamente após o TTL

## 🔍 **Impacto nas Funcionalidades**

### ✅ Recuperação de Sessões
- Usuários podem retomar conversas após desconexão
- Histórico de mensagens preservado
- Dados coletados mantidos

### ✅ Gestão de Memória
- TTL automático do DynamoDB remove sessões antigas
- Limpeza manual disponível como backup
- Configuração flexível por ambiente

### ✅ Experiência do Usuário
- Não perde progresso ao fechar o navegador
- Pode continuar conversas em dispositivos diferentes
- Sessões antigas expiram automaticamente

## 🎯 **Casos de Uso**

1. **Perda de Conexão**: Usuário pode voltar e continuar
2. **Troca de Dispositivo**: Mesma sessão em diferentes dispositivos
3. **Pause/Resume**: Interromper e retomar conversas
4. **Histórico**: Acesso a conversas dos últimos 30 dias

## 🚀 **Próximos Passos**

Para ativar completamente o sistema:
1. Definir `CHAT_SESSION_TTL_DAYS` no ambiente
2. Reiniciar o serviço para aplicar as configurações
3. Testar recuperação de sessões
4. Monitorar uso de armazenamento no DynamoDB