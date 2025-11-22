# Design Document - Booking History Feature

## Overview

The booking history feature provides authenticated users with a comprehensive view of their past flight bookings. The implementation leverages the existing booking infrastructure in the backend and adds a new frontend page with navigation integration. The design follows the established patterns in the AIR Discovery application: NestJS backend with TypeORM, React frontend with Material-UI, and TanStack React Query for data fetching.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend API    │         │   Database      │
│   (React)       │◄───────►│   (NestJS)       │◄───────►│   (PostgreSQL)  │
│                 │  HTTPS  │                  │  TypeORM│                 │
│ - BookingHistory│         │ - BookingController        │ - bookings      │
│   Page          │         │ - BookingService │         │ - customers     │
│ - Navigation    │         │                  │         │ - flights       │
│   Integration   │         │                  │         │ - passengers    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Component Flow

1. User navigates to `/minhas-reservas` (booking history page)
2. AuthGuard validates authentication (redirect to login if not authenticated)
3. BookingHistoryPage component mounts and triggers data fetch
4. React Query calls backend API `GET /api/bookings?page=1&limit=10`
5. Backend BookingService retrieves bookings filtered by userId
6. Data is returned and cached by React Query
7. BookingHistoryPage renders the list of bookings

## Components and Interfaces

### Backend Components

#### Existing API Endpoint (No Changes Required)

The backend already has a fully functional endpoint for retrieving user bookings:

**Endpoint**: `GET /api/bookings`

**Query Parameters**:
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of results per page
- `status` (optional): Filter by booking status
- `flightId` (optional): Filter by flight ID

