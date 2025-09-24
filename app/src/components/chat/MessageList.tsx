import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { ChatMessage } from '../../hooks/useWebSocketChat';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamContent: string;
}

const MessageBubble: React.FC<{
  message: ChatMessage;
  isStreaming?: boolean;
  streamContent?: string;
}> = ({ message, isStreaming = false, streamContent = '' }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const displayContent = isStreaming ? streamContent : message.content;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
          width: 32,
          height: 32,
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
      </Avatar>
      
      <Paper
        elevation={1}
        sx={{
          maxWidth: '70%',
          padding: 2,
          bgcolor: isUser ? theme.palette.primary.light : theme.palette.grey[100],
          color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
          borderRadius: 2,
          '&::after': isUser ? {
            content: '""',
            position: 'absolute',
            right: -8,
            top: 16,
            width: 0,
            height: 0,
            borderLeft: `8px solid ${theme.palette.primary.light}`,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
          } : {
            content: '""',
            position: 'absolute',
            left: -8,
            top: 16,
            width: 0,
            height: 0,
            borderRight: `8px solid ${theme.palette.grey[100]}`,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
          },
          position: 'relative',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {displayContent}
          {isStreaming && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: 2,
                height: 16,
                bgcolor: 'currentColor',
                ml: 0.5,
                animation: 'blink 1s infinite',
                '@keyframes blink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0 },
                },
              }}
            />
          )}
        </Typography>
        
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            opacity: 0.7,
            fontSize: '0.75rem',
          }}
        >
          {message?.timestamp ? new Date(message.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

const StreamingIndicator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: theme.palette.secondary.main,
          width: 32,
          height: 32,
        }}
      >
        <BotIcon fontSize="small" />
      </Avatar>
      
      <Paper
        elevation={1}
        sx={{
          padding: 2,
          bgcolor: theme.palette.grey[100],
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          O assistente está digitando...
        </Typography>
      </Paper>
    </Box>
  );
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  currentStreamContent,
}) => {
  // Deduplicate messages and filter out empty ones
  const processMessages = (msgs: ChatMessage[]): ChatMessage[] => {
    const seen = new Set<string>();
    return msgs.filter(message => {
      if (!message.content.trim()) return false;
      
      // Create a unique key based on role and content
      const key = `${message.role}:${message.content.trim()}`;
      
      if (seen.has(key)) {
        console.log('🔄 UI-level duplicate message filtered:', {
          role: message.role,
          content: message.content.substring(0, 50) + '...'
        });
        return false;
      }
      
      seen.add(key);
      return true;
    });
  };

  const filteredMessages = processMessages(messages);
  
  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {filteredMessages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {isStreaming && currentStreamContent && currentStreamContent.trim() && (
        <MessageBubble
          message={{
            id: 'streaming',
            role: 'assistant',
            content: currentStreamContent,
            timestamp: new Date(),
          }}
          isStreaming={true}
          streamContent={currentStreamContent}
        />
      )}
      
      {isStreaming && (!currentStreamContent || !currentStreamContent.trim()) && <StreamingIndicator />}
    </Box>
  );
};