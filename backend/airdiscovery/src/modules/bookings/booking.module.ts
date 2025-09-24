import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';

/**
 * BookingModule - Módulo de reservas
 * 
 * Gerencia todas as funcionalidades relacionadas a reservas de voos:
 * - Criação e gerenciamento de reservas
 * - Integração com sistema de pagamentos
 * - Validação de dados de passageiros
 * - Controle de status das reservas
 * 
 * Segue padrões da AirDiscovery: Clean Architecture + NestJS + TypeORM
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking])
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService], // Exportar para uso em outros módulos (pagamentos, email, etc.)
})
export class BookingModule {}