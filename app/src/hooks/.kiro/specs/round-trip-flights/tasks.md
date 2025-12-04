# Implementation Plan - Round-Trip Flight Support

## Overview

This implementation plan validates the existing round-trip flight functionality with focus on UI components and user experience. The system already supports round-trip flights with a 7-day default return window. These tasks focus on ensuring the UI properly displays both legs of the journey.

## Task List

- [ ] 1. Validate RecommendationsPage displays round-trip flights correctly






  - [x] 1.1 Verify flight offer display shows both itineraries

    - Check that both outbound and return flights are visible in the UI
    - Verify departure and arrival times are shown for each leg
    - Ensure flight duration is displayed for each itinerary
    - Verify number of stops/connections shown per leg
    - Check that airline information is displayed for both flights
    - _Requirements: 3.1, 3.2, 3.3, 3.4_



  - [x] 1.2 Fix flight offer card layout if needed





    - Update FlightOfferCard component to clearly separate outbound and return
    - Add visual indicators (icons or labels) for "Ida" and "Volta"
    - Ensure responsive layout works on mobile devices
    - Fix any styling issues with multi-itinerary display

    - _Requirements: 3.1, 3.2, 3.3, 3.4_


  - [x] 1.3 Verify pricing display for round-trip




    - Check that total price shown is for complete round-trip
    - Ensure price is not duplicated or shown per leg
    - Verify currency formatting is correct
    - Add clarifying text if needed (e.g., "Preço total ida e volta")
    - _Requirements: 3.5_

- [x] 2. Validate CheckoutPage shows complete round-trip information





  - [x] 2.1 Verify FlightSummary component displays both legs


    - Check that sidebar shows outbound flight details
    - Check that sidebar shows return flight details
    - Verify both flights have clear labels ("Ida" / "Volta")
    - Ensure departure/arrival times are correct for each leg
    - Verify total duration calculation includes both legs
    - _Requirements: 4.1, 4.2_

  - [x] 2.2 Fix FlightSummary layout if needed


    - Update component to clearly separate the two itineraries
    - Add visual divider between outbound and return flights
    - Ensure mobile responsive layout works correctly
    - Fix any truncation or overflow issues
    - _Requirements: 4.1, 4.2_

  - [x] 2.3 Verify PriceSummary shows correct round-trip total




    - Check that price breakdown shows total for all passengers
    - Verify price matches what was shown in RecommendationsPage
    - Ensure no price discrepancies between pages
    - Add breakdown showing "Voo ida e volta" if helpful
    - _Requirements: 4.2, 4.3_

- [x] 3. Validate BoardingDetailPage displays separate boarding passes






  - [x] 3.1 Verify itinerary extraction from flight payload


    - Check that both itineraries are extracted from amadeusOfferPayload
    - Verify extraction handles missing or malformed data gracefully
    - Ensure correct flight details are mapped for each itinerary
    - Add console logging for debugging if needed
    - _Requirements: 5.1, 5.2_

  - [x] 3.2 Verify boarding pass rendering


    - Check that two separate BoardingPassCard components render
    - Verify "✈️ Voo de Ida" label appears on first boarding pass
    - Verify "✈️ Voo de Volta" label appears on second boarding pass
    - Ensure labels only show when there are multiple itineraries
    - Check that each boarding pass shows correct flight details
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [x] 3.3 Fix boarding pass layout if needed


    - Ensure proper spacing between the two boarding passes
    - Fix any styling issues with labels or cards
    - Ensure mobile responsive layout works correctly
    - Add visual separation between boarding passes if needed
    - _Requirements: 5.2, 5.3, 5.4_


  - [x] 3.4 Verify passenger and locator consistency


    - Check that same booking locator appears on both passes
    - Verify all passengers are listed on both boarding passes
    - Ensure QR codes are generated correctly for each pass
    - Check that passenger names are formatted consistently
    - _Requirements: 5.5, 5.7_

- [x] 4. Add error handling and edge cases






  - [x] 4.1 Handle missing itinerary data gracefully

    - Add fallback UI when flight payload is missing itineraries
    - Show user-friendly error message in Portuguese
    - Add "Tentar novamente" button if appropriate
    - Log errors for debugging without breaking UI
    - _Requirements: 7.3_

  - [x] 4.2 Handle single itinerary (one-way) correctly


    - Verify UI works correctly with only one itinerary
    - Ensure "Ida/Volta" labels don't show for one-way flights
    - Check that single boarding pass renders without issues
    - _Requirements: 5.2, 5.3_

  - [x] 4.3 Add loading states


    - Show skeleton loaders while fetching flight data
    - Add loading indicators in RecommendationsPage
    - Add loading indicators in CheckoutPage
    - Add loading indicators in BoardingDetailPage
    - _Requirements: 3.1, 4.1, 5.1_

