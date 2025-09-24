import React from 'react';
import { useJsonChat, useJsonChatProgress, useJsonChatFormatters } from '../hooks/useJsonChat';
import { JsonChatInterfaceProps } from '../types/json-chat';

/**
 * Exemplo de componente de chat usando a nova estrutura JSON
 */
export const JsonChatInterface: React.FC<JsonChatInterfaceProps> = ({
  isOpen,
  onClose,
  user
}) => {
  // Hook principal do chat JSON
  const {
    state,
    sendMessage,
    resetChat,
    isReady,
    recommendation,
    progress
  } = useJsonChat({
    isOpen,
    user,
    socket: null // Será passado via contexto ou props
  });

  // Hooks auxiliares
  const progressInfo = useJsonChatProgress(state);
  const formatters = useJsonChatFormatters();

  // Handlers
  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      sendMessage(content.trim());
    }
  };

  const handleReset = () => {
    resetChat();
  };

  if (!isOpen) return null;

  return (
    <div className="json-chat-interface">
      {/* Header com progresso */}
      <div className="chat-header">
        <h3>AIR Discovery - Chat Inteligente</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress.percentage}%` }}
          />
          <span className="progress-text">
            {formatters.formatProgress(progress.current, progress.total)} - {progress.percentage}%
          </span>
        </div>
        <div className="stage-info">
          {progressInfo.stageDescription}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="messages-container">
        {state.messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
            
            {/* Debug info para mensagens do assistant */}
            {message.role === 'assistant' && message.jsonData && (
              <div className="message-debug">
                <small>
                  Estágio: {message.jsonData.conversation_stage} | 
                  Próxima pergunta: {message.jsonData.next_question_key || 'N/A'}
                </small>
              </div>
            )}
          </div>
        ))}

        {/* Indicador de digitação */}
        {state.isTyping && (
          <div className="typing-indicator">
            AIR Discovery está digitando...
          </div>
        )}
      </div>

      {/* Dados coletados (debug) */}
      <div className="collected-data-panel">
        <h4>Dados Coletados:</h4>
        <div className="data-grid">
          <div className="data-item">
            <label>Origem:</label>
            <span>
              {state.collectedData.origin_name ? 
                `${state.collectedData.origin_name} (${state.collectedData.origin_iata})` : 
                'Não informado'
              }
            </span>
          </div>
          
          <div className="data-item">
            <label>Orçamento:</label>
            <span>{formatters.formatBudget(state.collectedData.budget_in_brl)}</span>
          </div>
          
          <div className="data-item">
            <label>Atividades:</label>
            <span>{formatters.formatActivities(state.collectedData.activities)}</span>
          </div>
          
          <div className="data-item">
            <label>Propósito:</label>
            <span>{state.collectedData.purpose || 'Não informado'}</span>
          </div>
          
          {state.collectedData.hobbies && (
            <div className="data-item">
              <label>Hobbies:</label>
              <span>{formatters.formatActivities(state.collectedData.hobbies)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recomendação final */}
      {recommendation && (
        <div className="recommendation-panel">
          <h4>🎉 Sua Recomendação:</h4>
          <div className="recommendation-content">
            <div className="destination">
              <strong>{recommendation.destination.name}</strong>
              <span className="iata-code">({recommendation.destination.iata})</span>
            </div>
            <div className="recommendation-details">
              <p>Saindo de: {recommendation.origin.name} ({recommendation.origin.iata})</p>
              <p>Orçamento: {formatters.formatBudget(recommendation.budget)}</p>
              <p>Atividades: {formatters.formatActivities(recommendation.activities)}</p>
              {recommendation.purpose && (
                <p>Propósito: {recommendation.purpose}</p>
              )}
            </div>
            <div className="recommendation-reason">
              {recommendation.recommendationReason}
            </div>
          </div>
        </div>
      )}

      {/* Input de mensagem */}
      {!state.isComplete && (
        <div className="message-input-container">
          <MessageInput
            onSend={handleSendMessage}
            disabled={!isReady || state.isTyping}
            placeholder={progressInfo.nextStep || 'Digite sua mensagem...'}
          />
        </div>
      )}

      {/* Controles */}
      <div className="chat-controls">
        {state.isComplete && (
          <button 
            className="btn-primary"
            onClick={() => {
              // Navegar para página de reservas com a recomendação
              if (recommendation) {
                console.log('Navegar para reservas:', recommendation);
              }
            }}
          >
            Ver Opções de Voo
          </button>
        )}
        
        <button 
          className="btn-secondary" 
          onClick={handleReset}
          disabled={!isReady}
        >
          Recomeçar Chat
        </button>
        
        <button className="btn-close" onClick={onClose}>
          Fechar
        </button>
      </div>

      {/* Status e erros */}
      <div className="chat-status">
        {!state.isConnected && <span className="status-error">Desconectado</span>}
        {state.error && <span className="status-error">Erro: {state.error}</span>}
        {!isReady && !state.error && <span className="status-warning">Conectando...</span>}
      </div>
    </div>
  );
};

/**
 * Componente de input para mensagens
 */
interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Digite sua mensagem...'
}) => {
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="message-textarea"
        rows={1}
      />
      <button 
        type="submit" 
        disabled={disabled || !message.trim()}
        className="send-button"
      >
        Enviar
      </button>
    </form>
  );
};

export default JsonChatInterface;