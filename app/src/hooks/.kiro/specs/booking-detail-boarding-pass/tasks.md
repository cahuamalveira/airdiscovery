# Implementation Plan

## Development Methodology

This implementation follows **Test-Driven Development (TDD)** methodology:
1. Write failing tests first
2. Implement minimal code to make tests pass
3. Refactor while keeping tests green

Each task should follow the Red-Green-Refactor cycle.

---

- [x] 1. Set up routing and navigation infrastructure





  - Add route for `/minhas-reservas/:bookingId` in App.tsx
  - Update BookingCard component to navigate to detail page on click
  - Add back navigation capability
  - _Requirements: 1.1, 5.1, 5.2_

- [x] 2. Create API service and custom hook for booking details





  - [x] 2.1 Write tests for bookingApi.getBookingById method


    - Test successful booking fetch with flight details
    - Test error handling (404, 401, 500)
    - Test response data structure validation
    - _Requirements: 1.2_
  
  - [x] 2.2 Implement bookingApi.getBookingById method

    - Create API method to fetch single booking by ID
    - Include flight relations in response
    - Handle error responses appropriately
    - _Requirements: 1.2_
  
  - [x] 2.3 Write tests for useBookingDetail hook


    - Test loading state
    - Test successful data fetch
    - Test error state
    - Test refetch functionality
    - Test React Query caching behavior
    - _Requirements: 1.2_
  
  - [x] 2.4 Implement useBookingDetail hook


    - Create custom hook using React Query
    - Implement loading, error, and success states
    - Add refetch capability
    - Configure caching strategy (5min cache, 1min stale)
    - _Requirements: 1.2_

- [x] 3. Create BoardingPassCard component with TDD





  - [x] 3.1 Write tests for BoardingPassCard component


    - Test rendering with complete booking data
    - Test flight route display (origin → destination)
    - Test flight times formatting (pt-BR locale)
    - Test date formatting (pt-BR locale)
    - Test passenger list rendering
    - Test booking locator display
    - Test QR code rendering
    - Test responsive layout behavior
    - Test accessibility attributes (ARIA labels)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 3.2 Implement BoardingPassCard component structure


    - Create component file with TypeScript interfaces
    - Implement basic card layout with Material-UI
    - Add airplane icon and blue accent bar
    - Create responsive grid layout
    - _Requirements: 2.1_
  
  - [x] 3.3 Implement flight information display


    - Add origin and destination codes with arrows
    - Display departure and arrival times
    - Show flight number and date
    - Format times and dates in pt-BR locale
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [x] 3.4 Implement passenger list and booking locator


    - Display all passenger names
    - Show booking locator/confirmation code
    - Style with proper typography hierarchy
    - _Requirements: 2.5, 2.6_
  
  - [x] 3.5 Integrate QR code generation


    - Install qrcode.react library
    - Generate QR code with booking data
    - Position QR code in right section
    - Make QR code responsive
    - _Requirements: 2.7_

- [x] 4. Create PassengerDetailsSection component with TDD




  - [x] 4.1 Write tests for PassengerDetailsSection


    - Test rendering with single passenger
    - Test rendering with multiple passengers
    - Test passenger data display (name, document, email, phone)
    - Test expandable/collapsible behavior
    - Test empty passenger list handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 4.2 Implement PassengerDetailsSection component


    - Create component with Material-UI Accordion or Cards
    - Display passenger full names
    - Show document numbers
    - Display contact information (email, phone)
    - Add expand/collapse functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Create PaymentDetailsSection component with TDD




  - [x] 5.1 Write tests for PaymentDetailsSection


    - Test status display for each booking status
    - Test currency formatting (BRL)
    - Test payment date display
    - Test payment method display
    - Test status color coding
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Implement PaymentDetailsSection component


    - Create component with status indicator
    - Display total amount with BRL formatting
    - Show payment date when available
    - Display payment method
    - Apply color coding based on status
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Create BookingDetailPage with TDD




  - [x] 6.1 Write tests for BookingDetailPage


    - Test loading state rendering (skeleton/spinner)
    - Test error state rendering with retry button
    - Test successful booking display
    - Test back navigation functionality
    - Test URL parameter extraction
    - Test 404 handling (booking not found)
    - Test unauthorized access handling
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_
  
  - [x] 6.2 Implement BookingDetailPage component


    - Create page component with Layout wrapper
    - Extract bookingId from URL params
    - Integrate useBookingDetail hook
    - Implement loading state with skeleton loaders
    - Implement error state with error messages
    - Add back button navigation
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_
  

  - [x] 6.3 Integrate all child components

    - Add BoardingPassCard with booking data
    - Add PassengerDetailsSection with passengers
    - Add PaymentDetailsSection with payment info
    - Ensure proper data flow from parent to children
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 7. Add error handling and edge cases with TDD





  - [x] 7.1 Write error handling tests


    - Test 404 error display
    - Test network error display
    - Test 401 unauthorized redirect
    - Test 500 server error display
    - Test retry functionality
    - Test missing flight data handling
    - Test missing passenger data handling
    - _Requirements: 1.3_
  
  - [x] 7.2 Implement error handling


    - Create ErrorDisplay component
    - Handle 404 with "Booking not found" message
    - Handle network errors with retry button
    - Redirect to login on 401
    - Handle server errors gracefully
    - Add fallbacks for missing data
    - _Requirements: 1.3_

