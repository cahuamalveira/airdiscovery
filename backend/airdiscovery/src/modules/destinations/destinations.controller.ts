import { Body, Controller, Get, Query, Param } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { SearchDestinationDto } from './dto/search-destination.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  /**
   * Busca destinos disponíveis baseado nos critérios de pesquisa
   * Implementa os requisitos RF016 e RF017
   */
  @Get()
  searchDestinations(@Query() queryDTO: SearchDestinationDto) {
    return this.destinationsService.searchDestinations(queryDTO);
  }

  /**
   * Busca aeroportos por palavra-chave
   * Útil para implementar autocomplete no frontend
   */
  @Get('airports')
  searchAirports(@Query('keyword') keyword: string) {
    return this.destinationsService.searchAirports(keyword);
  }
}
