# Implementation Plan - Payment Amount Validation

## Task List

- [x] 1. Update backend payment DTOs and interfaces






  - [x] 1.1 Update CreatePaymentIntentDto

    - Remove `amount` field from DTO
    - Keep only `bookingId` field with UUID validation
    - Add JSDoc comments explaining security model
    - _Requirements: 5.1, 5.2_
  
  - [x] 1.2 Update payment response DTO

    - Add `amount` field to response DTO for display purposes
    - Include `clientSecret` field for Stripe integration
    - Add JSDoc explaining amount is calculated server-side
    - _Requirements: 5.3_

- [x] 2. Implement server-side payment validation (TDD approach)



  - [x] 2.1 Write tests for StripeService payment validation


    - Write test: successful payment creation with valid booking
    - Write test: reject invalid bookingId (404 NotFoundException)
    - Write test: reject unauthorized user (403 ForbiddenException)
    - Write test: reject non-pending booking (400 BadRequestException)
    - Write test: reject duplicate payment (409 ConflictException)
    - Write test: reject zero or negative amount (400 BadRequestException)
    - Write test: reject booking with no passengers (400 BadRequestException)
    - Write test: verify amount conversion to cents (multiply by 100)
    - Write test: verify booking status updated to AWAITING_PAYMENT
    - Write test: verify payment intent ID stored in booking
    - Write test: verify structured logging for success and failures
    - Run tests and verify they fail (implementation doesn't exist yet)
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2_

  - [x] 2.2 Implement StripeService.createPaymentIntent() method


    - Update method signature: remove `amount` parameter, add `bookingId` and `userId`
    - Fetch booking from database using bookingId and userId
    - Validate booking exists (throw NotFoundException if not found)
    - Validate user owns booking (throw ForbiddenException if userId mismatch)
    - Validate booking status is PENDING (throw BadRequestException if not)
    - Validate no existing payment intent (throw ConflictException if exists)
    - Validate totalAmount > 0 (throw BadRequestException if not)
    - Validate passengers.length > 0 (throw BadRequestException if not)
    - Use `booking.totalAmount` as authoritative payment amount
    - Convert amount to cents: `Math.round(amount * 100)`
    - Create Stripe Payment Intent with metadata (bookingId, userId, passengerCount)
    - Update booking status to AWAITING_PAYMENT
    - Store payment intent ID in booking entity
    - Add structured logging for successful creation
    - Add structured logging for all validation failures
    - Run tests and verify they all pass
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4_

- [x] 3. Update Payment Controller





  - [x] 3.1 Update payment endpoint


    - Modify endpoint to accept only CreatePaymentIntentDto (bookingId only)
    - Extract `userId` from JWT token using @Request() decorator
    - Pass bookingId and userId to StripeService.createPaymentIntent()
    - Return response with clientSecret and calculated amount
    - Add proper error handling for all validation exceptions
    - Add @ApiOperation decorator with endpoint description
    - Add @ApiResponse decorators for success and error cases
    - _Requirements: 2.2, 2.3, 5.1, 5.2, 5.3_

- [ ] 4. Write backend integration tests

  - [x] 4.1 Write integration tests for payment flow


    - Write test: complete booking creation + payment intent flow
    - Write test: multi-passenger booking with correct amount calculation
    - Write test: payment with different currencies (BRL, USD)
    - Write test: concurrent payment attempts for same booking
    - Write test: payment attempt after booking cancellation
    - Write test: verify amounts match between booking and Stripe payment intent
    - Run integration tests and verify they pass
    - _Requirements: 1.1, 1.3, 3.1, 4.1, 4.5_

- [x] 5. Update frontend payment components (TDD approach)





  - [x] 5.1 Write tests for frontend payment components


    - Write test: PaymentSection component without amount prop
    - Write test: amount displayed from booking data
    - Write test: CheckoutPage without amount calculations
    - Write test: payment API call sends only bookingId
    - Update mock data to include totalAmount in booking objects
    - Run tests and verify they fail (implementation doesn't match yet)
    - _Requirements: 5.4, 5.5_

  - [x] 5.2 Update payment API integration


    - Locate payment hook or service (e.g., `app/src/hooks/usePayment.ts`)
    - Remove `amount` parameter from payment creation function
    - Update API call to send only `{ bookingId }` in request body
    - Handle amount in API response for display purposes
    - Update TypeScript types to remove amount from request
    - Add TypeScript types for response including calculated amount
    - _Requirements: 5.1, 5.2, 5.3_


  - [x] 5.3 Update PaymentSection component

    - Locate payment component (e.g., `app/src/components/checkout/PaymentSectionNew.tsx`)
    - Remove `amount` prop from component interface
    - Update component to display amount from `bookingData.totalAmount`
    - Update TypeScript prop types to remove amount
    - Add comments explaining amount comes from backend
    - _Requirements: 5.4, 5.5_

  - [x] 5.4 Update CheckoutPage


    - Modify `app/src/pages/CheckoutPage.tsx`
    - Remove any frontend amount calculations (price × passenger count)
    - Pass only `bookingId` to PaymentSection component
    - Display `booking.totalAmount` directly from booking object
    - Remove passenger count multiplication logic from payment flow
    - Ensure all displayed amounts come from booking data
    - Run frontend tests and verify they pass
    - _Requirements: 5.4, 5.5_

- [ ] 6. Update API documentation
  - [ ] 6.1 Update Swagger/OpenAPI specs
    - Update payment creation endpoint documentation
    - Remove amount parameter from request schema
    - Update request examples to show only bookingId
    - Update response schema to include calculated amount
    - Add security notes explaining server-side amount calculation
    - Document error responses (404, 403, 400, 409) with examples
    - _Requirements: 5.1, 5.2, 5.3_
