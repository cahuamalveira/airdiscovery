# Payment Amount Validation - Requirements

## Introduction

This specification addresses critical security vulnerabilities in the payment flow where payment amounts are currently calculated on the frontend and trusted by the backend. The system must enforce server-side payment amount calculation to prevent price manipulation and ensure all payment amounts are derived from authoritative booking data stored in the database.

## Glossary

- **Payment System**: The AIR Discovery backend payment processing module that integrates with Stripe
- **Booking System**: The AIR Discovery backend booking management module that stores flight reservations
- **Frontend Client**: The React-based web application used by travelers
- **Payment Intent**: A Stripe API object representing a payment to be collected
- **Booking Entity**: The database record containing flight reservation details and calculated total amount
- **Total Amount**: The server-calculated payment amount stored in the booking entity (flight price × passenger count)

## Requirements

### Requirement 1: Server-Side Payment Amount Calculation

**User Story:** As a system administrator, I want all payment amounts to be calculated exclusively on the backend, so that users cannot manipulate prices through client-side modifications.

#### Acceptance Criteria

1. WHEN the Payment System receives a payment creation request, THE Payment System SHALL retrieve the total amount from the Booking Entity in the database
2. THE Payment System SHALL NOT accept payment amount values from the Frontend Client
3. THE Booking System SHALL calculate the total amount as the product of flight price and passenger count during booking creation
4. THE Booking System SHALL store the calculated total amount in the Booking Entity before returning the booking confirmation
5. WHEN creating a Stripe Payment Intent, THE Payment System SHALL use the total amount from the Booking Entity

### Requirement 2: Booking Ownership Validation

**User Story:** As a security engineer, I want the system to verify that users can only create payments for their own bookings, so that unauthorized payment attempts are prevented.

#### Acceptance Criteria

1. WHEN the Payment System receives a payment creation request, THE Payment System SHALL verify the authenticated user identifier matches the Booking Entity user identifier
2. IF the user identifier does not match the Booking Entity user identifier, THEN THE Payment System SHALL reject the request with a 403 Forbidden error
3. THE Payment System SHALL extract the user identifier from the JWT authentication token
4. IF the Booking Entity does not exist for the provided booking identifier, THEN THE Payment System SHALL reject the request with a 404 Not Found error

### Requirement 3: Booking Status Validation

**User Story:** As a payment processor, I want to ensure payments are only created for pending bookings, so that duplicate or invalid payment attempts are prevented.

#### Acceptance Criteria

1. WHEN the Payment System receives a payment creation request, THE Payment System SHALL verify the Booking Entity status is PENDING
2. IF the Booking Entity status is not PENDING, THEN THE Payment System SHALL reject the request with a 400 Bad Request error
3. IF the Booking Entity already has a Stripe Payment Intent identifier, THEN THE Payment System SHALL reject the request with a 409 Conflict error
4. WHEN a Payment Intent is successfully created, THE Payment System SHALL update the Booking Entity status to AWAITING_PAYMENT
5. WHEN a Payment Intent is successfully created, THE Payment System SHALL store the Stripe Payment Intent identifier in the Booking Entity

### Requirement 4: Payment Amount Validation

**User Story:** As a financial auditor, I want the system to validate all payment amounts before processing, so that invalid or fraudulent transactions are prevented.

#### Acceptance Criteria

1. WHEN the Payment System retrieves a Booking Entity, THE Payment System SHALL verify the total amount is greater than zero
2. IF the total amount is zero or negative, THEN THE Payment System SHALL reject the payment request with a 400 Bad Request error
3. WHEN the Payment System retrieves a Booking Entity, THE Payment System SHALL verify the passenger count is greater than zero
4. IF the passenger count is zero, THEN THE Payment System SHALL reject the payment request with a 400 Bad Request error
5. THE Payment System SHALL convert the total amount to the smallest currency unit (cents) before creating the Stripe Payment Intent

### Requirement 5: Frontend Payment Request Interface

**User Story:** As a frontend developer, I want the payment API to accept only booking identifiers, so that the interface enforces secure payment practices.

#### Acceptance Criteria

1. THE Payment System SHALL accept only the booking identifier in payment creation requests
2. THE Payment System SHALL reject requests that include an amount field with a 400 Bad Request error
3. WHEN the Payment System successfully creates a Payment Intent, THE Payment System SHALL return the Stripe client secret and the calculated total amount for display purposes
4. THE Frontend Client SHALL display the total amount from the booking data
5. THE Frontend Client SHALL NOT calculate or send payment amounts to the Payment System

### Requirement 6: Audit and Logging

**User Story:** As a security analyst, I want all payment operations to be logged with relevant details, so that I can audit payment transactions and detect anomalies.

#### Acceptance Criteria

1. WHEN the Payment System creates a Payment Intent, THE Payment System SHALL log the booking identifier, user identifier, total amount, and passenger count
2. WHEN the Payment System rejects a payment request, THE Payment System SHALL log the rejection reason and request details
3. THE Payment System SHALL include the booking identifier and user identifier in Stripe Payment Intent metadata
4. THE Payment System SHALL include the passenger count in Stripe Payment Intent metadata

## Out of Scope

The following items are explicitly excluded from this specification:

- Refund processing logic
- Partial payment support
- Multi-currency conversion
- Dynamic pricing based on demand or availability
- Payment plan or installment options
- Promotional discounts or coupon codes
