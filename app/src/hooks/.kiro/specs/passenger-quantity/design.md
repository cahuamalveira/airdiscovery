# Design Document - Passenger Quantity Feature

## Overview

This design document outlines the implementation approach for adding multi-passenger support to the AIR Discovery platform. The feature will enable users to specify the number and composition of travelers (adults and children with ages), apply Brazilian legislation-based pricing rules, and collect complete passenger data during checkout.

The implementation spans three main areas:
1. **Chatbot Flow Enhancement**: Extend the conversation to collect passenger composition data
2. **Backend Business Logic**: Implement age-based pricing rules and passenger data structures
3. **Checkout Flow Adaptation**: Dynamically generate forms for all passengers

## Architecture

### High-Level Component Interaction

```
┌─────────────────┐
│   Chatbot UI    │
│  (ChatPageV2)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      ChatbotService (Backend)           │
│  - Collects passenger composition       │
│  - Validates passenger data              │
│  - Stores in CollectedData               │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      FlightsService (Backend)           │
│  - Receives passenger counts             │
│  - Calls Amadeus API with correct params │
│  - Returns flight offers                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      CheckoutPage (Frontend)            │
│  - Reads passenger composition           │
│  - Generates N passenger forms           │
│  - Validates all passenger data          │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      BookingService (Backend)           │
│  - Receives all passenger data           │
│  - Applies pricing rules                 │
│  - Creates booking with passengers       │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Collection Phase**: Chatbot collects passenger composition after budget question
2. **Storage Phase**: Passenger data stored in `CollectedData` interface
3. **Search Phase**: Passenger counts passed to Amadeus API for accurate flight pricing
4. **Checkout Phase**: Frontend reads passenger composition and generates forms
5. **Booking Phase**: All passenger data validated and persisted

## Components and Interfaces

### 1. Chatbot Module Changes

#### 1.1 Extended CollectedData Interface

**File**: `backend/airdiscovery/src/modules/chatbot/interfaces/json-response.interface.ts`

```typescript
export interface PassengerComposition {
  readonly adults: number;
  readonly children: readonly ChildPassenger[] | null;
}

export interface ChildPassenger {
  readonly age: number;
  readonly isPaying: boolean; // Calculated: age > 2
}

export interface CollectedData {
  // ... existing fields
  readonly passenger_composition: PassengerComposition | null;
}
```

**Rationale**: 
- Separate interface for passenger composition keeps data organized
- `ChildPassenger` includes `isPaying` flag for easy budget calculations
- Immutable structure aligns with existing `CollectedData` pattern

#### 1.2 New Conversation Stage

```typescript
export type ConversationStage = 
  | 'collecting_origin' 
  | 'collecting_budget'
  | 'collecting_passengers'  // NEW
  | 'collecting_availability'
  | 'collecting_activities' 
  | 'collecting_purpose' 
  | 'collecting_hobbies' 
  | 'recommendation_ready'
  | 'error';

export type NextQuestionKey = 
  | 'origin' 
  | 'budget'
  | 'passengers'  // NEW
  | 'availability'
  | 'activities' 
  | 'purpose' 
  | 'hobbies' 
  | null;
```

#### 1.2.1 Button Options in Response

**File**: `backend/airdiscovery/src/modules/chatbot/interfaces/json-response.interface.ts`

```typescript
export interface ButtonOption {
  readonly label: string;
  readonly value: string;
}

