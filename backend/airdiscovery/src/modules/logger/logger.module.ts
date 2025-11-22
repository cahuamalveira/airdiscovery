import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Logger Module
 * Provides structured logging capabilities throughout the application
 * Marked as @Global to make LoggerService available in all modules without explicit imports
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
