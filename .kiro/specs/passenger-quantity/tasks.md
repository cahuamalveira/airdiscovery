# Implementation Plan - Passenger Quantity Feature

## Task List

- [x] 1. Update backend data structures and interfaces






  - [x] 1.1 Extend CollectedData interface with passenger composition

    - Add `PassengerComposition` interface with adults count and children array
    - Add `ChildPassenger` interface with age and isPaying flag
    - Add `passenger_composition` field to `CollectedData` interface
    - Add `ButtonOption` interface for interactive button responses
    - Update `ChatbotJsonResponse` to include optional `button_options` field
    - _Requirements: 1.1, 1.2, 1.5_



  - [x] 1.2 Add new conversation stage for passenger collection

    - Add `'collecting_passengers'` to `ConversationStage` type
    - Add `'passengers'` to `NextQuestionKey` type
    - Update stage ordering to place passenger collection after budget
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement passenger pricing utility (TDD approach)





  - [x] 2.1 Write tests for PassengerPricingUtil


    - Write test: calculate pricing with 1 adult only (1 paying passenger)
    - Write test: calculate pricing with 2 adults (2 paying passengers)
    - Write test: calculate pricing with 1 adult + 1 infant (age 1) = 1 paying passenger
    - Write test: calculate pricing with 1 adult + 1 child (age 5) = 2 paying passengers
    - Write test: calculate pricing with 2 adults + 2 children (ages 1, 8) = 3 paying passengers
    - Write test: validate budget with sufficient amount per person
    - Write test: validate budget with insufficient amount per person
    - Write test: edge case with 0 children
    - Run tests and verify they fail (class doesn't exist yet)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 6.1, 6.2, 6.3_



  - [x] 2.2 Implement PassengerPricingUtil class





    - Create `PassengerPricingUtil` class in `backend/airdiscovery/src/modules/chatbot/utils/passenger-pricing.util.ts`
    - Implement `calculatePricing()` method to compute paying vs non-paying passengers
    - Implement business rule: children <= 2 years are non-paying (infants)
    - Implement business rule: children > 2 years are paying passengers
    - Calculate per-person budget by dividing total budget by paying passengers
    - Implement `validateBudget()` method with minimum per-person threshold
    - Return validation result with user-friendly error messages in Portuguese
    - Run tests and verify they all pass
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 6.1, 6.2, 6.3_

- [x] 3. Update chatbot service for passenger collection





  - [x] 3.1 Write tests for flight search parameter builder


    - Write test: build params with 1 adult only (no children/infants fields)
    - Write test: build params with 2 adults + 1 child (age 5) = adults: 2, children: 1
    - Write test: build params with 1 adult + 1 infant (age 1) = adults: 1, infants: 1
    - Write test: build params with 2 adults + 2 children (ages 1, 8) = adults: 2, children: 1, infants: 1
    - Write test: return null when passenger composition is missing
    - Run tests and verify they fail (method doesn't handle passenger composition yet)
    - _Requirements: 4.1, 4.2, 4.3_



  - [x] 3.2 Update flight search parameter builder
    - Modify `getFlightSearchParamsFromSession()` to read passenger composition
    - Calculate children count (ages > 2) from passenger composition
    - Calculate infants count (ages <= 2) from passenger composition
    - Add `children` and `infants` fields to return object (only if count > 0)
    - Run tests and verify they pass
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.3 Write tests for stage calculation with passengers
    - Write test: stage is 'collecting_passengers' when passenger_composition is null
    - Write test: stage is 'collecting_passengers' when adults count is 0
    - Write test: stage is 'collecting_availability' when passenger_composition is complete
    - Write test: stage progression follows correct order
    - Run tests and verify they fail (stage calculation doesn't check passengers yet)
    - _Requirements: 1.5, 7.1_

  - [x] 3.4 Update stage calculation logic


    - Modify `calculateCorrectStage()` to check for passenger composition
    - Add passenger composition validation before proceeding to availability stage
    - Ensure stage progression: origin → budget → passengers → availability → activities → purpose → hobbies
    - Run tests and verify they pass
    - _Requirements: 1.5, 7.1_

  - [x] 3.5 Update LLM system prompt for passenger collection
    - Locate the system prompt in `json-prompt-builder.ts` or similar file
    - Add new conversation stage: "After collecting budget, ask about passenger composition"
    - Specify exact question: "Quantas pessoas vão viajar? Primeiro, me diga quantos adultos:"
    - Define button options to return in JSON response for adults: "1 adulto", "2 adultos", "3 adultos", "4 adultos", "Mais..."
    - Add follow-up question for children: "E quantas crianças?" with buttons: "Nenhuma", "1 criança", "2 crianças", "3 crianças", "Mais..."
    - Add child age collection: For each child, ask age with buttons: "0-2 anos", "3-5 anos", "6-11 anos", "12-17 anos"
    - Specify age range to value mapping in prompt (e.g., "0-2 anos" = 1, "3-5 anos" = 4, "6-11 anos" = 8, "12-17 anos" = 14)
    - Add JSON schema for passenger_composition field in data_collected
    - Add validation instructions: minimum 1 adult, child ages 0-17
    - Specify that LLM should calculate isPaying flag for each child (age > 2 = paying)
    - Add instruction to include button_options array in JSON response during passenger collection
    - Update conversation flow order in prompt: origin → budget → passengers → availability → activities → purpose → hobbies
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4_

  - [x] 3.6 Update LLM recommendation prompt to use passenger data
    - Update the recommendation generation part of system prompt
    - Add instruction to use per-person budget instead of total budget
    - Specify calculation: per-person budget = total budget / number of paying passengers
    - Add instruction to mention passenger composition in recommendations (e.g., "Para 2 adultos e 1 criança...")
    - Ensure LLM understands that infants (0-2 years) don't count as paying passengers
    - Add example in prompt showing budget calculation with different passenger compositions
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.7 Update session mapping functions
    - Update `mapToLegacySession()` to handle passenger composition data
    - Update `mapFromLegacySession()` to restore passenger composition
    - Ensure backward compatibility with existing sessions (default to 1 adult if null)
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 4. Update Amadeus API client for multi-passenger search (TDD approach)





  - [x] 4.1 Write tests for Amadeus client validation


    - Write test: search with 1 adult only (valid)
    - Write test: search with 2 adults + 1 child (valid)
    - Write test: search with 1 adult + 1 infant (valid)
    - Write test: search with 1 adult + 2 infants (invalid - too many infants)
    - Write test: search with 0 adults (invalid)
    - Write test: verify children parameter only included when count > 0
    - Write test: verify infants parameter only included when count > 0
    - Run tests and verify they fail (validation doesn't exist yet)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Implement Amadeus client updates


    - Extend `searchFlightOffers` method signature with optional `children` and `infants` parameters
    - Update TypeScript interface for search parameters
    - Add validation: infants count cannot exceed adults count
    - Return user-friendly error message if validation fails
    - Add `children` parameter to Amadeus API request if provided and > 0
    - Add `infants` parameter to Amadeus API request if provided and > 0
    - Run tests and verify they all pass
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Implement frontend button-based chat interface





  - [x] 5.1 Update chat message interface


    - Add `buttonOptions` field to message type
    - Define `ButtonOption` type with label and value
    - _Requirements: 7.2_

  - [x] 5.2 Create button rendering component


    - Render buttons when `buttonOptions` is present in message
    - Style buttons with Material-UI outlined variant
    - Arrange buttons in flex wrap layout with spacing
    - _Requirements: 7.2, 7.3_

  - [x] 5.3 Implement button click handler


    - Send button label as user message when clicked
    - Send button value to backend for processing
    - Hide text input when buttons are displayed
    - Show text input again after button is clicked
    - _Requirements: 7.2, 7.4_

- [x] 6. Update checkout passenger form for multiple passengers





  - [x] 6.1 Extend PassengerForm component props


    - Add `passengerCount` prop for total number of passengers
    - Add `passengerTypes` prop with array of passenger type objects
    - Update `onSubmit` prop to accept array of passenger data
    - Define `PassengerType` interface with index, type, and optional age
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 Implement dynamic form generation


    - Map over `passengerTypes` array to generate individual passenger cards
    - Display passenger type label (Adulto, Criança, Bebê) with age if applicable
    - Mark first passenger as "Passageiro Principal"
    - Generate unique field names using array index: `passengers[${index}].firstName`
    - _Requirements: 5.2, 5.3_

  - [x] 6.3 Update validation schema


    - Modify age validation to allow ages 0-120 (remove 18+ restriction)
    - Create `multiPassengerSchema` with array of passenger schemas
    - Ensure minimum 1 passenger in array
    - _Requirements: 5.4_


- [x] 7. Update CheckoutPage to read passenger composition






  - [x] 7.1 Add passenger composition state


    - Create state variable for `PassengerComposition`
    - Fetch passenger composition from chat session on mount
    - Handle case where sessionId is not available
    - _Requirements: 5.1, 8.2_

  - [x] 7.2 Generate passenger types array

    - Create `useMemo` hook to compute passenger types from composition
    - Add adults to array based on composition.adults count
    - Add children to array with correct type (infant vs child) based on age
    - Include age in passenger type object for children
    - _Requirements: 5.2_

  - [x] 7.3 Pass passenger data to PassengerForm

    - Pass `passengerCount` and `passengerTypes` to PassengerForm component
    - Handle loading state while fetching composition
    - Show error message if composition cannot be loaded
    - _Requirements: 5.2, 5.3_

-

- [x] 8. Update booking service validation (TDD approach)





  - [x] 8.1 Write tests for age calculation


    - Write test: calculate age for person born exactly 25 years ago
    - Write test: calculate age for person born 25 years and 6 months ago
    - Write test: calculate age for person with birthday tomorrow (should be current age, not +1)
    - Write test: calculate age for infant (0 years old)
    - Run tests and verify they fail (method doesn't exist yet)
    - _Requirements: 5.4_

  - [x] 8.2 Implement age calculation helper


    - Create `calculateAge()` private method in BookingService
    - Calculate age from birthDate considering month and day
    - Return age in years
    - Run tests and verify they pass
    - _Requirements: 5.4_

  - [x] 8.3 Write tests for multi-passenger validation


    - Write test: validation passes with 1 adult
    - Write test: validation passes with 2 adults + 1 child
    - Write test: validation passes with 1 adult + 1 infant
    - Write test: validation fails with 0 adults (all children)
    - Write test: validation fails with 2 infants + 1 adult (too many infants)
    - Write test: validation fails with invalid age (negative)
    - Write test: validation fails with invalid age (> 120)
    - Write test: validation fails with invalid CPF
    - Run tests and verify they fail (validation logic doesn't exist yet)
    - _Requirements: 5.4, 6.4_

  - [x] 8.4 Update CreateBookingDto and implement validation


    - Ensure `passengers` field accepts array of `PassengerDataDto`
    - Add optional `passengerType` field to `PassengerDataDto`
    - Keep existing validation decorators
    - Update `validateBookingData()` method to validate at least one adult (age >= 12)
    - Validate infant count (age < 2) does not exceed adult count
    - Validate each passenger's age is between 0-120
    - Validate each passenger's CPF using existing `isValidCPF()` method
    - Return user-friendly error messages in Portuguese
    - Run tests and verify they all pass
    - _Requirements: 5.1, 5.4, 5.5, 6.4_

  - [x] 8.5 Write tests for booking creation with multiple passengers


    - Write test: create booking with 1 adult passenger
    - Write test: create booking with 2 adult passengers
    - Write test: create booking with 1 adult + 1 child
    - Write test: create booking with 2 adults + 2 children + 1 infant
    - Write test: verify all passengers are saved in database
    - Write test: verify booking total amount is correct
    - Run tests and verify they pass with existing implementation

    - _Requirements: 5.5, 8.4_

- [x] 9. Add error handling and validation







  - [x] 9.1 Define error message constants

    - Create `ERROR_MESSAGES` object with Portuguese messages
    - Include messages for: no adults, invalid child age, too many infants, insufficient budget, invalid passenger data
    - _Requirements: 1.4, 3.5, 4.4, 5.4_

  - [x] 9.2 Implement chatbot-level validation


    - Validate passenger counts in chatbot service
    - Return error messages through chatbot response
    - Allow user to correct invalid input
    - _Requirements: 1.4, 1.5, 7.5_

  - [x] 9.3 Implement API-level validation


    - Validate Amadeus API parameters before sending request
    - Handle Amadeus API errors gracefully
    - Return user-friendly error messages
    - _Requirements: 4.4_

- [x] 10. Fix pricing display in RecommendationsPage



  - [x] 10.1 Update RecommendationsPage to fetch passenger composition





    - Add state for passenger composition
    - Fetch composition from session using sessionId query param
    - Calculate total paying passengers (adults + children > 2 years)
    - Add loading state while fetching composition
    - Add error handling for failed composition fetch
    - _Requirements: 3.1, 3.2, 5.1_

  - [ ] 10.2 Update price display logic
    - Calculate per-person price: `total / payingPassengers`
    - Update UI to show both total price and per-person price
    - Change label from "Total por pessoa" to "Total: R$ X (R$ Y por pessoa)"
    - Handle edge case when passenger composition is not available (default to showing total only)
    - _Requirements: 3.2, 3.3_

  - [ ] 10.3 Update PriceSummary component in checkout
    - Verify PriceSummary shows correct total for all passengers
    - Add breakdown showing: "X adultos + Y crianças = Total R$ Z"
    - Ensure pricing matches what was shown in RecommendationsPage
    - _Requirements: 3.1, 3.2, 5.1_

- [x] 12. Fix checkout passenger forms not rendering for all passengers







  - [x] 12.1 Debug and verify passengerTypes array generation

    - Add console logging to CheckoutPage to verify passengerTypes array
    - Verify passengerComposition is being fetched correctly from session
    - Check that passengerTypes array has correct length and structure
    - Verify PassengerForm receives non-empty passengerTypes array
    - _Requirements: 5.1, 5.2_



  - [ ] 12.2 Fix PassengerForm conditional rendering logic
    - Review `isMultiPassenger` condition in PassengerForm component
    - Ensure it correctly detects when multiple passengers should be rendered
    - Add fallback handling if passengerTypes is undefined but passengerCount > 1
    - Add console logging to verify which mode (single/multi) is being used


    - _Requirements: 5.2, 5.3_

  - [ ] 12.3 Fix default values for multi-passenger forms
    - Ensure defaultValues only apply to first passenger (primary)
    - Other passengers should have empty forms


    - Update multiForm defaultValues generation logic
    - Test that user info pre-fills only for primary passenger
    - _Requirements: 5.3_

  - [ ] 12.4 Add visual feedback for passenger composition loading
    - Show loading skeleton or spinner while fetching passenger composition
    - Display passenger count summary before forms (e.g., "Preencha os dados de 3 passageiros")
    - Add error state if composition cannot be loaded
    - Provide fallback to manual passenger count input if needed
    - _Requirements: 5.1, 5.2_

- [ ] 11. Integration and end-to-end testing




  - [x] 11.1 Write integration tests for chatbot flow


    - Write test: complete flow from origin to passenger collection
    - Write test: passenger composition persisted in session
    - Write test: stage progression includes passenger collection
    - Write test: various passenger combinations (1 adult, 2 adults + 1 child, etc.)
    - Run tests and verify they pass with implementation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.2 Write integration tests for flight search


    - Write test: flight search with passenger composition from session
    - Write test: correct parameters sent to Amadeus API
    - Write test: flight results include correct passenger count
    - Write test: edge cases (maximum passengers, infants with adults)
    - Run tests and verify they pass
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 11.3 Write integration tests for checkout flow


    - Write test: checkout loads passenger composition from session
    - Write test: correct number of passenger forms generated
    - Write test: booking created with all passenger data
    - Write test: all passengers persisted in database
    - Run tests and verify they pass
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 11.4 Test pricing display accuracy
    - Test: Verify price shown in RecommendationsPage matches Amadeus total
    - Test: Verify per-person calculation is correct for different passenger counts
    - Test: Verify pricing in checkout matches recommendations
    - Test: Verify total amount in booking matches flight offer total
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 11.5 Manual end-to-end testing


    - Manually test complete user journey from chat to booking
    - Test button interactions in chatbot UI
    - Test passenger form rendering with different compositions
    - Test error scenarios and validation messages
    - Verify all error messages are user-friendly and in Portuguese
    - Document any issues found for fixing
    - _Requirements: All requirements_