export interface ChatbotJsonResponse {
  readonly conversation_stage: ConversationStage;
  readonly data_collected: CollectedData;
  readonly next_question_key: NextQuestionKey;
  readonly assistant_message: string;
  readonly is_final_recommendation: boolean;
  readonly button_options?: readonly ButtonOption[];  // NEW: For interactive buttons
}
```

#### 1.3 Chatbot Prompt Updates

**File**: `backend/airdiscovery/src/modules/chatbot/utils/json-prompt-builder.ts`

The system prompt must be updated to include passenger collection logic:

**New Conversation Flow**:
1. Origin collection (existing)
2. Budget collection (existing)
3. **Passenger composition collection** (NEW)
   - Ask: "Quantas pessoas vão viajar?"
   - Provide button options for adults: "1 adulto", "2 adultos", "3 adultos", "4 adultos", "Mais..."
   - If "Mais..." selected, ask for specific number via text input
   - Then ask: "E quantas crianças?" with buttons: "Nenhuma", "1 criança", "2 crianças", "3 crianças", "Mais..."
   - If children > 0, ask for each child's age with button options: "0-2 anos", "3-5 anos", "6-11 anos", "12-17 anos"
4. Availability collection (existing)
5. Activities, purpose, hobbies (existing)

**Prompt Instructions for LLM**:
```
When collecting passenger information:
- ALWAYS provide button options for user selection (do not ask for free text input)
- First ask for number of adults with buttons: "1 adulto", "2 adultos", "3 adultos", "4 adultos", "Mais..."
- Then ask for number of children with buttons: "Nenhuma", "1 criança", "2 crianças", "3 crianças", "Mais..."
- If children > 0, ask for EACH child's age with button options: "0-2 anos", "3-5 anos", "6-11 anos", "12-17 anos"
- For age ranges, store the middle value (e.g., "0-2 anos" = 1, "3-5 anos" = 4, "6-11 anos" = 8, "12-17 anos" = 14)
- Store in passenger_composition field
- Calculate isPaying flag: children > 2 years are paying passengers
- Validate: at least 1 adult must be present
- Validate: child ages must be between 0-17
```

#### 1.4 Stage Calculation Logic

**File**: `backend/airdiscovery/src/modules/chatbot/chatbot.service.ts`

Update `calculateCorrectStage()` method:

```typescript
private calculateCorrectStage(data: CollectedData, isFinalRecommendation: boolean): ConversationStage {
  if (isFinalRecommendation) {
    return 'recommendation_ready';
  }
  
  if (!data.origin_name || !data.origin_iata) {
    return 'collecting_origin';
  }
  if (!data.budget_in_brl) {
    return 'collecting_budget';
  }
  // NEW: Check passenger composition
  if (!data.passenger_composition || !data.passenger_composition.adults) {
    return 'collecting_passengers';
  }
  if (!data.availability_months || data.availability_months.length === 0) {
    return 'collecting_availability';
  }
  // ... rest of stages
}
```

### 2. Flight Search Integration

#### 2.1 Amadeus API Parameters

**File**: `backend/airdiscovery/src/common/amadeus/amadeus-client.service.ts`

Update `searchFlightOffers()` method signature:

```typescript
async searchFlightOffers(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;      // NEW: Children > 2 years
  infants?: number;       // NEW: Children <= 2 years
  nonStop?: boolean;
  max?: number;
}): Promise<AmadeusFlightSearchResponse>
```

**Implementation Notes**:
- Amadeus API supports `adults`, `children`, and `infants` parameters
- Children parameter: ages 2-11
- Infants parameter: ages 0-1 (lap infants)
- Validation: infants count cannot exceed adults count
- **IMPORTANT**: Amadeus returns `price.total` as the **total price for ALL passengers**, not per-person
- Frontend must calculate per-person pricing by dividing total by number of paying passengers

#### 2.2 ChatbotService Flight Search Helper

**File**: `backend/airdiscovery/src/modules/chatbot/chatbot.service.ts`

Update `getFlightSearchParamsFromSession()` method:

```typescript
async getFlightSearchParamsFromSession(
  sessionId: string,
  tripDuration: number = 7
): Promise<{
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children?: number;    // NEW
  infants?: number;     // NEW
} | null> {
  const session = await this.getChatSession(sessionId);
  if (!session || !session.collectedData) {
    return null;
  }

  const data = session.collectedData;
  const composition = data.passenger_composition;

  // Calculate children and infants
  let childrenCount = 0;
  let infantsCount = 0;
  
  if (composition?.children) {
    for (const child of composition.children) {
      if (child.age <= 2) {
        infantsCount++;
      } else {
        childrenCount++;
      }
    }
  }

  const dateRange = convertAvailabilityToDateRange(
    data.availability_months,
    tripDuration
  );

  return {
    originLocationCode: data.origin_iata,
    destinationLocationCode: data.destination_iata,
    departureDate: dateRange.departureDate,
    returnDate: dateRange.returnDate,
    adults: composition?.adults || 1,
    ...(childrenCount > 0 && { children: childrenCount }),
    ...(infantsCount > 0 && { infants: infantsCount })
  };
}
```

### 3. Budget Calculation Logic

#### 3.1 Business Rules Implementation

**Location**: New utility file `backend/airdiscovery/src/modules/chatbot/utils/passenger-pricing.util.ts`

```typescript
export interface PricingCalculation {
  totalPassengers: number;
  payingPassengers: number;
  nonPayingPassengers: number;
  perPersonBudget: number;
  totalBudget: number;
}

