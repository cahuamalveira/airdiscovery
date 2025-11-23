import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material';
import { Flight as FlightIcon } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { BookingResponseDto } from '../../types/booking';

interface FlightDetails {
  flightNumber: string;
  departureCode: string;
  arrivalCode: string;
  departureDateTime: string;
  arrivalDateTime: string;
  airline?: string;
}

interface BoardingPassCardProps {
  booking: BookingResponseDto;
  flight: FlightDetails;
}

const BoardingPassCard: React.FC<BoardingPassCardProps> = React.memo(({ booking, flight }) => {
  // Format time in pt-BR locale (HH:MM)
  const formatTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(date);
  };

  // Format date in pt-BR locale (DD/MM/YYYY)
  const formatDate = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Generate locator from booking ID (first 9 chars uppercase)
  const locator = booking.id.substring(0, 9).toUpperCase().replace(/-/g, '');

  // Generate QR code data
  const qrCodeData = JSON.stringify({
    bookingId: booking.id,
    locator: locator,
    type: 'boarding_pass',
    passengerCount: booking.passengers.length,
  });

  return (
    <Card
      data-testid="boarding-pass-card"
      aria-label="Cartão de embarque"
      sx={{
        maxWidth: { xs: '100%', sm: 700, md: 900 },
        margin: '0 auto',
        borderRadius: { xs: 1, sm: 2 },
        boxShadow: { xs: 2, sm: 3 },
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Blue accent bar with airplane icon */}
          <Box
            data-testid="boarding-pass-accent-bar"
            sx={{
              bgcolor: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 60, md: 400 },
              flexDirection: { xs: 'row', md: 'column' },
              width: { xs: '100%', md: '8%' },
              flexShrink: 0,
            }}
          >
            <FlightIcon
              data-testid="airplane-icon"
              sx={{
                color: 'white',
                fontSize: { xs: 32, sm: 36, md: 40 },
                transform: { xs: 'rotate(0deg)', md: 'rotate(90deg)' },
              }}
            />
          </Box>

          {/* Main content area */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: { xs: 2, md: 3 },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 },
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 'bold',
                    color: '#212121',
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                  }}
                >
                  SEU CARTÃO DE EMBARQUE
                </Typography>
                {flight.airline && (
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      fontWeight: 'bold',
                      color: '#1976d2',
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                    }}
                  >
                    {flight.airline.toUpperCase()}
                  </Typography>
                )}
              </Box>

              {/* Flight Route - Origin and Destination */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: { xs: 2, md: 3 },
                  gap: { xs: 1, sm: 2 },
                }}
              >
                {/* Departure */}
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 'bold',
                      color: '#212121',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    {flight.departureCode}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      mt: { xs: 0.5, md: 1 },
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    }}
                  >
                    {formatTime(flight.departureDateTime)}
                  </Typography>
                </Box>

                {/* Arrow */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#757575',
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    }}
                  >
                    →
                  </Typography>
                </Box>

                {/* Arrival */}
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 'bold',
                      color: '#212121',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    {flight.arrivalCode}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      mt: { xs: 0.5, md: 1 },
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    }}
                  >
                    {formatTime(flight.arrivalDateTime)}
                  </Typography>
                </Box>
              </Box>

              {/* Flight Number and Date */}
              <Box sx={{ mb: { xs: 2, md: 3 } }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#757575',
                    mb: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  VOO: {flight.flightNumber.replace('-', ' • ')}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#757575',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  DATA: {formatDate(flight.departureDateTime)}
                </Typography>
              </Box>

              {/* Booking Locator */}
              <Box sx={{ mb: { xs: 2, md: 3 } }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#757575',
                    mb: 0.5,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  LOCALIZADOR:
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: '#212121',
                    letterSpacing: { xs: 1, sm: 2 },
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                  }}
                >
                  {locator}
                </Typography>
              </Box>

              {/* Passenger List */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#757575',
                    mb: 1,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  PASSAGEIROS:
                </Typography>
                {booking.passengers.map((passenger, index) => (
                  <Typography
                    key={index}
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      color: '#212121',
                      mb: 0.5,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      wordBreak: 'break-word',
                    }}
                  >
                    {`${passenger.firstName} ${passenger.lastName}`.toUpperCase()}
                  </Typography>
                ))}
              </Box>
          </Box>

          {/* QR Code Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 2, sm: 2.5, md: 3 },
              borderLeft: { xs: 0, md: 1 },
              borderTop: { xs: 1, md: 0 },
              borderColor: 'divider',
              minHeight: { xs: 'auto', md: 400 },
              width: { xs: '100%', md: '25%' },
              flexShrink: 0,
            }}
          >
            <Box
              data-testid="boarding-pass-qr-code"
              aria-label="Código QR do embarque"
              role="img"
              sx={{
                textAlign: 'center',
                width: '100%',
                maxWidth: { xs: 180, sm: 200, md: 150 },
              }}
            >
              <QRCodeSVG
                value={qrCodeData}
                size={150}
                level="M"
                style={{ width: '100%', height: 'auto', maxWidth: '150px' }}
                title="Código QR do embarque"
              />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1,
                  color: '#757575',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                }}
              >
                Código de Embarque
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

BoardingPassCard.displayName = 'BoardingPassCard';

export default BoardingPassCard;