- [x] 8. Add accessibility features with TDD




  - [x] 8.1 Write accessibility tests


    - Test ARIA labels on all interactive elements
    - Test keyboard navigation (tab order)
    - Test focus indicators
    - Test screen reader announcements
    - Test color contrast ratios
    - _Requirements: All requirements (accessibility is cross-cutting)_
  
  - [x] 8.2 Implement accessibility features


    - Add ARIA labels to boarding pass card
    - Add ARIA labels to action buttons
    - Ensure semantic HTML structure
    - Add alt text for images and icons
    - Implement keyboard navigation
    - Add focus indicators
    - Test with screen reader
    - _Requirements: All requirements (accessibility is cross-cutting)_

- [x] 9. Implement responsive design with TDD





  - [x] 9.1 Write responsive design tests


    - Test desktop layout (>960px)
    - Test tablet layout (600-960px)
    - Test mobile layout (<600px)
    - Test boarding pass card stacking on mobile
    - Test touch interactions on mobile
    - _Requirements: 2.1_
  
  - [x] 9.2 Implement responsive layouts


    - Add Material-UI breakpoints
    - Implement horizontal layout for desktop
    - Implement vertical stacked layout for mobile
    - Adjust typography sizes for different screens
    - Optimize touch targets for mobile
    - _Requirements: 2.1_

- [x] 10. Performance optimization and code review





  - [x] 10.1 Implement code splitting


    - Lazy load BookingDetailPage component
    - Add loading fallbacks
    - _Performance optimization_
  

  - [x] 10.2 Optimize caching and data fetching

    - Configure React Query cache times
    - Implement stale-while-revalidate strategy
    - Optimize API response size
    - _Performance optimization_
  

  - [x] 10.3 Code review and refactoring

    - Review all components for code quality
    - Ensure consistent naming conventions
    - Remove duplicate code
    - Optimize component re-renders
    - Verify all tests are passing
    - _Code quality_

- [ ]* 11. Implement download functionality with TDD
  - [ ]* 11.1 Write tests for download feature
    - Test download button rendering
    - Test html2canvas integration
    - Test file generation and download trigger
    - Test filename format
    - Test error handling during download
    - _Requirements: 6.1, 6.3_
  
  - [ ]* 11.2 Implement download functionality
    - Install html2canvas library
    - Create download handler function
    - Capture BoardingPassCard as image
    - Convert to blob and trigger download
    - Add loading state during capture
    - Handle errors gracefully
    - _Requirements: 6.1, 6.3_

- [ ]* 12. Implement share functionality with TDD
  - [ ]* 12.1 Write tests for share feature
    - Test share button rendering
    - Test Web Share API detection
    - Test share dialog trigger (when supported)
    - Test clipboard fallback
    - Test success notification
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 12.2 Implement share functionality
    - Create share handler function
    - Detect Web Share API availability
    - Implement share dialog for mobile
    - Implement clipboard fallback for desktop
    - Add success toast notification
    - Handle errors gracefully
    - _Requirements: 6.2, 6.3_

## TDD Workflow Summary

For each task with sub-tasks:
1. **Red Phase**: Write failing tests first (*.test.tsx files)
2. **Green Phase**: Implement minimal code to pass tests
3. **Refactor Phase**: Improve code quality while keeping tests green

## Testing Guidelines

- Use Vitest and React Testing Library
- Write tests before implementation
- Aim for high test coverage (>80%)
- Test user behavior, not implementation details
- Use meaningful test descriptions
- Mock external dependencies (API calls, libraries)
- Test accessibility with jest-axe or similar tools

## Notes

- All tests must pass before moving to the next task
- Follow existing project patterns and conventions
- Use Material-UI components consistently
- Maintain Portuguese (pt-BR) language throughout
- Ensure responsive design on all components
- Keep components small and focused (Single Responsibility Principle)
