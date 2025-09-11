import React from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { Person, Email, Phone, Business, AdminPanelSettings } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Exemplo de página de perfil do usuário usando o AuthContext integrado
 * Demonstra como aproveitar tanto a interface original quanto os novos recursos
 */
const ProfilePage: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    userAttributes, 
    attributesLoading,
    isAdmin 
  } = useAuth();

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Carregando...</Typography>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Usuário não autenticado</Typography>
      </Container>
    );
  }

  // Extrair informações com fallbacks inteligentes
  const displayName = userAttributes?.name || user?.name || user?.username || 'Usuário';
  const email = userAttributes?.email || user?.email;
  const phoneNumber = userAttributes?.phone_number || user?.phoneNumber;
  const firstName = userAttributes?.given_name;
  const lastName = userAttributes?.family_name;
  const company = userAttributes?.['custom:company'];
  const department = userAttributes?.['custom:department'];
  const role = userAttributes?.['custom:role'];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          Meu Perfil
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Informações Básicas */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Informações Pessoais
                </Typography>
                
                {attributesLoading ? (
                  <Typography variant="body2">Carregando detalhes...</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography>
                        <strong>Nome:</strong> {displayName}
                      </Typography>
                    </Box>

                    {firstName && (
                      <Typography>
                        <strong>Primeiro Nome:</strong> {firstName}
                      </Typography>
                    )}

                    {lastName && (
                      <Typography>
                        <strong>Sobrenome:</strong> {lastName}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography>
                        <strong>Email:</strong> {email}
                      </Typography>
                    </Box>

                    {phoneNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography>
                          <strong>Telefone:</strong> {phoneNumber}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Informações da Conta */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Informações da Conta
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography>
                    <strong>ID do Usuário:</strong> {user?.id}
                  </Typography>
                  
                  <Typography>
                    <strong>Username:</strong> {user?.username}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettings fontSize="small" color={isAdmin ? "error" : "action"} />
                    <Typography>
                      <strong>Tipo:</strong> {isAdmin ? 'Administrador' : 'Usuário'}
                    </Typography>
                  </Box>

                  {user?.groups && user.groups.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Grupos:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {user.groups.map((group) => (
                          <Chip
                            key={group}
                            label={group}
                            size="small"
                            variant="outlined"
                            color={group === 'admins' ? 'error' : 'primary'}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Informações Profissionais (se disponível) */}
          {(company || department || role) && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business fontSize="small" />
                    Informações Profissionais
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {company && (
                      <Grid item xs={12} sm={4}>
                        <Typography>
                          <strong>Empresa:</strong> {company}
                        </Typography>
                      </Grid>
                    )}
                    {department && (
                      <Grid item xs={12} sm={4}>
                        <Typography>
                          <strong>Departamento:</strong> {department}
                        </Typography>
                      </Grid>
                    )}
                    {role && (
                      <Grid item xs={12} sm={4}>
                        <Typography>
                          <strong>Cargo:</strong> {role}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Debug: Todos os Atributos */}
          {userAttributes && Object.keys(userAttributes).length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Todos os Atributos (Debug)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
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
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
