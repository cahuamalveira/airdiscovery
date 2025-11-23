import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { PassengerData } from '../../types/booking';

interface PassengerDetailsSectionProps {
  passengers: PassengerData[];
}

const PassengerDetailsSection: React.FC<PassengerDetailsSectionProps> = React.memo(({ passengers }) => {
  // Format birth date in pt-BR format (DD/MM/YYYY)
  const formatBirthDate = (dateString: string): string => {
    // Parse date as UTC to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  return (
    <Box
      data-testid="passenger-details-section"
      className="MuiBox-root"
      sx={{ mb: 4 }}
    >
      {/* Section Title */}
      <Typography
        variant="h5"
        component="h2"
        sx={{
          fontWeight: 'bold',
          color: '#212121',
          mb: 3,
        }}
      >
        Detalhes dos Passageiros
      </Typography>

      {/* Empty state */}
      {passengers.length === 0 && (
        <Typography
          variant="body1"
          sx={{ color: '#757575', textAlign: 'center', py: 4 }}
        >
          Nenhum passageiro encontrado
        </Typography>
      )}

      {/* Passenger Accordions */}
      {passengers.map((passenger, index) => (
        <Accordion
          key={index}
          data-testid={`passenger-card-${index}`}
          sx={{
            mb: 2,
            '&:before': {
              display: 'none',
            },
            boxShadow: 1,
            borderRadius: 1,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`passenger-${index}-content`}
            id={`passenger-${index}-header`}
            sx={{
              '&.Mui-expanded': {
                minHeight: 48,
              },
              '& .MuiAccordionSummary-content': {
                my: 1.5,
              },
            }}
          >
            <Typography
              variant="h6"
              component="h3"
              sx={{ fontWeight: 'medium', color: '#212121' }}
            >
              Passageiro {index + 1}: {passenger.firstName} {passenger.lastName}
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 0, pb: 3 }}>
            <Grid container spacing={2}>
              {/* Document */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#757575', display: 'block', mb: 0.5 }}
                >
                  Documento
                </Typography>
                <Typography variant="body1" sx={{ color: '#212121' }}>
                  {passenger.document}
                </Typography>
              </Grid>

              {/* Birth Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#757575', display: 'block', mb: 0.5 }}
                >
                  Data de Nascimento
                </Typography>
                <Typography variant="body1" sx={{ color: '#212121' }}>
                  {formatBirthDate(passenger.birthDate)}
                </Typography>
              </Grid>

              {/* Email */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#757575', display: 'block', mb: 0.5 }}
                >
                  E-mail
                </Typography>
                <Typography variant="body1" sx={{ color: '#212121' }}>
                  {passenger.email}
                </Typography>
              </Grid>

              {/* Phone */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#757575', display: 'block', mb: 0.5 }}
                >
                  Telefone
                </Typography>
                <Typography variant="body1" sx={{ color: '#212121' }}>
                  {passenger.phone}
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
});

PassengerDetailsSection.displayName = 'PassengerDetailsSection';

export default PassengerDetailsSection;
