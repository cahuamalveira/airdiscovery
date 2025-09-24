import React from 'react';
import {
  Fab,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ChatInterface: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleOpenChat = () => {
    navigate('/chat');
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleOpenChat}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          '&:hover': {
            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            transform: 'scale(1.1)',
          },
          transition: 'transform 0.2s ease-in-out',
          boxShadow: 3
        }}
      >
        <ChatIcon />
      </Fab>
    </>
  );
};

export default ChatInterface;
