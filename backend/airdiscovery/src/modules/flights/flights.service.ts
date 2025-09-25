import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFlightDto } from './dto/create-flight.dto';
import { CreateFlightFromOfferDto } from './dto/create-flight-from-offer.dto';
import { UpdateFlightDto } from './dto/update-flight.dto';
import { Repository } from 'typeorm';
import { Flight } from './entities/flight.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FlightsService {
  constructor(@InjectRepository(Flight)  private readonly flightRepository: Repository<Flight>) {}

  create(createFlightDto: CreateFlightDto) {
    const flight = this.flightRepository.create(createFlightDto);
    this.flightRepository.save(flight);

    return flight;
  }

  findAll() {
    return this.flightRepository.find();
  }

  findOne(id: string) {
    return this.flightRepository.findOne({ where: { id} });
  }

  update(id: string, updateFlightDto: UpdateFlightDto) {
    return this.flightRepository.update(id, updateFlightDto);
  }

  remove(id: string) {
    return this.flightRepository.delete(id);
  }

  /**
   * Creates a Flight entity from Amadeus offer data
   * Used when user selects a flight for booking
   */
  async createFlightFromOffer(createFlightFromOfferDto: CreateFlightFromOfferDto): Promise<Flight> {
    const { amadeusOfferId, offerPayload } = createFlightFromOfferDto;

    // Check if flight with this amadeusOfferId already exists
    const existingFlight = await this.flightRepository.findOne({
      where: { amadeusOfferId }
    });

    if (existingFlight) {
      return existingFlight;
    }

    // Extract flight details from Amadeus payload
    const firstItinerary = offerPayload.itineraries?.[0];
    const firstSegment = firstItinerary?.segments?.[0];
    const lastSegment = firstItinerary?.segments?.[firstItinerary.segments.length - 1];

    const flight = this.flightRepository.create({
      amadeusOfferId,
      amadeusOfferPayload: offerPayload,
      flightNumber: firstSegment?.number || 'N/A',
      departureCode: firstSegment?.departure?.iataCode || 'N/A',
      arrivalCode: lastSegment?.arrival?.iataCode || 'N/A',
      departureDateTime: new Date(firstSegment?.departure?.at || Date.now()),
      arrivalDateTime: new Date(lastSegment?.arrival?.at || Date.now()),
      priceTotal: parseFloat(offerPayload.price?.grandTotal || '0'),
      currency: offerPayload.price?.currency || 'USD',
    });

    return await this.flightRepository.save(flight);
  }

  /**
   * Finds a Flight by its internal UUID
   * Used in checkout to get complete flight context
   */
  async findFlightById(flightId: string): Promise<Flight> {
    const flight = await this.flightRepository.findOne({
      where: { id: flightId }
    });

    if (!flight) {
      throw new NotFoundException(`Flight with ID ${flightId} not found`);
    }

    return flight;
  }
}
