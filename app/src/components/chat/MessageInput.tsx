import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
} from '@mui/icons-material';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Digite sua mensagem...",
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled || isSubmitting) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    setIsSubmitting(true);

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      // Restore message on error
      setMessage(messageToSend);
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSubmit = message.trim() && !disabled && !isSubmitting;

  return (
    <Paper
      elevation={1}
      sx={{
        padding: 1,
        mt: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
            },
          }}
        />
        
        <IconButton
          type="submit"
          color="primary"
          disabled={!canSubmit}
          sx={{
            mb: 0.5,
            width: 40,
            height: 40,
            bgcolor: canSubmit ? theme.palette.primary.main : 'transparent',
            color: canSubmit ? theme.palette.primary.contrastText : theme.palette.action.disabled,
            '&:hover': {
              bgcolor: canSubmit ? theme.palette.primary.dark : 'transparent',
            },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
    </Paper>
  );
};