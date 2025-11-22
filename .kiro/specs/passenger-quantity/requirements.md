# Requirements Document

## Introduction

This feature expands the AIR Discovery platform to support multi-passenger travel bookings. Currently, the system assumes a single traveler when calculating budgets and searching for flights. This enhancement will enable the chatbot to collect passenger composition data (adults and children with ages) and adjust the entire booking flow—from budget calculation through flight search to payment processing—to accommodate multiple travelers with appropriate pricing rules based on Brazilian legislation.

## Glossary

- **Chatbot**: The AI-powered conversational interface that conducts user interviews to gather travel preferences
- **Passenger**: Any individual traveling, categorized as Adult, Child, or Infant
- **Adult**: A traveler aged 12 years or older
- **Child**: A traveler aged between 2 and 11 years (inclusive)
- **Infant**: A traveler aged 0-23 months (under 2 years)
- **Paying Passenger**: An Adult or Child (>2 years) who requires a full-fare ticket
- **Lap Infant**: An Infant who may travel on an adult's lap and may not require a full-fare ticket
- **Travel Group**: The complete set of passengers traveling together
- **Total Budget**: The maximum amount the user is willing to spend for all paying passengers
- **Amadeus API**: The external flight search and booking API
- **Checkout Flow**: The payment and passenger data collection process
- **Backend System**: The NestJS application that processes bookings and payments

## Requirements

### Requirement 1

**User Story:** As a traveler planning a trip with my family, I want to specify how many adults and children are traveling, so that the system can provide accurate flight options and pricing for my entire travel group.

#### Acceptance Criteria

1. WHEN the user reaches the passenger collection phase in the chatbot conversation, THE Chatbot SHALL ask "How many people will be traveling?"
2. THE Chatbot SHALL provide interactive options for the user to specify the number of adults and children separately
3. THE Chatbot SHALL accept responses indicating zero or more adults and zero or more children
4. THE Chatbot SHALL validate that at least one adult is specified in the travel group
5. THE Chatbot SHALL store the passenger composition data for use in subsequent booking steps

### Requirement 2

**User Story:** As a parent traveling with young children, I want to provide the age of each child, so that the system can apply appropriate pricing rules and ticket requirements.

#### Acceptance Criteria

1. WHEN the user specifies one or more children in the travel group, THE Chatbot SHALL request the age of each child individually
2. THE Chatbot SHALL accept age values between 0 and 17 years for children
3. THE Chatbot SHALL validate that all child ages are provided before proceeding
4. THE Chatbot SHALL store each child's age for pricing and API search purposes
5. IF the user specifies zero children, THEN THE Chatbot SHALL skip the age collection step

### Requirement 3

**User Story:** As a user with a fixed travel budget, I want the system to understand that my budget must cover all paying passengers, so that I receive recommendations within my actual per-person spending capacity.

#### Acceptance Criteria

1. THE Backend System SHALL calculate the number of paying passengers as the sum of adults plus children over 2 years old
2. THE Backend System SHALL divide the total budget by the number of paying passengers to determine the per-person budget
3. THE Backend System SHALL use the per-person budget when generating destination recommendations
4. THE Backend System SHALL consider infants (children 2 years or younger) as non-paying passengers for budget calculation purposes
5. THE Backend System SHALL validate that the total budget is sufficient for the number of paying passengers before proceeding with recommendations

### Requirement 4

**User Story:** As a traveler with an infant, I want the system to include my infant in the flight search even though they don't require a full-fare ticket, so that the booking is complete and compliant with airline requirements.

#### Acceptance Criteria

1. WHEN searching for flights via the Amadeus API, THE Backend System SHALL include the count of adults in the search parameters
2. WHEN searching for flights via the Amadeus API, THE Backend System SHALL include the count of children over 2 years old in the search parameters
3. WHEN searching for flights via the Amadeus API, THE Backend System SHALL include the count of infants (children 2 years or younger) with the appropriate infant flag in the search parameters
4. THE Backend System SHALL ensure that the number of infants does not exceed the number of adults in the API request
5. THE Backend System SHALL return flight options that accommodate the complete travel group composition

### Requirement 5

**User Story:** As a user completing a booking, I want to provide passenger details for every traveler in my group, so that all passengers are properly registered for the flight.

#### Acceptance Criteria

1. THE Checkout Flow SHALL calculate the total number of travelers as the sum of adults, children over 2 years, and infants
2. THE Checkout Flow SHALL dynamically generate passenger data entry forms for each traveler in the group
3. THE Checkout Flow SHALL require full name, document number, and date of birth for each passenger
4. THE Checkout Flow SHALL validate that all passenger data fields are completed before allowing payment submission
5. THE Checkout Flow SHALL distinguish between adult, child, and infant passengers in the data collection interface

### Requirement 6

**User Story:** As a system administrator, I want the passenger pricing rules to comply with Brazilian legislation, so that the platform operates legally and provides accurate pricing to users.

#### Acceptance Criteria

1. THE Backend System SHALL classify passengers aged 0-23 months as infants for pricing purposes
2. THE Backend System SHALL classify passengers aged 2 years or older as paying passengers for pricing purposes
3. THE Backend System SHALL apply the infant pricing rule consistently across budget calculation, flight search, and payment processing
4. THE Backend System SHALL document the age-based pricing classification in the system configuration
5. THE Backend System SHALL allow infants to be included in bookings with appropriate fare rules as returned by the Amadeus API

### Requirement 7

**User Story:** As a user interacting with the chatbot, I want a smooth and intuitive conversation flow when specifying my travel group, so that I can quickly provide the necessary information without confusion.

#### Acceptance Criteria

1. THE Chatbot SHALL position the passenger quantity question after budget collection and before destination recommendations
2. THE Chatbot SHALL provide button-based quick options for common passenger configurations (e.g., "1 adult", "2 adults")
3. THE Chatbot SHALL provide a text input option for users with larger or custom travel group compositions
4. THE Chatbot SHALL confirm the complete travel group composition before proceeding to the next conversation phase
5. THE Chatbot SHALL allow users to correct passenger information if they made an error

### Requirement 8

**User Story:** As a developer maintaining the system, I want passenger data to be consistently structured throughout the application, so that all modules can reliably access and process travel group information.

#### Acceptance Criteria

1. THE Backend System SHALL define a standardized data structure for passenger composition that includes adult count, child details with ages, and infant count
2. THE Backend System SHALL persist passenger composition data in the user's chat session or booking record
3. THE Backend System SHALL pass passenger composition data from the chatbot module to the flights module and bookings module
4. THE Backend System SHALL validate passenger composition data at module boundaries to ensure data integrity
5. THE Backend System SHALL include passenger composition in API responses to the frontend for display and confirmation
