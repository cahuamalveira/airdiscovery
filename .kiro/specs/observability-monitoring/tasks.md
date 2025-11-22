# Implementation Plan

- [x] 1. Install dependencies and configure environment
  - Install pino, @sentry/node, @opentelemetry/* packages
  - Add environment variables to .env.example
  - Update package.json with new dependencies
  - _Requirements: 1.1, 2.3, 3.2_

- [x] 2. Create Logger Module infrastructure
- [x] 2.1 Create logger module and configuration
  - Create src/modules/logger/logger.module.ts with global scope
  - Create src/modules/logger/logger.config.ts with Pino configuration factory
  - Configure log levels, redaction paths, and base fields
  - _Requirements: 1.1, 1.3, 6.1, 6.2, 6.3_

- [x] 2.2 Implement LoggerService with Pino integration
  - Create src/modules/logger/logger.service.ts
  - Implement debug, info, warn, error, fatal methods
  - Implement child logger creation with bound context
  - Implement flush method for graceful shutdown
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2.3 Create redaction utility for sensitive data
  - Create src/modules/logger/utils/redaction.util.ts
  - Implement redaction for payment fields (cardNumber, cvv, cardDetails)
  - Implement redaction for auth fields (password, token, secret, apiKey)
  - Implement environment-aware PII redaction (email, phone)
  - Add configurable redaction pattern support
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Update application bootstrap for basic logging





- [x] 3.1 Initialize logger in main.ts


  - Replace default NestJS logger with custom LoggerService
  - Remove existing debug middleware for /flights/from-offer
  - _Requirements: 1.5_

- [x] 3.2 Update AppModule to import logger globally


  - Import LoggerModule in app.module.ts with global scope
  - Verify logger is available for injection in all modules
  - _Requirements: 1.1_

- [x] 4. Migrate console.log statements to LoggerService






- [x] 4.1 Update destinations module

  - Inject LoggerService in destinations.service.ts
  - Replace console.log with logger.debug for Amadeus search results
  - Add contextual information (search parameters, result count)
  - _Requirements: 1.5, 4.2, 4.5_

- [x] 4.2 Update chatbot module - json-response-parser


  - Inject LoggerService in json-response-parser.ts (convert to injectable class)
  - Replace 10 console.log/console.error statements with appropriate log levels
  - Add session context to log entries
  - _Requirements: 1.5, 4.2, 4.3_


- [x] 4.3 Update chatbot module - chatbot.service

  - Inject LoggerService in chatbot.service.ts
  - Replace console.log with logger.debug for Bedrock prompts
  - Add session ID and user ID to log context
  - _Requirements: 1.5, 4.3_


- [x] 4.4 Update chatbot module - chatbot.gateway

  - Inject LoggerService in chatbot.gateway.ts
  - Replace 2 console.log statements with logger.debug
  - Add WebSocket connection context to logs
  - _Requirements: 1.5, 4.3_

- [x] 4.5 Verify console.log migration


  - Search codebase for remaining console.log statements
  - Verify all modules use LoggerService
  - Test application functionality after migration
  - _Requirements: 1.5_

- [x] 5. Add contextual logging to critical operations





- [x] 5.1 Add logging to booking operations


  - Update booking.service.ts to log booking creation
  - Include booking ID and flight details in log context
  - Log booking status changes
  - _Requirements: 4.4_


- [x] 5.2 Add logging to external API calls

  - Update amadeus-client.service.ts to log API requests
  - Log request parameters and response status
  - Record API response times
  - Update Stripe service to log payment operations
  - _Requirements: 4.5, 6.3_

- [ ] 6. Create request context middleware
  - Create src/common/middlewares/request-context.middleware.ts
  - Generate unique request ID (UUID) for each request
  - Extract or create trace context from headers
  - Store context in AsyncLocalStorage
  - Inject request ID into response headers
  - Apply middleware globally in main.ts
  - _Requirements: 4.1_

- [ ] 7. Create logger interceptor for HTTP logging
  - Create src/common/interceptors/logger.interceptor.ts
  - Log incoming requests (method, URL, headers, body with redaction)
  - Log outgoing responses (status, duration, body size)
  - Log errors with full stack trace
  - Apply interceptor globally in main.ts
  - _Requirements: 4.2, 4.5_

- [ ] 8. Create OpenTelemetry Module
- [ ] 8.1 Create telemetry module and service
  - Create src/modules/telemetry/telemetry.module.ts
  - Create src/modules/telemetry/telemetry.service.ts
  - Implement OpenTelemetry SDK initialization
  - Configure console exporter for initial testing
  - _Requirements: 3.1, 3.2_

- [ ] 8.2 Configure auto-instrumentation
  - Add HTTP instrumentation for incoming/outgoing requests
  - Add PostgreSQL instrumentation via TypeORM
  - Add Redis instrumentation via ioredis
  - Add AWS SDK instrumentation
  - _Requirements: 3.5_

- [ ] 8.3 Implement trace context propagation
  - Configure W3C Trace Context propagation
  - Implement getTracer and startSpan methods
  - Add graceful shutdown method
  - _Requirements: 3.3, 3.4_

- [ ] 8.4 Initialize OpenTelemetry in main.ts
  - Initialize OpenTelemetry before NestJS app creation
  - Import TelemetryModule in app.module.ts
  - Add SIGTERM handler to shutdown OpenTelemetry
  - _Requirements: 3.2_

- [ ] 8.5 Add performance monitoring spans
  - Add OpenTelemetry spans to flight search operations
  - Add spans to booking creation operations
  - Add spans to Amadeus API calls
  - Record operation duration and outcome
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Create Sentry transport with buffering
- [ ] 9.1 Implement buffered Sentry transport
  - Create src/modules/logger/transports/sentry.transport.ts
  - Implement in-memory buffer with size limit (50 entries)
  - Implement time-based flushing (30 seconds)
  - Implement immediate sending for error/fatal level logs
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 9.2 Add retry logic and error handling
  - Implement exponential backoff retry (max 3 attempts)
  - Add error handling for failed Sentry transmissions
  - Implement graceful shutdown with buffer flush
  - _Requirements: 2.4, 2.5_

- [ ] 9.3 Configure Sentry as OpenTelemetry exporter
  - Update telemetry.service.ts to use Sentry as trace exporter
  - Configure Sentry DSN and environment
  - Add SIGTERM handler to flush logs
  - _Requirements: 3.2, 2.5_

- [ ] 9.4 Configure environment-specific settings
  - Update .env.example with all logging/telemetry variables
  - Document LOG_LEVEL options (debug for dev, info for prod)
  - Document Sentry configuration (DSN, environment, sample rate)
  - Document OpenTelemetry configuration
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Verify implementation
- [ ] 10.1 Test logger functionality
  - Verify all log levels work correctly
  - Verify child logger context propagation
  - Verify flush behavior on shutdown
  - Verify redaction of sensitive data
  - _Requirements: 1.1, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.2 Test OpenTelemetry integration
  - Verify trace context propagation across requests
  - Verify auto-instrumentation of HTTP, DB, Redis
  - Verify manual spans for custom operations
  - _Requirements: 3.1, 3.4, 3.5_

- [ ] 10.3 Test Sentry integration
  - Verify logs appear in Sentry dashboard
  - Verify buffering behavior (50 entries or 30 seconds)
  - Verify immediate sending of error-level logs
  - Verify retry logic on transmission failures
  - Verify traces appear in Sentry performance monitoring
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