export class PassengerPricingUtil {
  /**
   * Calculate pricing based on Brazilian legislation
   * - Infants (0-2 years): Non-paying (lap infants)
   * - Children (>2 years): Paying passengers
   * - Adults: Paying passengers
   */
  static calculatePricing(
    totalBudget: number,
    composition: PassengerComposition
  ): PricingCalculation {
    const adults = composition.adults;
    const children = composition.children || [];
    
    let payingPassengers = adults;
    let nonPayingPassengers = 0;
    
    for (const child of children) {
      if (child.age > 2) {
        payingPassengers++;
      } else {
        nonPayingPassengers++;
      }
    }
    
    const totalPassengers = adults + children.length;
    const perPersonBudget = totalBudget / payingPassengers;
    
    return {
      totalPassengers,
      payingPassengers,
      nonPayingPassengers,
      perPersonBudget,
      totalBudget
    };
  }
  
  /**
   * Validate that budget is sufficient for passenger count
   */
  static validateBudget(
    totalBudget: number,
    composition: PassengerComposition,
    minimumPerPerson: number = 500
  ): { isValid: boolean; message?: string } {
    const pricing = this.calculatePricing(totalBudget, composition);
    
    if (pricing.perPersonBudget < minimumPerPerson) {
      return {
        isValid: false,
        message: `Orçamento insuficiente. Mínimo de R$ ${minimumPerPerson} por passageiro pagante. Você tem R$ ${pricing.perPersonBudget.toFixed(2)} por pessoa.`
      };
    }
    
    return { isValid: true };
  }
}
```

**Usage in Recommendation Generation**:
The LLM prompt should include the per-person budget calculation so recommendations are accurate.

### 4. Frontend Changes

#### 4.1 Pricing Display in RecommendationsPage

**File**: `app/src/pages/RecommendationsPage.tsx`

**Current Issue**: The page displays `offer.price.total` with label "Total por pessoa", but Amadeus returns the total price for ALL passengers, not per-person.

**Solution**: 
1. Fetch passenger composition from session using `sessionId` query parameter
2. Calculate paying passengers count (adults + children > 2 years)
3. Calculate per-person price: `totalPrice / payingPassengers`
4. Update UI to show both total and per-person pricing

**Implementation**:
```typescript
// Add state for passenger composition
const [passengerComposition, setPassengerComposition] = useState<PassengerComposition | null>(null);

// Fetch composition from session
useEffect(() => {
  if (sessionId) {
    fetchPassengerComposition(sessionId).then(setPassengerComposition);
  }
}, [sessionId]);

// Calculate paying passengers
const payingPassengers = useMemo(() => {
  if (!passengerComposition) return 1; // Default
  
  let count = passengerComposition.adults;
  if (passengerComposition.children) {
    count += passengerComposition.children.filter(c => c.age > 2).length;
  }
  return count;
}, [passengerComposition]);

