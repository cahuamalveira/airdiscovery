import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  CircularProgress,
  Divider
} from '@mui/material';
import { Person, Email, Phone, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente de exemplo que mostra como acessar todos os atributos do usuário
 * usando o AuthContext integrado com Amplify
 */
const UserAttributesExample: React.FC = () => {
  const { 
    user, 
    userAttributes, 
    attributesLoading, 
    isAuthenticated,
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <Card sx={{ maxWidth: 400, margin: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usuário não autenticado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Faça login para ver as informações do usuário.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Extrair informações com fallbacks
  const name = userAttributes?.name || user?.name;
  const email = userAttributes?.email || user?.email;
  const phoneNumber = userAttributes?.phone_number || user?.phoneNumber;

  return (
    <Card sx={{ maxWidth: 400, margin: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountCircle color="primary" />
          Informações do Usuário
        </Typography>

        {attributesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Carregando atributos...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Informações básicas do Cognito */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informações Básicas
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccountCircle fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Username:</strong> {user?.username || 'N/A'}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>User ID:</strong> {user?.id || 'N/A'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Atributos personalizados */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Atributos do Perfil
              </Typography>

              {name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Nome:</strong> {name}
                  </Typography>
                </Box>
              )}

              {email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Email:</strong> {email}
                  </Typography>
                </Box>
              )}

              {phoneNumber && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Telefone:</strong> {phoneNumber}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Todos os atributos disponíveis */}
            {userAttributes && Object.keys(userAttributes).length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Todos os Atributos
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(userAttributes).map(([key, value]) => (
                      value && (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          variant="outlined"
                          size="small"
                        />
                      )
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAttributesExample;