- [x] 5. Write unit tests for UI components





  - [ ]* 5.1 Write tests for RecommendationsPage
    - Write test: renders flight offers with 2 itineraries
    - Write test: displays correct price for round-trip
    - Write test: shows loading state while fetching
    - Write test: handles empty results gracefully
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ]* 5.2 Write tests for CheckoutPage FlightSummary
    - Write test: displays both outbound and return flights
    - Write test: shows correct labels for each leg
    - Write test: displays correct total price
    - Write test: handles missing flight data
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 5.3 Write tests for BoardingDetailPage
    - Write test: extracts 2 itineraries from payload
    - Write test: renders 2 BoardingPassCard components
    - Write test: displays "Voo de Ida" and "Voo de Volta" labels
    - Write test: shows same locator on both passes
    - Write test: shows all passengers on both passes
    - Write test: handles single itinerary without labels
    - Write test: handles missing itinerary data with error message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 7.3_

  - [ ]* 5.4 Write tests for BoardingPassCard component
    - Write test: renders flight details correctly
    - Write test: formats times in pt-BR locale
    - Write test: generates QR code with correct data
    - Write test: displays passenger list
    - _Requirements: 5.6, 5.7_

- [x] 6. Write unit tests for backend utilities






  - [ ]* 6.1 Write tests for date conversion utility
    - Write test: calculates 7-day return date from departure
    - Write test: handles null months with 30-day advance
    - Write test: handles past months by using next year
    - Write test: formats dates as YYYY-MM-DD
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]* 6.2 Write tests for chatbot service
    - Write test: includes returnDate in flight search params
    - Write test: returnDate equals departureDate + 7 days
    - Write test: handles missing session data
    - _Requirements: 1.1, 1.2_

- [ ]* 7. Add inline documentation
  - Document itinerary extraction logic in BoardingDetailPage
  - Add JSDoc comments to convertAvailabilityToDateRange
  - Document round-trip data flow in CheckoutPage
  - Add comments explaining 7-day default in chatbot service
  - _Requirements: Design documentation_

- [ ]* 8. Update user-facing text and labels
  - Review all Portuguese text for clarity
  - Ensure "Ida e Volta" terminology is consistent
  - Add helpful tooltips or hints where needed
  - Update any confusing labels or messages
  - _Requirements: User documentation_

## Optional Enhancements (Future Iterations)

- [ ]* 9. Add trip duration selection to chat flow
  - Update chatbot to ask "Quantos dias você pretende ficar?"
  - Store trip_duration in session data
  - Pass custom duration to date calculation
  - Update UI to show selected duration
  - _Requirements: Future enhancement_

- [ ]* 10. Add trip type selection (round-trip vs one-way)
  - Update chatbot to ask "Voo de ida e volta ou somente ida?"
  - Store trip_type in session data
  - Conditionally include returnDate based on selection
  - Update UI to indicate trip type
  - _Requirements: Future enhancement_

- [ ]* 11. Add flexible return date options
  - Show multiple duration options (7, 10, 14 days)
  - Display price comparison for different durations
  - Allow user to select preferred duration
  - _Requirements: Future enhancement_

## Validation Checklist

Before marking this spec as complete, verify:

- [x] Backend calculates 7-day return dates correctly
- [x] Amadeus API receives returnDate parameter
- [x] Flight entity stores complete offer with all itineraries
- [ ] RecommendationsPage displays both outbound and return flights clearly
- [ ] CheckoutPage FlightSummary shows both legs with labels
- [ ] CheckoutPage PriceSummary shows correct round-trip total
- [ ] BoardingDetailPage renders separate boarding passes
- [ ] "Voo de Ida" and "Voo de Volta" labels appear correctly
- [ ] Same locator and passengers on all boarding passes
- [ ] Error handling works for missing data
- [ ] Loading states work correctly
- [ ] Mobile responsive layout works for all pages
- [ ] All Portuguese text is clear and consistent

## Notes

- Focus is on UI validation and user experience
- Backend functionality already works - just need to ensure UI displays it correctly
- Unit tests are optional but recommended for regression prevention
- Integration tests are out of scope - we trust the backend works
- Manual testing is acceptable for validating the complete flow
- Priority is making sure users can see and understand their round-trip booking
