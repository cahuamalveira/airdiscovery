import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { 
  CreateBookingDto, 
  UpdateBookingDto, 
  BookingQueryDto, 
  BookingResponseDto 
} from './dto/booking.dto';

/**
 * BookingController - Controlador REST para gerenciar reservas
 * 
 * Endpoints:
 * - POST /bookings - Criar reserva
 * - GET /bookings/:id - Buscar reserva por ID
 * - GET /bookings - Listar reservas com filtros
 * - PATCH /bookings/:id - Atualizar reserva
 * - DELETE /bookings/:id - Cancelar reserva
 * 
 * Todos os endpoints exigem autenticação via JWT
 * Segue padrões REST e Clean Architecture
 */
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Criar nova reserva
   * POST /api/bookings
   */
  @Post()
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: BookingResponseDto;
  }> {
    const userId = req.user?.sub || req.user?.id;
    
    const booking = await this.bookingService.create(createBookingDto, userId);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Reserva criada com sucesso',
      data: booking,
    };
  }

  /**
   * Buscar reserva por ID
   * GET /api/bookings/:id
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: BookingResponseDto;
  }> {
    const userId = req.user?.sub || req.user?.id;
    
    const booking = await this.bookingService.findById(id, userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva encontrada',
      data: booking,
    };
  }

  /**
   * Listar reservas do usuário com filtros
   * GET /api/bookings
   */
  @Get()
  async findMany(
    @Query() queryDto: BookingQueryDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: BookingResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const userId = req.user?.sub || req.user?.id;
    
    const result = await this.bookingService.findMany(queryDto, userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Reservas encontradas',
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Atualizar reserva
   * PATCH /api/bookings/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: BookingResponseDto;
  }> {
    const userId = req.user?.sub || req.user?.id;
    
    const booking = await this.bookingService.update(id, updateBookingDto, userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva atualizada com sucesso',
      data: booking,
    };
  }

  /**
   * Cancelar reserva
   * DELETE /api/bookings/:id
   */
  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: BookingResponseDto;
  }> {
    const userId = req.user?.sub || req.user?.id;
    
    const booking = await this.bookingService.cancel(id, userId, body.reason);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva cancelada com sucesso',
      data: booking,
    };
  }

  /**
   * Confirmar pagamento (endpoint interno - usado pelos webhooks)
   * PATCH /api/bookings/:id/confirm-payment
   */
  @Patch(':id/confirm-payment')
  async confirmPayment(
    @Param('id') id: string,
    @Body() paymentData: {
      paymentId: string;
      transactionId?: string;
    },
  ): Promise<{
    statusCode: number;
    message: string;
    data: BookingResponseDto;
  }> {
    const booking = await this.bookingService.confirmPayment(id, paymentData);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Pagamento confirmado com sucesso',
      data: booking,
    };
  }
}