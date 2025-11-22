# Implementation Plan - Booking History Feature

- [x] 1. Create frontend type definitions





  - Create `app/src/types/booking.ts` with BookingStatus enum, PassengerData interface, BookingResponseDto interface, and BookingHistoryResponse interface
  - Ensure types match the backend DTOs for consistency
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Write tests for booking API service





  - Create `app/src/services/bookingApi.test.ts` with test cases for getBookings and getBookingById methods
  - Test successful API calls with proper response transformation
  - Test error handling for network failures, 401 authentication errors, and 500 server errors
  - Test authentication header inclusion in requests
  - Mock axios responses using Vitest mocking utilities
  - _Requirements: 1.1, 4.1, 4.2, 4.4_

- [x] 3. Implement booking API service




  - Create or extend `app/src/services/bookingApi.ts` with getBookings and getBookingById methods
  - Configure axios instance with authentication headers
  - Implement proper error handling and response transformation
  - Ensure all tests from task 2 pass
  - _Requirements: 1.1, 4.1, 4.2, 4.4_

- [x] 4. Write tests for useBookingHistory hook





  - Create `app/src/hooks/useBookingHistory.test.ts` with test cases for data fetching
  - Test loading, error, and success states
  - Test pagination parameter handling (page and limit)
  - Test retry logic that skips 4xx errors but retries network failures
  - Test cache behavior with 5 minute staleTime
  - Use Vitest with React Query testing utilities and renderHook
  - _Requirements: 1.1, 1.5, 4.1, 4.2_
-

- [x] 5. Create useBookingHistory custom hook




  - Create `app/src/hooks/useBookingHistory.ts` using TanStack React Query
  - Implement useQuery with proper cache configuration (5 minute staleTime)
  - Handle loading, error, and success states
  - Implement pagination support with page and limit parameters
  - Configure retry logic to skip 4xx errors but retry network failures
  - Ensure all tests from task 4 pass
  - _Requirements: 1.1, 1.5, 4.1, 4.2_

- [x] 6. Write tests for BookingCard component





  - Create `app/src/components/booking/BookingCard.test.tsx` with test cases for rendering
  - Test rendering with different booking statuses (PAID, AWAITING_PAYMENT, PENDING, CANCELLED)
  - Test correct display of flight route, dates, passenger count, and amount
  - Test currency formatting for BRL
  - Test date formatting with pt-BR locale
  - Test status indicator colors and labels
  - Use React Testing Library and Vitest
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Create BookingCard component




  - Create `app/src/components/booking/BookingCard.tsx` to display individual booking summary
  - Display booking status with color-coded indicators (green for PAID, yellow for AWAITING_PAYMENT, blue for PENDING, red for CANCELLED)
  - Show flight route (departure → arrival), dates, passenger count, and total amount
  - Format currency using Brazilian Real (BRL) formatting
  - Format dates using pt-BR locale
  - Use Material-UI Card, Chip, and Typography components
  - Implement responsive design for mobile and desktop
  - Ensure all tests from task 6 pass
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 8. Write tests for BookingHistoryPage component





  - Create `app/src/pages/BookingHistoryPage.test.tsx` with test cases for different states
  - Test loading state displays CircularProgress spinner
  - Test error state displays error message and retry button
  - Test empty state displays friendly message and link to flight search
  - Test successful data display with list of BookingCard components
  - Test pagination controls (Previous/Next buttons, page indicator)
  - Test bookings are sorted by date in descending order
  - Mock useBookingHistory hook responses
  - Use React Testing Library and Vitest
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3_

- [x] 9. Create BookingHistoryPage component




  - Create `app/src/pages/BookingHistoryPage.tsx` as the main page component
  - Use useBookingHistory hook to fetch booking data
  - Display loading state with CircularProgress spinner while fetching
  - Display error state with error message and retry button when fetch fails
  - Display empty state with friendly message and link to flight search when no bookings exist
  - Render list of BookingCard components for each booking
  - Implement pagination controls (Previous/Next buttons and page indicator)
  - Sort bookings by createdAt in descending order (most recent first)
  - Use Material-UI Container, Box, Typography, Button, and Grid components
  - Ensure all tests from task 8 pass
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3_

- [x] 10. Add route configuration




  - Add new route `/minhas-reservas` in `app/src/App.tsx` pointing to BookingHistoryPage
  - Ensure route is within authenticated routes section (requires login)
  - Place route alongside other authenticated routes like wishlist and checkout
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
-

- [x] 11. Update navigation menu




  - Add "Minhas Reservas" button to navigation bar in `app/src/components/Layout.tsx`
  - Place button in authenticated user section between "Lista de Desejos" and user profile menu
  - Use Material-UI Button component with Link from react-router-dom
  - Ensure button only displays for authenticated users
  - _Requirements: 3.1, 3.3_
