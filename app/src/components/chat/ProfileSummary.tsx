import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  useTheme,
  Divider,
} from '@mui/material';
import {
  FlightTakeoff as FlightIcon,
  LocationOn as LocationIcon,
  AttachMoney as BudgetIcon,
  Sports as ActivityIcon,
  Psychology as PurposeIcon,
  Favorite as HobbyIcon,
  Recommend as RecommendationIcon,
  Psychology,
} from '@mui/icons-material';
import { ChatSession, UserProfile } from '../../hooks/useWebSocketChat';

interface ProfileSummaryProps {
  session: ChatSession | null;
  showRecommendation?: boolean;
}

const ProfileField: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
};

const formatBudget = (budget: number): string => {
  if (budget === 0) return 'Não informado';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(budget / 100); // Convert from cents
};

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({
  session,
  showRecommendation = true,
}) => {
  const theme = useTheme();

  if (!session || !session.profileData) {
    return null;
  }

  const profile = session.profileData;
  const hasRecommendation = session.recommendedDestination && session.interviewComplete;

  return (
    <Paper
      elevation={1}
      sx={{
        padding: 2,
        mb: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology fontSize="small" />
        Perfil do Viajante
      </Typography>

      <Grid container spacing={2}>
        {/* Origem */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ProfileField
            icon={<LocationIcon color="primary" fontSize="small" />}
            label="Origem"
          >
            <Typography variant="body1">
              {profile.origin || 'Não informado'}
            </Typography>
          </ProfileField>
        </Grid>

        {/* Orçamento */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ProfileField
            icon={<BudgetIcon color="primary" fontSize="small" />}
            label="Orçamento"
          >
            <Typography variant="body1">
              {formatBudget(profile.budget)}
            </Typography>
          </ProfileField>
        </Grid>

        {/* Propósito da viagem */}
        <Grid size={{ xs: 12 }}>
          <ProfileField
            icon={<PurposeIcon color="primary" fontSize="small" />}
            label="Propósito da Viagem"
          >
            <Typography variant="body1">
              {profile.purpose || 'Não informado'}
            </Typography>
          </ProfileField>
        </Grid>

        {/* Atividades */}
        {profile.activities && profile.activities.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <ProfileField
              icon={<ActivityIcon color="primary" fontSize="small" />}
              label="Atividades Preferidas"
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.activities.map((activity, index) => (
                  <Chip
                    key={index}
                    label={activity}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </ProfileField>
          </Grid>
        )}

        {/* Hobbies */}
        {profile.hobbies && profile.hobbies.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <ProfileField
              icon={<HobbyIcon color="primary" fontSize="small" />}
              label="Hobbies e Interesses"
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.hobbies.map((hobby, index) => (
                  <Chip
                    key={index}
                    label={hobby}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                ))}
              </Box>
            </ProfileField>
          </Grid>
        )}
      </Grid>

      {/* Recomendação de Destino */}
      {showRecommendation && hasRecommendation && (
        <>
          <Divider sx={{ my: 2 }} />
          <Card
            elevation={2}
            sx={{
              bgcolor: theme.palette.success.light + '10',
              border: `1px solid ${theme.palette.success.light}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <RecommendationIcon color="success" />
                <Typography variant="h6" color="success.main">
                  Destino Recomendado
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlightIcon color="success" fontSize="large" />
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {session.recommendedDestination}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Com base em suas preferências, este é o destino perfeito para você!
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
    </Paper>
  );
};