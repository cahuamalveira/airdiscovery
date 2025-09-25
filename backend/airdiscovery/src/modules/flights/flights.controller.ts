import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Logger, HttpStatus, HttpCode } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { CreateFlightDto } from './dto/create-flight.dto';
import { CreateFlightFromOfferDto } from './dto/create-flight-from-offer.dto';
import { UpdateFlightDto } from './dto/update-flight.dto';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';

@Controller('flights')
export class FlightsController {
  private readonly logger = new Logger(FlightsController.name);

  constructor(private readonly flightsService: FlightsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'agent')
  create(
    @Body() createFlightDto: CreateFlightDto,
    @CurrentUser() user: AuthenticatedRequest['user']
  ) {
    this.logger.log(`Flight creation requested by user: ${user?.username}`);
    return this.flightsService.create(createFlightDto);
  }

  /**
   * Creates a Flight from Amadeus offer data
   * Used when user selects a flight for booking
   */
  @Post('from-offer')
  @HttpCode(HttpStatus.CREATED)
  async createFromOffer(
    @Body() createFlightFromOfferDto: CreateFlightFromOfferDto,
    @CurrentUser() user: AuthenticatedRequest['user']
  ) {
    this.logger.log(`Flight from offer creation requested by user: ${user?.username}`);
    this.logger.debug('Received DTO:', JSON.stringify(createFlightFromOfferDto, null, 2));
    this.logger.debug('DTO amadeusOfferId:', createFlightFromOfferDto.amadeusOfferId);
    this.logger.debug('DTO offerPayload type:', typeof createFlightFromOfferDto.offerPayload);
    
    const flight = await this.flightsService.createFlightFromOffer(createFlightFromOfferDto);
    return { flightId: flight.id };
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedRequest['user']) {
    this.logger.log(`Flights list requested by user: ${user?.username}`);
    return this.flightsService.findAll();
  }

  @Get('my-bookings')
  getMyBookings(@CurrentUser() user: AuthenticatedRequest['user']) {
    this.logger.log(`User bookings requested by: ${user?.username}`);
    return {
      message: 'User bookings retrieved',
      userId: user?.sub,
      bookings: [], // This would come from your actual booking service
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequest['user']
  ) {
    this.logger.log(`Flight ${id} requested by user: ${user?.username}`);
    return this.flightsService.findFlightById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'agent')
  update(
    @Param('id') id: string,
    @Body() updateFlightDto: UpdateFlightDto,
    @CurrentUser() user: AuthenticatedRequest['user']
  ) {
    this.logger.log(`Flight ${id} update requested by user: ${user?.username}`);
    return this.flightsService.update(id, updateFlightDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequest['user']
  ) {
    this.logger.log(`Flight ${id} deletion requested by user: ${user?.username}`);
    return this.flightsService.remove(id);
  }
}
