# Requirements Document - Round-Trip Flight Support

## Introduction

This document specifies the requirements for round-trip flight booking functionality in the AIR Discovery platform. The system must support users booking flights with both outbound and return legs, displaying both flights clearly throughout the booking journey, and ensuring proper data flow from chat recommendations through to the final boarding passes.

## Glossary

- **System**: The AIR Discovery travel booking platform (frontend + backend)
- **Chatbot**: The AI-powered conversational interface that collects travel preferences
- **Amadeus API**: External flight search API that provides flight offers
- **Flight Offer**: A complete flight package from Amadeus that may contain one or more itineraries
- **Itinerary**: A single flight leg (either outbound or return) containing one or more segments
- **Segment**: A single flight operated by one airline between two airports
- **Round-Trip Flight**: A flight booking that includes both an outbound journey (origin to destination) and a return journey (destination back to origin)
- **One-Way Flight**: A flight booking with only an outbound journey
- **Boarding Pass**: Digital confirmation document showing flight details for a single itinerary
- **Trip Duration**: The number of days between departure and return dates

## Requirements

### Requirement 1: Default Round-Trip Behavior

**User Story:** As a traveler using the chatbot, I want the system to automatically search for round-trip flights so that I can see complete travel options without having to specify I want to return.

#### Acceptance Criteria

1. WHEN THE Chatbot collects travel preferences from a user, THE System SHALL default to searching for round-trip flights
2. WHEN THE System calculates flight search parameters, THE System SHALL set the return date to 7 days after the departure date by default
3. WHEN THE Chatbot recommends a destination, THE System SHALL include both outbound and return flight options in the search results
4. THE System SHALL use the `convertAvailabilityToDateRange` utility function with a default `tripDuration` parameter of 7 days
5. WHEN availability months are provided by the user, THE System SHALL calculate the departure date as the 15th day of the first available month and the return date as departure date plus 7 days

### Requirement 2: Flight Search API Integration

**User Story:** As a developer, I want the system to properly request round-trip flights from the Amadeus API so that users receive accurate flight options with both legs of their journey.

#### Acceptance Criteria

1. WHEN THE System calls the Amadeus flight search API, THE System SHALL include the `returnDate` parameter in the request
2. THE System SHALL validate that the return date is after the departure date before making the API call
3. WHEN THE Amadeus API returns flight offers, THE System SHALL preserve all itineraries in the response (both outbound and return)
4. THE System SHALL store the complete Amadeus offer payload including all itineraries in the Flight entity's `amadeusOfferPayload` field
5. IF THE Amadeus API returns an error for round-trip search, THE System SHALL log the error and return a user-friendly error message

### Requirement 3: Flight Recommendations Display

**User Story:** As a traveler viewing flight recommendations, I want to see clear information about both my outbound and return flights so that I can make an informed booking decision.

#### Acceptance Criteria

1. WHEN THE RecommendationsPage displays flight offers, THE System SHALL show flight details for all itineraries in each offer
2. THE System SHALL display the departure and arrival times for both outbound and return flights
3. THE System SHALL show the total duration for the complete round-trip journey
4. THE System SHALL display the number of stops/connections for each leg of the journey separately
5. THE System SHALL show the total price for the complete round-trip (not per leg)

### Requirement 4: Checkout Flow with Round-Trip Data

**User Story:** As a traveler in the checkout process, I want to review both my outbound and return flight details before completing my booking so that I can confirm all travel arrangements are correct.

#### Acceptance Criteria

1. WHEN THE CheckoutPage loads with a selected flight, THE System SHALL retrieve the complete flight data including all itineraries from the Flight entity
2. THE System SHALL display flight summary information for both outbound and return legs in the sidebar
3. THE System SHALL calculate the total price based on the complete round-trip offer from Amadeus
4. WHEN THE user proceeds through checkout steps, THE System SHALL maintain all itinerary data in the booking context
5. THE System SHALL create a single booking record that references the Flight entity containing both itineraries

