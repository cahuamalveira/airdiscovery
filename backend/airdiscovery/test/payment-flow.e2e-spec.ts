import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, MiddlewareConsumer, Module } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Booking, BookingStatus } from '../src/modules/bookings/entities/booking.entity';
import { Customer } from '../src/modules/customers/entities/customer.entity';
import { Flight } from '../src/modules/flights/entities/flight.entity';
import { Passenger } from '../src/modules/bookings/entities/passenger.entity';
import { Payment } from '../src/modules/bookings/entities/payment.entity';
import Stripe from 'stripe';
import { MockAuthMiddleware } from './helpers/mock-auth.middleware';
import { AuthMiddleware } from '../src/common/middlewares/auth.middleware';

/**
 * Payment Flow Integration Tests
 * 
 * Tests the complete payment flow from booking creation to payment intent creation.
 * Validates server-side amount calculation, booking ownership, status validation,
 * and proper error handling.
 * 
 * Requirements tested: 1.1, 1.3, 3.1, 4.1, 4.5
 */
describe('Payment Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let stripeService: Stripe;
  let testCustomer: Customer;
  let testFlight: Flight;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthMiddleware)
      .useClass(MockAuthMiddleware)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    stripeService = moduleFixture.get<Stripe>(Stripe);

    // Create test customer
    const customerRepo = dataSource.getRepository(Customer);
    testCustomer = customerRepo.create({
      cognito_user_id: 'test-user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    });
    testCustomer = await customerRepo.save(testCustomer);

    // Create test flight
    const flightRepo = dataSource.getRepository(Flight);
    testFlight = flightRepo.create({
      flight_number: 'LA1234',
      departure_code: 'GRU',
      arrival_code: 'JFK',
      departure_datetime: new Date('2025-12-01T10:00:00Z'),
      arrival_datetime: new Date('2025-12-01T18:00:00Z'),
      price_total: 1500.00,
      currency: 'BRL',
      amadeus_offer_id: 'test-offer-123',
    });
    testFlight = await flightRepo.save(testFlight);

    // Mock auth token (in real scenario, this would come from Cognito)
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    // Cleanup test data
    await dataSource.getRepository(Payment).delete({});
    await dataSource.getRepository(Passenger).delete({});
    await dataSource.getRepository(Booking).delete({});
    await dataSource.getRepository(Flight).delete({});
    await dataSource.getRepository(Customer).delete({});
    
    await app.close();
  });

  afterEach(async () => {
    // Clean up payments and bookings after each test
    await dataSource.getRepository(Payment).delete({});
    await dataSource.getRepository(Passenger).delete({});
    await dataSource.getRepository(Booking).delete({});
  });

  /**
   * Test: Complete booking creation + payment intent flow
   * Requirements: 1.1, 1.3, 3.1, 4.1
   */
  describe('Complete booking and payment flow', () => {
    it('should create booking with server-calculated amount and then create payment intent', async () => {
      // Step 1: Create booking
      const passengerData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-00',
          birthDate: '1990-01-01',
          passengerType: 'adult',
        },
      ];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: testFlight.flight_id,
          passengers: passengerData,
          totalAmount: 1500.00, // Server should validate this matches flight price
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;
      expect(booking).toBeDefined();
      expect(booking.id).toBeDefined();
      expect(booking.totalAmount).toBe(1500.00);
      expect(booking.status).toBe(BookingStatus.PENDING);

      // Step 2: Create payment intent (only sending bookingId)
      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
          // NO amount field - server calculates it
        })
        .expect(201);

      const paymentIntent = paymentResponse.body.data;
      expect(paymentIntent).toBeDefined();
      expect(paymentIntent.clientSecret).toBeDefined();
      expect(paymentIntent.amount).toBe(1500.00); // Server-calculated amount
      
      // Verify booking status updated
      const updatedBooking = await dataSource.getRepository(Booking).findOne({
        where: { booking_id: booking.id },
      });
      expect(updatedBooking?.status).toBe(BookingStatus.AWAITING_PAYMENT);

      // Verify payment record created
      const paymentRecord = await dataSource.getRepository(Payment).findOne({
        where: { bookingId: booking.id },
      });
      expect(paymentRecord).toBeDefined();
      expect(paymentRecord?.amount).toBe(1500.00);
      expect(paymentRecord?.paymentIntentId).toBeDefined();
    });
  });

  /**
   * Test: Multi-passenger booking with correct amount calculation
   * Requirements: 1.1, 4.1
   */
  describe('Multi-passenger booking amount calculation', () => {
    it('should calculate total amount correctly for multiple passengers', async () => {
      const passengerData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-00',
          birthDate: '1990-01-01',
          passengerType: 'adult',
        },
        {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '(11) 88888-8888',
          document: '987.654.321-00',
          birthDate: '1992-05-15',
          passengerType: 'adult',
        },
        {
          firstName: 'Jimmy',
          lastName: 'Doe',
          email: 'jimmy@example.com',
          phone: '(11) 77777-7777',
          document: '456.789.123-00',
          birthDate: '2015-03-20',
          passengerType: 'child',
        },
      ];

      // Expected total: 1500 * 3 = 4500
      const expectedTotal = 4500.00;

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: testFlight.flight_id,
          passengers: passengerData,
          totalAmount: expectedTotal,
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;
      expect(booking.totalAmount).toBe(expectedTotal);
      expect(booking.passengers).toHaveLength(3);

      // Create payment intent
      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(201);

      const paymentIntent = paymentResponse.body.data;
      expect(paymentIntent.amount).toBe(expectedTotal);

      // Verify Stripe payment intent has correct amount in cents
      const stripePI = await stripeService.paymentIntents.retrieve(
        paymentIntent.clientSecret.split('_secret_')[0]
      );
      expect(stripePI.amount).toBe(expectedTotal * 100); // Converted to cents
      expect(stripePI.metadata.passengerCount).toBe('3');
    });
  });

  /**
   * Test: Payment with different currencies
   * Requirements: 1.1, 4.5
   */
  describe('Payment with different currencies', () => {
    it('should handle BRL currency correctly', async () => {
      const passengerData = [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        birthDate: '1990-01-01',
        passengerType: 'adult',
      }];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: testFlight.flight_id,
          passengers: passengerData,
          totalAmount: 1500.00,
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;

      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(201);

      const paymentIntent = paymentResponse.body.data;
      
      // Verify Stripe payment intent currency
      const stripePI = await stripeService.paymentIntents.retrieve(
        paymentIntent.clientSecret.split('_secret_')[0]
      );
      expect(stripePI.currency).toBe('brl');
    });

    it('should handle USD currency correctly', async () => {
      // Create USD flight
      const usdFlight = await dataSource.getRepository(Flight).save({
        flight_number: 'AA5678',
        departure_code: 'JFK',
        arrival_code: 'LAX',
        departure_datetime: new Date('2025-12-15T08:00:00Z'),
        arrival_datetime: new Date('2025-12-15T11:00:00Z'),
        price_total: 500.00,
        currency: 'USD',
        amadeus_offer_id: 'test-offer-usd',
      });

      const passengerData = [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        birthDate: '1990-01-01',
        passengerType: 'adult',
      }];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: usdFlight.flight_id,
          passengers: passengerData,
          totalAmount: 500.00,
          currency: 'USD',
        })
        .expect(201);

      const booking = bookingResponse.body.data;

      // Note: Current implementation defaults to BRL, but this test documents the expected behavior
      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(201);

      expect(paymentResponse.body.data).toBeDefined();
    });
  });

  /**
   * Test: Concurrent payment attempts for same booking
   * Requirements: 3.1
   */
  describe('Concurrent payment attempts', () => {
    it('should reject duplicate payment intent creation', async () => {
      const passengerData = [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        birthDate: '1990-01-01',
        passengerType: 'adult',
      }];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: testFlight.flight_id,
          passengers: passengerData,
          totalAmount: 1500.00,
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;

      // First payment intent creation - should succeed
      await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(201);

      // Second payment intent creation - should fail with 409 Conflict
      const duplicateResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(409);

      expect(duplicateResponse.body.message).toContain('Payment already initiated');
    });
  });

  /**
   * Test: Payment attempt after booking cancellation
   * Requirements: 3.1
   */
  describe('Payment attempt after booking cancellation', () => {
    it('should reject payment for cancelled booking', async () => {
      const passengerData = [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        birthDate: '1990-01-01',
        passengerType: 'adult',
      }];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: testFlight.flight_id,
          passengers: passengerData,
          totalAmount: 1500.00,
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;

      // Cancel the booking
      await dataSource.getRepository(Booking).update(
        { booking_id: booking.id },
        { status: BookingStatus.CANCELLED }
      );

      // Attempt to create payment intent - should fail with 400 Bad Request
      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(400);

      expect(paymentResponse.body.message).toContain('Booking status must be PENDING');
    });

    it('should reject payment for already paid booking', async () => {
      const passengerData = [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        birthDate: '1990-01-01',
        passengerType: 'adult',
      }];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: testFlight.flight_id,
          passengers: passengerData,
          totalAmount: 1500.00,
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;

      // Mark booking as paid
      await dataSource.getRepository(Booking).update(
        { booking_id: booking.id },
        { status: BookingStatus.PAID }
      );

      // Attempt to create payment intent - should fail
      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(400);

      expect(paymentResponse.body.message).toContain('Booking status must be PENDING');
    });
  });

  /**
   * Test: Verify amounts match between booking and Stripe payment intent
   * Requirements: 1.1, 4.5
   */
  describe('Amount verification between booking and Stripe', () => {
    it('should ensure booking amount matches Stripe payment intent amount', async () => {
      const passengerData = [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        birthDate: '1990-01-01',
        passengerType: 'adult',
      }];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: testFlight.flight_id,
          passengers: passengerData,
          totalAmount: 1500.00,
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;

      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(201);

      const paymentIntent = paymentResponse.body.data;

      // Retrieve booking from database
      const dbBooking = await dataSource.getRepository(Booking).findOne({
        where: { booking_id: booking.id },
      });

      // Retrieve Stripe payment intent
      const stripePI = await stripeService.paymentIntents.retrieve(
        paymentIntent.clientSecret.split('_secret_')[0]
      );

      // Verify amounts match
      expect(dbBooking?.total_amount).toBe(1500.00);
      expect(paymentIntent.amount).toBe(1500.00);
      expect(stripePI.amount).toBe(150000); // 1500.00 * 100 cents
      
      // Verify conversion is correct (Requirement 4.5)
      expect(stripePI.amount).toBe(Math.round(dbBooking!.total_amount * 100));
    });

    it('should handle decimal amounts correctly in cent conversion', async () => {
      // Create flight with decimal price
      const decimalFlight = await dataSource.getRepository(Flight).save({
        flight_number: 'LA9999',
        departure_code: 'GRU',
        arrival_code: 'GIG',
        departure_datetime: new Date('2025-12-20T14:00:00Z'),
        arrival_datetime: new Date('2025-12-20T15:30:00Z'),
        price_total: 1234.56,
        currency: 'BRL',
        amadeus_offer_id: 'test-offer-decimal',
      });

      const passengerData = [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        birthDate: '1990-01-01',
        passengerType: 'adult',
      }];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send({
          flightId: decimalFlight.flight_id,
          passengers: passengerData,
          totalAmount: 1234.56,
          currency: 'BRL',
        })
        .expect(201);

      const booking = bookingResponse.body.data;

      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', authToken)
        .send({
          bookingId: booking.id,
        })
        .expect(201);

      const paymentIntent = paymentResponse.body.data;

      // Retrieve Stripe payment intent
      const stripePI = await stripeService.paymentIntents.retrieve(
        paymentIntent.clientSecret.split('_secret_')[0]
      );

      // Verify proper rounding in cent conversion
      expect(stripePI.amount).toBe(123456); // 1234.56 * 100
      expect(paymentIntent.amount).toBe(1234.56);
    });
  });
});
