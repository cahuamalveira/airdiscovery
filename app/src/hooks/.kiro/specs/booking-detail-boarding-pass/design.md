# Design Document - Booking Detail & Boarding Pass

## Overview

This feature adds a dedicated booking detail page with a visual boarding pass component. Users can click on any booking from the history list to view comprehensive booking information presented in an immersive, airline-style boarding pass format. The design focuses on creating a realistic and visually appealing representation while maintaining functionality for viewing, downloading, and sharing boarding passes.

## Architecture

### High-Level Flow

```
BookingHistoryPage (List View at /minhas-reservas)
    ↓ (User clicks booking card)
BookingDetailPage (/minhas-reservas/:bookingId)
    ↓ (Fetches booking data)
    ├── BookingDetailHeader (Back button, status)
    ├── BoardingPassCard (Visual boarding pass)
    ├── PassengerDetailsSection (All passengers)
    └── PaymentDetailsSection (Payment info)
```

### Component Hierarchy

```
BookingDetailPage
├── Layout (with back navigation)
├── Loading/Error States
└── Content
    ├── BookingDetailHeader
    │   ├── Back Button
    │   ├── Booking Status Chip
    │   └── Action Buttons (Download, Share)
    ├── BoardingPassCard
    │   ├── Airline Branding Section
    │   ├── Flight Route Section (Origin → Destination)
    │   ├── Flight Details (Number, Date, Times)
    │   ├── Passenger List
    │   ├── Booking Locator
    │   └── QR Code (Static visual element)
    ├── PassengerDetailsSection
    │   └── PassengerDetailCard[] (for each passenger)
    └── PaymentDetailsSection
        ├── Payment Status
        ├── Total Amount
        └── Payment Method
```

## Components and Interfaces

### 1. BookingDetailPage Component

**Location:** `app/src/pages/BookingDetailPage.tsx`

**Purpose:** Main page component that orchestrates the booking detail view

**Props:** None (uses URL params)

**Key Responsibilities:**
- Extract bookingId from URL params using React Router
- Fetch booking data using custom hook
- Handle loading and error states
- Render all child components with booking data
- Manage navigation back to booking history

**State Management:**
- Uses `useBookingDetail` custom hook for data fetching
- Local state for download/share actions

### 2. BoardingPassCard Component

**Location:** `app/src/components/booking/BoardingPassCard.tsx`

**Purpose:** Visual representation of a boarding pass with airline-style design

**Props:**
```typescript
interface BoardingPassCardProps {
  booking: BookingResponseDto;
  flight: FlightDetails;
}

interface FlightDetails {
  flightNumber: string;
  departureCode: string;
  arrivalCode: string;
  departureDateTime: string;
  arrivalDateTime: string;
  airline?: string;
}
```