### Requirement 5: Booking Confirmation and Boarding Passes

**User Story:** As a traveler who has completed a booking, I want to receive separate boarding passes for my outbound and return flights so that I have clear documentation for each leg of my journey.

#### Acceptance Criteria

1. WHEN THE BookingDetailPage displays a confirmed booking, THE System SHALL extract all itineraries from the stored Amadeus offer payload
2. THE System SHALL generate a separate BoardingPassCard component for each itinerary
3. WHEN displaying multiple boarding passes, THE System SHALL label the first itinerary as "✈️ Voo de Ida" (Outbound Flight)
4. WHEN displaying multiple boarding passes, THE System SHALL label the second itinerary as "✈️ Voo de Volta" (Return Flight)
5. THE System SHALL display both boarding passes in a vertical stack with clear visual separation
6. EACH boarding pass SHALL show the correct departure code, arrival code, departure time, arrival time, and flight number for its respective itinerary
7. THE System SHALL use the same booking locator and passenger list for all boarding passes within a single booking

### Requirement 6: Data Persistence and Integrity

**User Story:** As a system administrator, I want round-trip flight data to be properly stored and retrievable so that users can access their complete booking information at any time.

#### Acceptance Criteria

1. WHEN THE System creates a Flight entity from an Amadeus offer, THE System SHALL store the complete offer payload in the `amadeusOfferPayload` JSONB field
2. THE System SHALL preserve all itineraries, segments, pricing, and metadata from the original Amadeus response
3. WHEN THE System retrieves a Flight entity, THE System SHALL be able to extract multiple itineraries from the stored payload
4. THE System SHALL maintain referential integrity between Booking and Flight entities
5. THE System SHALL ensure that the stored flight data includes all necessary information to generate boarding passes for all itineraries

### Requirement 7: Error Handling and Edge Cases

**User Story:** As a traveler, I want the system to handle errors gracefully when searching for or displaying round-trip flights so that I receive clear feedback if something goes wrong.

#### Acceptance Criteria

1. IF THE Amadeus API returns no round-trip flights for the requested dates, THE System SHALL display a user-friendly message suggesting alternative dates
2. IF THE System cannot calculate a valid return date, THE System SHALL default to 7 days after the departure date
3. IF THE stored flight data is missing itinerary information, THE System SHALL display an error message on the BookingDetailPage
4. WHEN THE System encounters invalid date ranges (return before departure), THE System SHALL reject the search with a clear error message
5. IF THE System fails to extract itineraries from the Amadeus payload, THE System SHALL log the error and display a fallback message to the user

### Requirement 8: Passenger Composition for Round-Trip

**User Story:** As a traveler booking for multiple passengers, I want the system to apply my passenger composition to both legs of my round-trip flight so that all travelers are included in both directions.

#### Acceptance Criteria

1. WHEN THE System searches for round-trip flights, THE System SHALL include the passenger composition (adults, children, infants) in the Amadeus API request
2. THE System SHALL apply the same passenger composition to both outbound and return itineraries
3. WHEN displaying boarding passes, THE System SHALL list all passengers on both the outbound and return boarding pass cards
4. THE System SHALL calculate the total price based on the passenger composition for the complete round-trip
5. THE System SHALL validate that the passenger composition is valid for round-trip flights (e.g., infants ≤ adults)

## Non-Functional Requirements

### Performance
- Flight search with round-trip parameters should complete within 5 seconds under normal conditions
- Boarding pass generation for multiple itineraries should render within 1 second

### Usability
- The distinction between outbound and return flights must be immediately clear to users
- Boarding passes should be printable and display correctly on mobile devices

### Reliability
- The system must handle Amadeus API failures gracefully without losing user data
- Flight data must be persisted reliably to support future retrieval

## Out of Scope

- Multi-city flights (more than 2 destinations)
- Open-jaw tickets (different origin/destination for return)
- User-configurable trip duration in the chat interface
- Separate pricing for outbound vs return legs
- Ability to select different fare classes for outbound vs return