**Response Format**:
```typescript
{
  statusCode: 200,
  message: "Reservas encontradas",
  data: BookingResponseDto[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

**Authentication**: The endpoint automatically filters bookings by the authenticated user's ID extracted from the JWT token (`req.user.sub` or `req.user.id`).

#### BookingResponseDto Structure

```typescript
{
  id: string;                    // Booking UUID
  flightId: string;              // Flight UUID
  userId: string;                // Customer/User UUID
  status: BookingStatus;         // PENDING | AWAITING_PAYMENT | PAID | CANCELLED
  passengers: PassengerDataDto[];
  totalAmount: number;           // Amount in cents
  currency: string;              // e.g., "BRL"
  payments?: object[];           // Payment records
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Frontend Components

#### 1. BookingHistoryPage Component

**Location**: `app/src/pages/BookingHistoryPage.tsx`

**Responsibilities**:
- Fetch booking data using React Query
- Display loading states
- Handle error states
- Render booking list
- Implement pagination controls

**Key Features**:
- Uses `useQuery` hook for data fetching
- Displays bookings in descending order by date
- Shows empty state when no bookings exist
- Provides retry mechanism on errors

#### 2. BookingCard Component

**Location**: `app/src/components/booking/BookingCard.tsx`

**Responsibilities**:
- Display individual booking summary
- Show booking status with visual indicators
- Format dates and currency
- Display flight route and passenger count

**Props Interface**:
```typescript
interface BookingCardProps {
  booking: BookingResponseDto;
}
```

#### 3. BookingDetails Component (Optional Enhancement)

**Location**: `app/src/components/booking/BookingDetails.tsx`

**Responsibilities**:
- Display expanded booking information
- Show all passenger details
- Display flight segments
- Show payment information

### Frontend Hooks

#### useBookingHistory Hook

**Location**: `app/src/hooks/useBookingHistory.ts`

**Purpose**: Encapsulate booking history data fetching logic

**Interface**:
```typescript
interface UseBookingHistoryOptions {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}

interface UseBookingHistoryResult {
  bookings: BookingResponseDto[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  refetch: () => void;
}

function useBookingHistory(options?: UseBookingHistoryOptions): UseBookingHistoryResult
```

**Implementation Details**:
- Uses TanStack React Query's `useQuery`
- Implements automatic retry logic for network errors
- Caches results for 5 minutes (staleTime)
- Automatically refetches on window focus (optional)

### API Client

#### Booking API Service

**Location**: `app/src/services/bookingApi.ts` (or extend existing API service)

**Methods**:
```typescript
interface BookingApiService {
  getBookings(params: {
    page?: number;
    limit?: number;
    status?: BookingStatus;
  }): Promise<BookingHistoryResponse>;
  
  getBookingById(bookingId: string): Promise<BookingResponseDto>;
}
```

## Data Models

### Frontend Types

**Location**: `app/src/types/booking.ts`

```typescript
export enum BookingStatus {
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface PassengerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  birthDate: string;
}

export interface BookingResponseDto {
  id: string;
  flightId: string;
  userId: string;
  status: BookingStatus;
  passengers: PassengerData[];
  totalAmount: number;
  currency: string;
  payments?: any[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingHistoryResponse {
  statusCode: number;
  message: string;
  data: BookingResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Error Handling

### Frontend Error Scenarios

1. **Network Errors**
   - Display user-friendly message: "Não foi possível carregar suas reservas. Verifique sua conexão."
   - Provide retry button
   - Log error to console

2. **Authentication Errors (401)**
   - Redirect to login page
   - Clear cached authentication state
   - Display message: "Sua sessão expirou. Por favor, faça login novamente."

3. **Server Errors (500)**
   - Display message: "Ocorreu um erro ao carregar suas reservas. Tente novamente mais tarde."
   - Provide retry button
   - Log error details

4. **Empty State**
   - Display friendly message: "Você ainda não possui reservas."
   - Provide link to flight search page
   - Show illustration or icon

### Backend Error Handling

The existing backend already handles:
- Authentication validation via JWT guards
- User authorization (only returns user's own bookings)
- Database errors with appropriate HTTP status codes
- Input validation via DTOs

## UI/UX Design

### Booking History Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Navigation Bar (existing)                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Minhas Reservas                                        │
│  ─────────────────                                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Booking Card                                    │    │
│  │ ─────────────────────────────────────────────  │    │
│  │ Status: PAID ✓                                 │    │
│  │ GRU → JFK                                      │    │
│  │ 15 Jan 2024 - 22 Jan 2024                     │    │
│  │ 2 passageiros                                  │    │
│  │ R$ 4.500,00                                    │    │
│  │                                [Ver Detalhes]  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Booking Card                                    │    │
│  │ ...                                             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [< Anterior]  Página 1 de 3  [Próxima >]             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Status Indicators

- **PAID**: Green checkmark icon, "Confirmada"
- **AWAITING_PAYMENT**: Yellow clock icon, "Aguardando Pagamento"
- **PENDING**: Blue info icon, "Pendente"
- **CANCELLED**: Red X icon, "Cancelada"

### Responsive Design

- Desktop: 2-column grid of booking cards
- Tablet: 1-column layout
- Mobile: Stacked cards with simplified information

## Navigation Integration

### Route Configuration

**New Route**: `/minhas-reservas`

**Location**: `app/src/App.tsx`

```typescript
<Route path="minhas-reservas" element={<BookingHistoryPage />} />
```

### Navigation Menu Update

**Location**: `app/src/components/Layout.tsx`

Add new menu item in the authenticated user section:

```typescript
{isAuthenticated && (
  <Button color="inherit" component={Link} to="/minhas-reservas">
    Minhas Reservas
  </Button>
)}
```

**Menu Position**: Between "Lista de Desejos" and user profile menu

## Testing Strategy

### Frontend Testing

1. **Component Tests** (React Testing Library)
   - BookingHistoryPage renders correctly
   - Loading state displays spinner
   - Error state displays error message
   - Empty state displays appropriate message
   - Booking cards render with correct data
   - Pagination controls work correctly

2. **Hook Tests** (Vitest)
   - useBookingHistory fetches data correctly
   - Hook handles loading states
   - Hook handles error states
   - Hook caches data appropriately

3. **Integration Tests**
   - Navigation to booking history page works
   - Authentication guard redirects unauthenticated users
   - API calls are made with correct parameters
   - Data is displayed after successful fetch

### Backend Testing

No new backend tests required as the endpoint already exists and is tested. However, verify:
- Existing tests cover user filtering
- Existing tests cover pagination
- Existing tests cover authentication

## Performance Considerations

### Frontend Optimizations

1. **Data Caching**
   - React Query caches booking data for 5 minutes
   - Reduces unnecessary API calls
   - Improves perceived performance

2. **Pagination**
   - Default page size: 10 bookings
   - Prevents loading large datasets
   - Improves initial load time

3. **Lazy Loading**
   - Consider implementing infinite scroll for better UX
   - Load additional pages as user scrolls

4. **Code Splitting**
   - Lazy load BookingHistoryPage component
   - Reduces initial bundle size

### Backend Optimizations

The existing backend already implements:
- Database query optimization with TypeORM
- Pagination to limit result sets
- Proper indexing on user_id and created_at columns

## Security Considerations

### Authentication & Authorization

1. **JWT Validation**
   - All requests require valid JWT token
   - Token contains user ID (sub claim)
   - Backend automatically filters by authenticated user

2. **Data Access Control**
   - Users can only access their own bookings
   - No ability to query other users' data
   - Booking IDs are UUIDs (prevents enumeration attacks)

3. **Input Validation**
   - Query parameters validated via DTOs
   - Prevents SQL injection
   - Limits page size to prevent abuse

### Data Privacy

- Sensitive passenger data (documents) should be masked in list view
- Full details only shown in expanded view
- Payment information limited to status and amount

## Accessibility

### WCAG 2.1 Compliance

1. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Proper tab order
   - Focus indicators visible

2. **Screen Reader Support**
   - Semantic HTML elements
   - ARIA labels for status indicators
   - Descriptive alt text for icons

3. **Color Contrast**
   - Status colors meet WCAG AA standards
   - Text readable on all backgrounds

4. **Responsive Text**
   - Font sizes scale appropriately
   - No horizontal scrolling required

## Internationalization (Future Enhancement)

While the current implementation uses Portuguese (pt-BR), the design supports future internationalization:
- All text strings should be externalized
- Date/currency formatting uses locale-aware functions
- Status labels can be translated

## Deployment Considerations

### Frontend Deployment

- No environment variable changes required
- No build configuration changes needed
- Standard Vite build process

### Backend Deployment

- No database migrations required (uses existing schema)
- No new environment variables needed
- No infrastructure changes required

## Monitoring and Logging

### Frontend Monitoring

- Log API errors to console
- Track page views in analytics
- Monitor query performance with React Query DevTools

### Backend Monitoring

The existing BookingService already implements comprehensive logging:
- Request logging with user context
- Error logging with stack traces
- Performance metrics for database queries

## Future Enhancements

1. **Booking Details Modal**
   - Expandable view with full booking information
   - Download booking confirmation as PDF
   - Email booking details

2. **Filtering and Sorting**
   - Filter by status
   - Filter by date range
   - Sort by date, price, or destination

3. **Search Functionality**
   - Search by booking reference
   - Search by destination
   - Search by passenger name

4. **Export Functionality**
   - Export booking history as CSV
   - Generate annual travel report

5. **Booking Modifications**
   - Cancel booking from history page
   - Request refund
   - Modify passenger details (if allowed by airline)
