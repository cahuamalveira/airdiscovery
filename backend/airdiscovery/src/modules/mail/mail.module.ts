import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * MailModule - Módulo de envio de emails
 * 
 * Gerencia o envio de emails transacionais:
 * - Confirmação de reservas
 * - Notificações de pagamento
 * - Integração com AWS SES
 * - Templates HTML responsivos
 * 
 * Segue padrões da AirDiscovery: Clean Architecture + AWS SDK v3
 */
@Module({
  providers: [MailService],
  exports: [MailService], // Exportar para uso em outros módulos
})
export class MailModule {}