// Display pricing
<Box sx={{ textAlign: 'right' }}>
  <Typography variant="h5" color="primary" fontWeight="bold">
    {formatCurrency(parseFloat(offer.price.total) * 100)}
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Total para {payingPassengers} passageiro(s)
  </Typography>
  {payingPassengers > 1 && (
    <Typography variant="caption" color="text.disabled">
      R$ {(parseFloat(offer.price.total) / payingPassengers).toFixed(2)} por pessoa
    </Typography>
  )}
</Box>
```

#### 4.2 Chatbot UI - Button Interface

**File**: `app/src/components/chat/ChatInterface.tsx` (or similar)

**New Feature**: Button-based passenger selection

The chatbot UI must render interactive buttons when the LLM response includes button options. This requires:

1. **Response Format**: LLM should return button options in a structured format
2. **Button Rendering**: Frontend renders buttons instead of text input
3. **Button Click Handler**: Sends selected option as user message

**Example Response Structure**:
```json
{
  "assistant_message": "Quantas pessoas vão viajar? Primeiro, me diga quantos adultos:",
  "button_options": [
    { "label": "1 adulto", "value": "1" },
    { "label": "2 adultos", "value": "2" },
    { "label": "3 adultos", "value": "3" },
    { "label": "4 adultos", "value": "4" },
    { "label": "Mais...", "value": "more" }
  ]
}
```

**UI Implementation**:
```tsx
{message.buttonOptions && (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
    {message.buttonOptions.map((option) => (
      <Button
        key={option.value}
        variant="outlined"
        onClick={() => handleButtonClick(option.value, option.label)}
      >
        {option.label}
      </Button>
    ))}
  </Box>
)}
```

#### 4.3 Frontend Passenger Form Component

**File**: `app/src/components/checkout/PassengerForm.tsx`

**Current State**: Single passenger form with hardcoded fields

**New Design**: Dynamic multi-passenger form

```typescript
interface PassengerFormProps {
  passengerCount: number;           // NEW: Total passengers
  passengerTypes: PassengerType[];  // NEW: Array of types (adult/child/infant)
  onSubmit: (data: PassengerFormData[]) => void;  // Array of passengers
  loading?: boolean;
  defaultValues?: Partial<PassengerFormData>;
}

interface PassengerType {
  index: number;
  type: 'adult' | 'child' | 'infant';
  age?: number;  // For children/infants
}
```

**Component Structure**:
```tsx
<Box>
  {passengerTypes.map((passenger, index) => (
    <Card key={index}>
      <CardContent>
        <Typography variant="h6">
          {passenger.type === 'adult' ? 'Adulto' : 
           passenger.type === 'child' ? `Criança (${passenger.age} anos)` :
           `Bebê (${passenger.age} anos)`}
          {index === 0 && ' (Passageiro Principal)'}
        </Typography>
        
        {/* Form fields for this passenger */}
        <TextField name={`passengers[${index}].firstName`} ... />
        <TextField name={`passengers[${index}].lastName`} ... />
        <TextField name={`passengers[${index}].email`} ... />
        <TextField name={`passengers[${index}].phone`} ... />
        <TextField name={`passengers[${index}].document`} ... />
        <TextField name={`passengers[${index}].birthDate`} ... />
      </CardContent>
    </Card>
  ))}
</Box>
```

#### 4.4 Validation Schema Update

**File**: `app/src/components/checkout/PassengerForm.tsx`

```typescript
const passengerSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  lastName: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  email: z.string().email(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
  document: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 120;  // Changed: Allow all ages
    }, 'Idade inválida')
});

