import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Recommend as RecommendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProfileSummary } from './ProfileSummary';
import { ChatSession } from '../../hooks/useWebSocketChat';

interface ProfileModalProps {
  session: ChatSession | null;
  open: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  session,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Verificar se há uma recomendação de destino
  const hasRecommendation = session?.recommendedDestination && session.recommendedDestination.trim() !== '';

  // Função para navegar para recomendações
  const handleNavigateToRecommendations = () => {
    if (!session) return;

    // Criar contexto de viagem com base na sessão atual
    const travelContext = {
      searchParams: {
        destination: session.recommendedDestination || '',
        departureDate: '', // ChatSession não tem datas específicas, usar vazio
        budget: session.profileData?.budget || 0,
        travelers: 1, // Valor padrão
      },
      profile: session.profileData,
      chatMessages: session.messages || [],
      interviewComplete: session.interviewComplete,
      recommendedDestination: session.recommendedDestination,
    };

    // Navegar para a página de recomendações com o contexto
    navigate('/recomendacoes', {
      state: {
        travelContext,
        searchParams: travelContext.searchParams,
        profileData: travelContext.profile,
        chatMessages: travelContext.chatMessages,
        interviewComplete: travelContext.interviewComplete,
      }
    });

    // Fechar o modal após navegar
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          position: fullScreen ? undefined : 'relative',
          transform: fullScreen ? undefined : 'none',
          margin: fullScreen ? 0 : 'auto',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        Resumo do Perfil
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="fechar"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        <ProfileSummary session={session} showRecommendation={true} />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {hasRecommendation && (
          <Button
            onClick={handleNavigateToRecommendations}
            variant="contained"
            color="success"
            startIcon={<RecommendIcon />}
            sx={{ mr: 'auto' }}
          >
            Ver Recomendações
          </Button>
        )}
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};