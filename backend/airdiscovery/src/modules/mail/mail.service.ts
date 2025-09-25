import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { BookingResponseDto } from '../bookings/dto/booking.dto';

/**
 * Interface para dados de template de email
 */
interface EmailTemplateData {
  passengerName: string;
  bookingId: string;
  flightDetails: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    airline: string;
    flightNumber: string;
  };
  totalAmount: string;
  paymentMethod: string;
  confirmationUrl: string;
}

/**
 * MailService - Serviço para envio de emails
 * 
 * Funcionalidades:
 * - Envio de confirmação de reserva
 * - Templates HTML responsivos
 * - Integração com AWS SES
 * - Logs estruturados
 * 
 * Segue padrões da AirDiscovery: Clean Architecture + AWS SDK v3
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Configurar cliente SES
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    
    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    this.fromEmail = this.configService.get<string>('SES_FROM_EMAIL') || 'your-verified-email@gmail.com';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Enviar email de confirmação de reserva
   */
  async sendBookingConfirmation(booking: BookingResponseDto): Promise<void> {
    try {
      this.logger.log(`Enviando email de confirmação para reserva ${booking.id}`);

      // Verificar se estamos em ambiente de desenvolvimento sem SES configurado
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const hasValidSESConfig = this.configService.get<string>('AWS_ACCESS_KEY_ID') && 
                               this.configService.get<string>('AWS_SECRET_ACCESS_KEY') &&
                               this.configService.get<string>('SES_FROM_EMAIL');

      if (isDevelopment && !hasValidSESConfig) {
        this.logger.warn('SES não configurado - simulando envio de email em desenvolvimento');
        this.logEmailContent(booking);
        return;
      }

      // Preparar dados do template
      const templateData = this.prepareTemplateData(booking);

      // Gerar HTML do email
      const htmlContent = this.generateBookingConfirmationHTML(templateData);

      // Gerar texto plano alternativo
      const textContent = this.generateBookingConfirmationText(templateData);

      // Configurar comando SES
      const sendEmailCommand = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
    ToAddresses: [booking.passengers[0].email],
        },
        Message: {
          Subject: {
            Data: `✈️ Confirmação de Reserva - Voo ${templateData.flightDetails.flightNumber}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textContent,
              Charset: 'UTF-8',
            },
          },
        },
        Tags: [
          {
            Name: 'EmailType',
            Value: 'BookingConfirmation',
          },
          {
            Name: 'BookingId',
            Value: booking.id,
          },
        ],
      });

      // Enviar email
      const result = await this.sesClient.send(sendEmailCommand);
      
      this.logger.log(
        `Email de confirmação enviado com sucesso para ${booking.passengers[0].email}. MessageId: ${result.MessageId}`
      );

    } catch (error) {
      this.logger.error(
        `Erro ao enviar email de confirmação para reserva ${booking.id}:`,
        error
      );
      
      // Não rejeitar a promise para não quebrar o fluxo principal
      // O pagamento já foi confirmado, o email é secundário
    }
  }

  /**
   * Log do conteúdo do email para desenvolvimento (quando SES não está configurado)
   */
  private logEmailContent(booking: BookingResponseDto): void {
    const templateData = this.prepareTemplateData(booking);
    
    this.logger.log('='.repeat(80));
    this.logger.log('📧 EMAIL DE CONFIRMAÇÃO (MODO DESENVOLVIMENTO)');
    this.logger.log('='.repeat(80));
  this.logger.log(`Para: ${booking.passengers[0].email}`);
    this.logger.log(`Assunto: ✈️ Confirmação de Reserva - Voo ${templateData.flightDetails.flightNumber}`);
    this.logger.log(`Passageiro: ${templateData.passengerName}`);
    this.logger.log(`Reserva: ${templateData.bookingId}`);
    this.logger.log(`Voo: ${templateData.flightDetails.departureCity} → ${templateData.flightDetails.arrivalCity}`);
    this.logger.log(`Data: ${templateData.flightDetails.departureDate}`);
    this.logger.log(`Valor: ${templateData.totalAmount}`);
    this.logger.log(`Link: ${templateData.confirmationUrl}`);
    this.logger.log('='.repeat(80));
  }

  /**
   * Preparar dados do template
   */
  private prepareTemplateData(booking: BookingResponseDto): EmailTemplateData {
    // Use flightInfo and first passenger for email template
    const flight = booking.flightInfo!;
    const departureDateTime = new Date(flight.departureDateTime);
    const arrivalDateTime = new Date(flight.arrivalDateTime);
    const passenger = booking.passengers[0];
    return {
      passengerName: `${passenger.firstName} ${passenger.lastName}`,
      bookingId: booking.id,
      flightDetails: {
        departureCity: '',
        arrivalCity: '',
        departureDate: departureDateTime.toLocaleDateString('pt-BR'),
        departureTime: departureDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        arrivalTime: arrivalDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        airline: '',
        flightNumber: flight.flightNumber,
      },
      totalAmount: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: booking.currency,
      }).format(booking.totalAmount / 100),
      paymentMethod: 'Pix',
      confirmationUrl: `${this.frontendUrl}/confirmation/${booking.id}`,
    };
  }

  /**
   * Gerar HTML do email de confirmação
   */
  private generateBookingConfirmationHTML(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Reserva - AirDiscovery</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      background-color: #f8f9fa; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .content { padding: 30px; }
    .booking-card { 
      background-color: #f8f9fa; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 20px 0; 
      border-left: 4px solid #1976d2; 
    }
    .flight-info { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin: 15px 0; 
      padding: 15px; 
      background-color: white; 
      border-radius: 6px; 
      border: 1px solid #e0e0e0; 
    }
    .flight-time { text-align: center; }
    .flight-time .time { font-size: 24px; font-weight: bold; color: #1976d2; }
    .flight-time .airport { font-size: 14px; color: #666; margin-top: 5px; }
    .flight-arrow { 
      font-size: 20px; 
      color: #1976d2; 
      margin: 0 15px; 
    }
    .info-row { 
      display: flex; 
      justify-content: space-between; 
      margin: 10px 0; 
      padding: 8px 0; 
      border-bottom: 1px solid #f0f0f0; 
    }
    .info-label { font-weight: 600; color: #666; }
    .info-value { color: #333; }
    .total-amount { 
      background-color: #e8f5e8; 
      padding: 15px; 
      border-radius: 6px; 
      margin: 20px 0; 
      text-align: center; 
    }
    .total-amount .label { font-size: 16px; color: #666; }
    .total-amount .amount { font-size: 28px; font-weight: bold; color: #2e7d32; }
    .cta-button { 
      background-color: #1976d2; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 20px 0; 
      font-weight: 600; 
    }
    .footer { 
      background-color: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      border-top: 1px solid #e0e0e0; 
      font-size: 14px; 
      color: #666; 
    }
    .footer a { color: #1976d2; text-decoration: none; }
    .success-badge { 
      background-color: #4caf50; 
      color: white; 
      padding: 5px 15px; 
      border-radius: 20px; 
      font-size: 14px; 
      font-weight: 600; 
      display: inline-block; 
      margin-bottom: 15px; 
    }
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 20px; }
      .flight-info { flex-direction: column; text-align: center; }
      .flight-arrow { transform: rotate(90deg); margin: 10px 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>✈️ Reserva Confirmada!</h1>
      <p>Sua viagem está confirmada e pronta para decolar</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="success-badge">✓ PAGAMENTO APROVADO</div>
      
      <p>Olá <strong>${data.passengerName}</strong>,</p>
      
      <p>Parabéns! Sua reserva foi confirmada com sucesso. Abaixo estão os detalhes da sua viagem:</p>

      <!-- Booking Details -->
      <div class="booking-card">
        <h3>Detalhes da Reserva</h3>
        
        <div class="info-row">
          <span class="info-label">Código da Reserva:</span>
          <span class="info-value"><strong>${data.bookingId}</strong></span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Passageiro:</span>
          <span class="info-value">${data.passengerName}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Data do Voo:</span>
          <span class="info-value">${data.flightDetails.departureDate}</span>
        </div>
      </div>

      <!-- Flight Info -->
      <div class="flight-info">
        <div class="flight-time">
          <div class="time">${data.flightDetails.departureTime}</div>
          <div class="airport">${data.flightDetails.departureCity}</div>
        </div>
        
        <div class="flight-arrow">✈️</div>
        
        <div class="flight-time">
          <div class="time">${data.flightDetails.arrivalTime}</div>
          <div class="airport">${data.flightDetails.arrivalCity}</div>
        </div>
      </div>

      <!-- Flight Details -->
      <div class="booking-card">
        <h3>Informações do Voo</h3>
        
        <div class="info-row">
          <span class="info-label">Voo:</span>
          <span class="info-value">${data.flightDetails.flightNumber}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Companhia Aérea:</span>
          <span class="info-value">${data.flightDetails.airline}</span>
        </div>
      </div>

      <!-- Payment Info -->
      <div class="total-amount">
        <div class="label">Total Pago</div>
        <div class="amount">${data.totalAmount}</div>
        <div style="font-size: 14px; margin-top: 5px;">via ${data.paymentMethod}</div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${data.confirmationUrl}" class="cta-button">Ver Detalhes da Reserva</a>
      </div>

      <!-- Important Notes -->
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <h4 style="color: #856404; margin-bottom: 10px;">📋 Importante:</h4>
        <ul style="margin-left: 20px; color: #856404;">
          <li>Chegue ao aeroporto com 2 horas de antecedência para voos domésticos</li>
          <li>Apresente um documento com foto válido para embarque</li>
          <li>Consulte as políticas de bagagem da companhia aérea</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Este email foi enviado pela <strong>AirDiscovery</strong></p>
      <p>Dúvidas? Entre em contato conosco</p>
      <p style="margin-top: 10px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} AirDiscovery. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Gerar texto plano do email de confirmação
   */
  private generateBookingConfirmationText(data: EmailTemplateData): string {
    return `
RESERVA CONFIRMADA - AIRDISCOVERY

Olá ${data.passengerName},

Parabéns! Sua reserva foi confirmada com sucesso.

DETALHES DA RESERVA
=====================
Código da Reserva: ${data.bookingId}
Passageiro: ${data.passengerName}
Data do Voo: ${data.flightDetails.departureDate}

INFORMAÇÕES DO VOO
==================
Partida: ${data.flightDetails.departureTime} - ${data.flightDetails.departureCity}
Chegada: ${data.flightDetails.arrivalTime} - ${data.flightDetails.arrivalCity}
Voo: ${data.flightDetails.flightNumber}
Companhia Aérea: ${data.flightDetails.airline}

PAGAMENTO
=========
Total Pago: ${data.totalAmount} (via ${data.paymentMethod})
Status: APROVADO

IMPORTANTE
==========
- Chegue ao aeroporto com 2 horas de antecedência para voos domésticos
- Apresente um documento com foto válido para embarque
- Consulte as políticas de bagagem da companhia aérea

Ver detalhes completos: ${data.confirmationUrl}

Dúvidas? Entre em contato conosco através da plataforma.

© ${new Date().getFullYear()} AirDiscovery. Todos os direitos reservados.
`;
  }
}