**Design Specifications:**
- Card with rounded corners and shadow for depth
- Left section: Blue accent bar with airplane icon
- Main section: Flight information in structured layout
- Right section: QR code and airline logo
- Responsive design: stacks vertically on mobile
- Color scheme: White background, blue accent (#1976d2), gray text

**Layout Structure:**
```
┌─────────────────────────────────────────────────┐
│ ┃  ✈️   SEU CARTÃO DE EMBARQUE    [GOL Logo]   │
│ ┃                                               │
│ ┃  GYN          →          GIG                  │
│ ┃  10:05                   11:50                │
│ ┃  Voo: G3 • 738                                │
│ ┃                                               │
│ ┃  DATA: 13/12/2025                    [QR]     │
│ ┃  LOCALIZADOR: ABC123DEF              [CODE]   │
│ ┃                                               │
│ ┃  PASSAGEIROS:                                 │
│ ┃  - JOÃO SILVA                                 │
│ ┃  - MARIA SILVA                                │
└─────────────────────────────────────────────────┘
```

### 3. PassengerDetailsSection Component

**Location:** `app/src/components/booking/PassengerDetailsSection.tsx`

**Purpose:** Display detailed information for all passengers

**Props:**
```typescript
interface PassengerDetailsSectionProps {
  passengers: PassengerData[];
}
```

**Features:**
- Expandable/collapsible cards for each passenger
- Shows: Full name, document number, email, phone, birth date
- Material-UI Accordion or Card components

### 4. PaymentDetailsSection Component

**Location:** `app/src/components/booking/PaymentDetailsSection.tsx`

**Purpose:** Display payment information and status

**Props:**
```typescript
interface PaymentDetailsSectionProps {
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  payments?: PaymentInfo[];
  createdAt?: string;
}
```

**Features:**
- Status indicator with color coding
- Formatted currency display
- Payment date and method
- Payment history if multiple payments exist

## Data Models

### Extended Booking Response

The existing `BookingResponseDto` needs to include flight details. We'll extend the backend response:

```typescript
interface BookingDetailResponse extends BookingResponseDto {
  flight: {
    id: string;
    flightNumber: string;
    departureCode: string;
    arrivalCode: string;
    departureDateTime: string;
    arrivalDateTime: string;
    airline?: string;
    amadeusOfferPayload?: any;
  };
}
```

### QR Code Data

For the static QR code, we'll use a simple library to generate a QR code containing the booking locator:

```typescript
interface QRCodeData {
  bookingId: string;
  locator: string;
  passengerCount: number;
}
```

## API Integration

### Existing Endpoint (Already Implemented)

```
GET /api/bookings/:id
```

**Response:** Returns booking with relations loaded (customer, flight, passengers, payments)

**Note:** The backend already loads flight details via relations, so no API changes needed.

## Routing

### New Route

```typescript
// In App.tsx
<Route path="/minhas-reservas/:bookingId" element={<BookingDetailPage />} />
```

### Navigation Flow

1. User clicks on `BookingCard` in `BookingHistoryPage`
2. Navigate to `/minhas-reservas/:bookingId`
3. `BookingDetailPage` loads and fetches data
4. Back button returns to `/minhas-reservas` (history page)

## State Management

### Custom Hook: useBookingDetail

**Location:** `app/src/hooks/useBookingDetail.ts`

```typescript
interface UseBookingDetailReturn {
  booking: BookingDetailResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useBookingDetail(bookingId: string): UseBookingDetailReturn
```

**Implementation:**
- Uses React Query for data fetching and caching
- Calls `bookingApi.getBookingById(bookingId)`
- Handles loading, error, and success states
- Provides refetch capability

### API Service Extension

**Location:** `app/src/services/bookingApi.ts`

Add method:
```typescript
async getBookingById(bookingId: string): Promise<BookingDetailResponse>
```

## UI/UX Design

### Visual Design Principles

1. **Realistic Boarding Pass Aesthetic**
   - Use airline-inspired design patterns
   - Blue accent color for aviation theme
   - Clean typography with clear hierarchy
   - Adequate white space for readability

2. **Responsive Design**
   - Desktop: Horizontal boarding pass layout
   - Tablet: Slightly condensed layout
   - Mobile: Vertical stacked layout

3. **Accessibility**
   - High contrast text
   - ARIA labels for screen readers
   - Keyboard navigation support
   - Focus indicators

### Color Palette

- Primary Blue: `#1976d2` (Accent bar, buttons)
- Background: `#ffffff` (Card background)
- Text Primary: `#212121`
- Text Secondary: `#757575`
- Success: `#4caf50` (Paid status)
- Warning: `#ff9800` (Awaiting payment)
- Error: `#f44336` (Cancelled)

### Typography

- Heading: Roboto Bold, 24px
- Subheading: Roboto Medium, 18px
- Body: Roboto Regular, 14px
- Caption: Roboto Regular, 12px

## QR Code Implementation

### Library Choice

Use `qrcode.react` library for generating QR codes

```bash
npm install qrcode.react
```

### QR Code Content

The QR code will encode a simple JSON string with booking information:

```json
{
  "bookingId": "abc123",
  "locator": "ABC123DEF",
  "type": "boarding_pass"
}
```

**Note:** This is a static visual element for UX purposes. It doesn't need to be scannable or functional for MVP.

## Download & Share Functionality

### Download Feature

**Implementation Approach:**
1. Use `html2canvas` library to capture the boarding pass component as an image
2. Convert to blob and trigger download
3. Filename format: `boarding-pass-{bookingId}.png`

```bash
npm install html2canvas
```

### Share Feature

**Implementation Approach:**
1. Use Web Share API if available (mobile devices)
2. Fallback to copy link to clipboard
3. Show success toast notification

```typescript
if (navigator.share) {
  await navigator.share({
    title: 'My Boarding Pass',
    text: `Booking ${bookingId}`,
    url: window.location.href
  });
} else {
  // Copy link to clipboard
  await navigator.clipboard.writeText(window.location.href);
}
```

## Error Handling

### Error Scenarios

1. **Booking Not Found (404)**
   - Display: "Reserva não encontrada"
   - Action: Button to return to booking history

2. **Network Error**
   - Display: "Erro ao carregar reserva. Tente novamente."
   - Action: Retry button

3. **Unauthorized (401)**
   - Redirect to login page
   - Preserve return URL for post-login redirect

4. **Server Error (500)**
   - Display: "Erro no servidor. Tente novamente mais tarde."
   - Action: Return to booking history button

### Error Component

```typescript
<ErrorDisplay
  title="Erro ao carregar reserva"
  message={error.message}
  onRetry={refetch}
  onBack={() => navigate('/bookings')}
/>
```

## Testing Strategy

### Unit Tests

1. **BoardingPassCard.test.tsx**
   - Renders with correct flight information
   - Displays all passenger names
   - Shows QR code
   - Formats dates and times correctly

2. **useBookingDetail.test.ts**
   - Fetches booking data successfully
   - Handles loading state
   - Handles error state
   - Caches data appropriately

3. **BookingDetailPage.test.tsx**
   - Renders loading state
   - Renders error state
   - Renders booking details when loaded
   - Navigation back to history works

### Integration Tests

1. Click booking card → navigates to detail page
2. Detail page loads booking data from API
3. Download button generates image file
4. Share button triggers share dialog or copies link
5. Back button returns to booking history

### Visual Regression Tests

- Boarding pass card appearance
- Responsive layouts (desktop, tablet, mobile)
- Different booking statuses (colors and labels)

## Performance Considerations

1. **Code Splitting**
   - Lazy load BookingDetailPage component
   - Lazy load html2canvas library (only when download is triggered)

2. **Caching**
   - React Query caches booking data
   - Cache time: 5 minutes
   - Stale time: 1 minute

3. **Image Optimization**
   - QR code generated at optimal size (200x200px)
   - Boarding pass card optimized for download

4. **Loading States**
   - Skeleton loaders for smooth UX
   - Progressive rendering of components

## Security Considerations

1. **Authorization**
   - Verify user owns the booking before displaying
   - Backend already filters by userId

2. **Data Sanitization**
   - Sanitize passenger names and data before display
   - Prevent XSS in dynamic content

3. **URL Parameters**
   - Validate bookingId format (UUID)
   - Handle malformed URLs gracefully

## Accessibility

1. **ARIA Labels**
   - Boarding pass card: `aria-label="Cartão de embarque"`
   - QR code: `aria-label="Código QR do embarque"`
   - Action buttons: Clear labels

2. **Keyboard Navigation**
   - All interactive elements focusable
   - Logical tab order
   - Enter/Space to activate buttons

3. **Screen Reader Support**
   - Semantic HTML structure
   - Alt text for images and icons
   - Status announcements for loading/error states

4. **Color Contrast**
   - WCAG AA compliance (4.5:1 for normal text)
   - Status indicators use both color and text

## Internationalization (i18n)

All text strings should be in Portuguese (pt-BR) as per the existing application:

- "Seu Cartão de Embarque"
- "Passageiros"
- "Data"
- "Localizador"
- "Detalhes do Pagamento"
- "Baixar Cartão"
- "Compartilhar"

## Future Enhancements

1. **Multi-segment Flights**
   - Support for connecting flights
   - Multiple boarding passes per booking

2. **Wallet Integration**
   - Add to Apple Wallet
   - Add to Google Pay

3. **Real-time Updates**
   - Flight status updates
   - Gate changes
   - Delay notifications

4. **Email Boarding Pass**
   - Send boarding pass via email
   - PDF attachment option

5. **Print Optimization**
   - Print-friendly CSS
   - Optimized layout for printing

## Dependencies

### New Dependencies

```json
{
  "qrcode.react": "^3.1.0",
  "html2canvas": "^1.4.1"
}
```

### Existing Dependencies (Already in project)

- React Router DOM (routing)
- Material-UI (UI components)
- React Query (data fetching)
- Axios (HTTP client)

## Implementation Notes

1. **Reuse Existing Components**
   - Use existing `BookingCard` styling patterns
   - Reuse status chip component
   - Leverage existing API service structure

2. **Consistent Styling**
   - Follow Material-UI theme
   - Use existing color palette
   - Maintain consistent spacing (8px grid)

3. **Code Organization**
   - Keep boarding pass logic separate from booking history
   - Create reusable sub-components
   - Follow existing project structure

4. **Backend Compatibility**
   - No backend changes required
   - Use existing GET /bookings/:id endpoint
   - Flight data already included in response via relations
