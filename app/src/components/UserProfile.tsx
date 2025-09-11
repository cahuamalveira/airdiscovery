import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { ExitToApp } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente que demonstra como usar o AuthContext integrado com Amplify
 * Mantém compatibilidade total com o código existente
 */
const UserProfile: React.FC = () => {
  const { 
    user, 
    logout, 
    isAuthenticated, 
    userAttributes, 
    attributesLoading 
  } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = () => {
    logout();
  };

  // Lógica para exibir o nome (prioriza atributos do Cognito)
  const displayName = userAttributes?.name || 
                     user?.name || 
                     userAttributes?.email || 
                     user?.email || 
                     user?.username || 
                     'Usuário';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {attributesLoading ? (
        <Typography variant="body2" color="text.secondary">
          Carregando...
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Olá, {displayName}!
        </Typography>
      )}
      <Button
        variant="outlined"
        size="small"
        startIcon={<ExitToApp />}
        onClick={handleSignOut}
        sx={{
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.main',
            color: 'white',
          },
        }}
      >
        Sair
      </Button>
    </Box>
  );
};

export default UserProfile;
