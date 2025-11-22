import { LoggerOptions } from 'pino';

/**
 * Pino logger configuration factory
 * Provides environment-aware configuration for structured logging
 */
export const createLoggerConfig = (): LoggerOptions => {
  const environment = process.env.SENTRY_ENVIRONMENT || 'development';
  const logLevel = process.env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug');
  const prettyPrint = process.env.LOG_PRETTY === 'true';

  return {
    level: logLevel,

    // Pretty print in development for better readability
    transport: prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

    // Base fields included in every log entry
    base: {
      service: process.env.OTEL_SERVICE_NAME || 'airdiscovery-backend',
      version: process.env.OTEL_SERVICE_VERSION || '0.0.1',
      environment,
    },

    // ISO 8601 timestamp format
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

    // Redaction configuration for sensitive data
    redact: {
      paths: [
        // Authentication fields
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'apiKey',
        'authorization',
        // Payment fields
        'cardNumber',
        'cvv',
        'cardDetails',
        'paymentMethod.card',
        // Nested patterns
        '*.password',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
        '*.secret',
        '*.apiKey',
        '*.cardNumber',
        '*.cvv',
        '*.authorization',
        // Request headers
        'req.headers.authorization',
        'req.headers.cookie',
        'request.headers.authorization',
        'request.headers.cookie',
      ],
      censor: '[REDACTED]',
    },

    // Serialize errors properly
    serializers: {
      err: (err: Error) => ({
        type: err.name,
        message: err.message,
        stack: err.stack,
      }),
      error: (err: Error) => ({
        type: err.name,
        message: err.message,
        stack: err.stack,
      }),
    },
  };
};
