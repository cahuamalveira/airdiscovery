# Payment Amount Validation - Design

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │         │   Backend    │         │   Stripe    │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ 1. Create Booking     │                        │
       │ POST /bookings        │                        │
       │ {passengers: [...]}   │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │ Calculate:             │
       │                       │ amount = price * N     │
       │                       │ Store in DB            │
       │                       │                        │
       │ 2. Booking Created    │                        │
       │ {id, totalAmount}     │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │ 3. Create Payment     │                        │
       │ POST /payments        │                        │
       │ {bookingId}           │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │ 4. Get Booking         │
       │                       │ SELECT * FROM bookings │
       │                       │ WHERE id = bookingId   │
       │                       │                        │
       │                       │ 5. Create Intent       │
       │                       │ amount = booking.total │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │ 6. Intent Created      │
       │                       │<───────────────────────┤
       │                       │                        │
       │ 7. Payment Intent     │                        │
       │ {clientSecret}        │                        │
       │<──────────────────────┤                        │
       │                       │                        │
```

## Data Flow

### 1. Booking Creation (Already Correct ✅)

**Request:**
```typescript
POST /api/bookings
{
  flightId: string,
  passengers: PassengerData[],
  // NO totalAmount - backend calculates it
}
```

**Backend Logic:**
```typescript
// booking.service.ts
async create(dto: CreateBookingDto, userId: string) {
  const flight = await this.flightRepo.findOne(dto.flightId);
  const passengerCount = dto.passengers.length;
  
  // SERVER-SIDE CALCULATION
  const totalAmount = parseFloat(flight.price) * passengerCount;
  
  const booking = this.bookingRepo.create({
    ...dto,
    userId,
    totalAmount, // Stored in database
    status: 'PENDING'
  });
  
  return await this.bookingRepo.save(booking);
}
```

### 2. Payment Creation (NEEDS FIX ❌)

**Current (Insecure):**
```typescript
POST /api/payments/create-intent
{
  bookingId: string,
  amount: number  // ❌ REMOVE THIS
}
```

**New (Secure):**
```typescript
POST /api/payments/create-intent
{
  bookingId: string  // ✅ Only this
}
```

**Backend Logic:**
```typescript
// stripe.service.ts
async createPaymentIntent(bookingId: string, userId: string) {
  // Requirement 2: Get booking and validate ownership
  const booking = await this.bookingRepo.findOne({
    where: { id: bookingId, userId }
  });
  
  if (!booking) {
    throw new NotFoundException('Booking not found');
  }
  
  // Requirement 3: Validate booking status
  if (booking.status !== 'PENDING') {
    throw new BadRequestException('Booking already processed');
  }
  
  // Requirement 3: Prevent duplicate payments
  if (booking.stripePaymentIntentId) {
    throw new ConflictException('Payment already initiated');
  }
  
  // Requirement 4: Validate amount and passenger count
  if (booking.totalAmount <= 0) {
    throw new BadRequestException('Invalid booking amount');
  }
  
  if (booking.passengers.length === 0) {
    throw new BadRequestException('No passengers in booking');
  }
  
  // Requirement 1: Use stored amount (SERVER TRUTH)
  const amount = booking.totalAmount;
  
  // Requirement 4: Convert to smallest currency unit (cents)
  const amountInCents = Math.round(amount * 100);
  
  // Requirement 6: Create Stripe payment intent with metadata for audit
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: amountInCents,
    currency: booking.currency || 'brl',
    metadata: {
      bookingId: booking.id,
      userId: booking.userId,
      passengerCount: booking.passengers.length
    }
  });
  
  // Requirement 3: Update booking with payment intent and status
  booking.stripePaymentIntentId = paymentIntent.id;
  booking.status = 'AWAITING_PAYMENT';
  await this.bookingRepo.save(booking);
  
  // Requirement 6: Log successful payment intent creation
  this.logger.info('Payment intent created', {
    bookingId: booking.id,
    userId: booking.userId,
    totalAmount: booking.totalAmount,
    passengerCount: booking.passengers.length
  });
  
  // Requirement 5: Return client secret and amount for display
  return {
    clientSecret: paymentIntent.client_secret,
    amount: booking.totalAmount
  };
}
```

## Database Schema

### Booking Entity (Already Correct ✅)

```typescript
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number; // ✅ Source of truth
  
  @Column({ default: 'BRL' })
  currency: string;
  
  @Column({ type: 'jsonb' })
  passengers: PassengerData[];
  
  @Column({ nullable: true })
  stripePaymentIntentId: string;
  
  @Column({ type: 'enum', enum: BookingStatus })
  status: BookingStatus;
}
```

## API Changes

### Remove Amount from Payment Endpoints

**Before:**
```typescript
// ❌ BAD
@Post('create-intent')
async createIntent(@Body() dto: CreatePaymentIntentDto) {
  return this.stripeService.createPaymentIntent(
    dto.bookingId,
    dto.amount // ❌ Trusting frontend
  );
}
```

**After:**
```typescript
// ✅ GOOD - Implements Requirements 2 and 5
@Post('create-intent')
async createIntent(
  @Body() dto: { bookingId: string },
  @Request() req
) {
  // Requirement 5: Accept only bookingId, no amount
  // Requirement 2: Extract userId from JWT for ownership validation
  return this.stripeService.createPaymentIntent(
    dto.bookingId,
    req.user.sub
  );
}
```

## Frontend Changes

### PaymentSection Component

**Before:**
```typescript
// ❌ BAD
<PaymentSection
  bookingId={booking.id}
  amount={flightPrice * passengerCount} // ❌ Frontend calculation
