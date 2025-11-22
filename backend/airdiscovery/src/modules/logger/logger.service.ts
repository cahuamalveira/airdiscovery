import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';
import { createLoggerConfig } from './logger.config';

/**
 * Context object for structured logging
 */
export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  bookingId?: string;
  module?: string;
  function?: string;
  [key: string]: any;
}

/**
 * LoggerService
 * Provides structured async logging using Pino with NestJS integration
 * Implements NestLoggerService interface to replace default NestJS logger
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: PinoLogger;
  private context?: LogContext;

  constructor() {
    const config = createLoggerConfig();
    this.logger = pino(config);
  }

  /**
   * Create a child logger with bound context
   * Useful for adding module-specific or request-specific context
   */
  child(context: LogContext): LoggerService {
    const childService = new LoggerService();
    childService.logger = this.logger.child(context);
    childService.context = { ...this.context, ...context };
    return childService;
  }

  /**
   * Log debug-level message
   * Use for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.mergeContext(context), message);
  }

  /**
   * Log info-level message
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(this.mergeContext(context), message);
  }

  /**
   * Log warning-level message
   * Use for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.mergeContext(context), message);
  }

  /**
   * Log error-level message
   * Use for error events that might still allow the application to continue
   */
  error(message: string, error?: Error, context?: LogContext): void;
  error(message: string, trace?: string, context?: string): void;
  error(message: string, errorOrTrace?: Error | string, contextOrString?: LogContext | string): void {
    let error: Error | undefined;
    let context: LogContext = {};

    // Handle overloaded signatures
    if (errorOrTrace instanceof Error) {
      error = errorOrTrace;
      context = (contextOrString as LogContext) || {};
    } else if (typeof errorOrTrace === 'string') {
      // NestJS logger interface compatibility (trace as string)
      context = { trace: errorOrTrace };
      if (typeof contextOrString === 'string') {
        context.context = contextOrString;
      }
    }

    const logContext = this.mergeContext(context);
    if (error) {
      logContext.err = error;
    }

    this.logger.error(logContext, message);
  }

  /**
   * Log fatal-level message
   * Use for severe error events that will presumably lead the application to abort
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    const logContext = this.mergeContext(context);
    if (error) {
      logContext.err = error;
    }
    this.logger.fatal(logContext, message);
  }

  /**
   * Log verbose-level message (maps to debug)
   * Provided for NestJS logger interface compatibility
   */
  verbose(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  /**
   * Log message (maps to info)
   * Provided for NestJS logger interface compatibility
   */
  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  /**
   * Flush buffered logs
   * Should be called during graceful shutdown to ensure all logs are written
   */
  async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.flush((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Merge instance context with provided context
   */
  private mergeContext(context?: LogContext): LogContext {
    if (!context && !this.context) {
      return {};
    }
    return { ...this.context, ...context };
  }
}
