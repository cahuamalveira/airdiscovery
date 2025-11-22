import { Module } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { AmadeusClientService } from '../../common/amadeus/amadeus-client.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [DestinationsController],
  providers: [DestinationsService, AmadeusClientService],
})
export class DestinationsModule {}