/>
```

**After:**
```typescript
// ✅ GOOD - Implements Requirement 5
<PaymentSection
  bookingId={booking.id}
  // No amount prop - backend calculates and validates it
/>
```

### Payment Hook

**Before:**
```typescript
// ❌ BAD
const createPayment = async (bookingId: string, amount: number) => {
  await api.post('/payments/create-intent', { bookingId, amount });
};
```

**After:**
```typescript
// ✅ GOOD - Implements Requirement 5
const createPayment = async (bookingId: string) => {
  // Only send bookingId, no amount
  const response = await api.post('/payments/create-intent', { bookingId });
  // Backend returns calculated amount for display purposes
  return response.data;
};
```

## Validation Rules

### Backend Validations

The following validations implement Requirements 2, 3, and 4:

1. **Booking exists** - 404 if not found (Requirement 2)
2. **User owns booking** - 403 if userId mismatch (Requirement 2)
3. **Booking is pending** - 400 if already paid/cancelled (Requirement 3)
4. **Amount is positive** - Validate totalAmount > 0 (Requirement 4)
5. **Passenger count matches** - Validate passengers.length > 0 (Requirement 4)
6. **No duplicate payments** - Check if paymentIntentId already exists (Requirement 3)

### Error Handling

```typescript
// Requirement 2: Booking ownership validation
const booking = await this.bookingRepo.findOne({
  where: { id: bookingId, userId }
});

if (!booking) {
  this.logger.warn(`Payment attempt for non-existent or unauthorized booking`, {
    bookingId,
    userId
  });
  throw new NotFoundException('Booking not found');
}

// Requirement 3: Booking status validation
if (booking.status !== 'PENDING') {
  this.logger.warn(`Payment attempt for non-pending booking`, {
    bookingId,
    status: booking.status
  });
  throw new BadRequestException('Booking already processed');
}

// Requirement 3: Duplicate payment prevention
if (booking.stripePaymentIntentId) {
  this.logger.warn(`Duplicate payment attempt detected`, {
    bookingId,
    existingPaymentIntentId: booking.stripePaymentIntentId
  });
  throw new ConflictException('Payment already initiated');
}

// Requirement 4: Amount validation
if (booking.totalAmount <= 0) {
  this.logger.error(`Invalid booking amount detected`, {
    bookingId,
    totalAmount: booking.totalAmount
  });
  throw new BadRequestException('Invalid booking amount');
}

// Requirement 4: Passenger count validation
if (booking.passengers.length === 0) {
  this.logger.error(`Booking has no passengers`, {
    bookingId
  });
  throw new BadRequestException('No passengers in booking');
}
```

### Logging Strategy

Implements Requirement 6 for audit and logging:

```typescript
// Success logging
this.logger.info(`Payment intent created successfully`, {
  bookingId: booking.id,
  userId: booking.userId,
  totalAmount: booking.totalAmount,
  passengerCount: booking.passengers.length,
  paymentIntentId: paymentIntent.id,
  currency: booking.currency
});

// Rejection logging (shown in error handling above)
// All validation failures are logged with context
```

## Security Benefits

1. ✅ **No price manipulation** - Frontend cannot change amount
2. ✅ **Single source of truth** - Database holds correct amount
3. ✅ **Audit trail** - All amounts logged in database
4. ✅ **Validation** - Server validates all calculations
5. ✅ **Fraud prevention** - Mismatches are impossible

## Migration Strategy

### Phase 1: Backend Changes
1. Update StripeService to use booking.totalAmount
2. Remove amount from payment DTOs
3. Add validation for booking status
4. Deploy backend changes

### Phase 2: Frontend Changes
1. Remove amount calculations from payment flow
2. Update PaymentSection to not pass amount
3. Display amount from booking data
4. Deploy frontend changes

### Phase 3: Cleanup
1. Remove deprecated amount parameters
2. Update API documentation
3. Add monitoring for payment amounts