// NEW: Array schema for multiple passengers
const multiPassengerSchema = z.object({
  passengers: z.array(passengerSchema).min(1)
});
```

#### 4.5 CheckoutPage Integration

**File**: `app/src/pages/CheckoutPage.tsx`

**Data Flow**:
1. Read passenger composition from chat session or booking context
2. Generate `PassengerType[]` array based on composition
3. Pass to `PassengerForm` component
4. Collect all passenger data
5. Submit to booking API

```typescript
const CheckoutPage: React.FC = () => {
  const { flightId, sessionId } = useParams();
  const [passengerComposition, setPassengerComposition] = useState<PassengerComposition | null>(null);
  
  // Fetch passenger composition from chat session
  useEffect(() => {
    if (sessionId) {
      fetchChatSession(sessionId).then(session => {
        setPassengerComposition(session.collectedData.passenger_composition);
      });
    }
  }, [sessionId]);
  
  // Generate passenger types array
  const passengerTypes = useMemo(() => {
    if (!passengerComposition) return [];
    
    const types: PassengerType[] = [];
    
    // Add adults
    for (let i = 0; i < passengerComposition.adults; i++) {
      types.push({ index: types.length, type: 'adult' });
    }
    
    // Add children
    if (passengerComposition.children) {
      for (const child of passengerComposition.children) {
        types.push({
          index: types.length,
          type: child.age <= 2 ? 'infant' : 'child',
          age: child.age
        });
      }
    }
    
    return types;
  }, [passengerComposition]);
  
  return (
    <PassengerForm
      passengerCount={passengerTypes.length}
      passengerTypes={passengerTypes}
      onSubmit={handlePassengerSubmit}
    />
  );
};
```

### 5. Booking Service Updates

#### 5.1 DTO Updates

**File**: `backend/airdiscovery/src/modules/bookings/dto/booking.dto.ts`

```typescript
export class PassengerDataDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  document: string;

  @IsDateString()
  birthDate: string;
  
  // NEW: Passenger type for validation
  @IsEnum(['adult', 'child', 'infant'])
  @IsOptional()
  passengerType?: 'adult' | 'child' | 'infant';
}

export class CreateBookingDto {
  @IsUUID()
  flightId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDataDto)
  @ArrayMinSize(1)
  passengers: PassengerDataDto[];  // Now supports multiple passengers

  @IsNumber()
  @Min(0)
  totalAmount: number;
}
```

#### 5.2 Validation Logic Updates

**File**: `backend/airdiscovery/src/modules/bookings/booking.service.ts`

Update `validateBookingData()` method:

```typescript
private async validateBookingData(createBookingDto: CreateBookingDto): Promise<void> {
  // Validate total amount
  if (createBookingDto.totalAmount <= 0) {
    throw new BadRequestException('Valor total deve ser maior que zero');
  }

  // Validate passengers
  if (!createBookingDto.passengers || createBookingDto.passengers.length === 0) {
    throw new BadRequestException('Ao menos um passageiro é obrigatório');
  }
  
  // NEW: Validate at least one adult
  const adults = createBookingDto.passengers.filter(p => {
    const age = this.calculateAge(p.birthDate);
    return age >= 12;  // Adults are 12+
  });
  
  if (adults.length === 0) {
    throw new BadRequestException('Ao menos um adulto é obrigatório');
  }
  
  // NEW: Validate infant count doesn't exceed adult count
  const infants = createBookingDto.passengers.filter(p => {
    const age = this.calculateAge(p.birthDate);
    return age < 2;
  });
  
  if (infants.length > adults.length) {
    throw new BadRequestException('Número de bebês não pode exceder número de adultos');
  }

  // Validate each passenger
  for (const p of createBookingDto.passengers) {
    const age = this.calculateAge(p.birthDate);
    
    if (age < 0 || age > 120) {
      throw new BadRequestException(`Idade inválida para passageiro ${p.firstName}`);
    }
    
    if (!this.isValidCPF(p.document)) {
      throw new BadRequestException(`CPF inválido para passageiro ${p.firstName}`);
    }
  }
}

private calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
```

## Data Models

### Database Schema Changes

**No database schema changes required**. The existing `Passenger` entity already supports multiple passengers per booking through the one-to-many relationship:

```typescript
// Existing in booking.entity.ts
@OneToMany(() => Passenger, (passenger) => passenger.booking, {
  cascade: true,
  eager: true,
})
passengers: Passenger[];
```

The current schema is already designed to handle multiple passengers.

## Error Handling

### Validation Errors

1. **Chatbot Level**:
   - Invalid passenger counts (e.g., 0 adults)
   - Invalid child ages (< 0 or > 17)
   - Budget insufficient for passenger count

2. **API Level**:
   - Amadeus API: Infants > adults
   - Amadeus API: Invalid passenger counts

3. **Booking Level**:
   - Missing passenger data
   - Invalid CPF/document
   - Age validation failures

### Error Messages

All error messages should be user-friendly and in Portuguese:

```typescript
const ERROR_MESSAGES = {
  NO_ADULTS: 'É necessário pelo menos um adulto na viagem',
  INVALID_CHILD_AGE: 'Idade da criança deve estar entre 0 e 17 anos',
  TOO_MANY_INFANTS: 'Número de bebês não pode exceder o número de adultos',
  INSUFFICIENT_BUDGET: 'Orçamento insuficiente para o número de passageiros',
  INVALID_PASSENGER_DATA: 'Dados do passageiro incompletos ou inválidos'
};
```

## Testing Strategy

### Unit Tests

1. **PassengerPricingUtil**:
   - Test pricing calculations for various passenger compositions
   - Test budget validation logic
   - Test edge cases (0 children, all infants, etc.)

2. **ChatbotService**:
   - Test passenger composition collection flow
   - Test stage calculation with passenger data
   - Test data validation

3. **BookingService**:
   - Test multi-passenger booking creation
   - Test passenger validation logic
   - Test age calculation

### Integration Tests

1. **Chatbot Flow**:
   - Complete conversation flow with passenger collection
   - Verify passenger data stored correctly
   - Verify budget recalculation

2. **Flight Search**:
   - Search with multiple passengers
   - Verify correct Amadeus API parameters
   - Verify pricing reflects passenger count

3. **Checkout Flow**:
   - Submit booking with multiple passengers
   - Verify all passenger data persisted
   - Verify payment amount calculation

### E2E Tests

1. Complete user journey:
   - Chat conversation with passenger collection
   - Flight search with multiple passengers
   - Checkout with all passenger forms
   - Booking confirmation

## Performance Considerations

1. **Chatbot Responses**: No significant performance impact expected. Passenger collection adds 1-2 additional conversation turns.

2. **Flight Search**: Amadeus API performance should be similar regardless of passenger count.

3. **Checkout Rendering**: Dynamic form generation for up to 9 passengers (typical max) should have negligible performance impact.

4. **Database**: No additional queries required. Passenger data is saved in a single transaction with the booking.

## Security Considerations

1. **Data Validation**: All passenger data must be validated on both frontend and backend.

2. **PII Protection**: Passenger data (names, documents, birthdates) is sensitive and must be:
   - Transmitted over HTTPS only
   - Stored securely in database
   - Not logged in application logs
   - Masked in error messages

3. **Authorization**: Users should only access their own passenger data and bookings.

## Migration Strategy

### Phase 1: Backend Foundation
- Add passenger composition to `CollectedData` interface
- Update chatbot prompt and stage logic
- Implement pricing utility
- Update Amadeus client

### Phase 2: Chatbot Integration
- Deploy updated chatbot with passenger collection
- Test conversation flow
- Monitor for errors

### Phase 3: Frontend Updates
- Update `PassengerForm` component for multiple passengers
- Update `CheckoutPage` to read passenger composition
- Update validation schemas

### Phase 4: Booking Integration
- Update booking service validation
- Test end-to-end flow
- Deploy to production

### Backward Compatibility

**Existing bookings**: No migration needed. Existing single-passenger bookings will continue to work.

**Default behavior**: If passenger composition is not provided, system defaults to 1 adult (current behavior).

## Open Questions

1. **Maximum passenger limit**: Should we enforce a maximum number of passengers per booking? (Suggested: 9 passengers)

2. **Infant pricing**: Should we allow users to optionally purchase a seat for infants? (Current design: lap infants only)

3. **Group discounts**: Should we implement group pricing discounts for large parties? (Out of scope for initial implementation)

4. **Passenger profiles**: Should we allow users to save passenger profiles for faster checkout? (Future enhancement)
