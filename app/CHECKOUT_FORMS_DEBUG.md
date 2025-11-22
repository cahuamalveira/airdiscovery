# Checkout Forms Not Rendering - Debug & Fix Guide

## Issue Description

The checkout page is not rendering individual forms for all passengers when multiple passengers are in the booking.

**Expected Behavior:**
- User books flight for 2 adults + 1 child (3 passengers)
- Checkout page should show 3 separate passenger forms
- Each form should have: firstName, lastName, email, phone, document, birthDate

**Current Behavior:**
- Only showing 1 passenger form (single passenger mode)
- Not rendering forms for all passengers

## Root Cause Analysis

### Potential Issues

1. **passengerComposition not being fetched correctly**
   - sessionId might not be in URL
   - API endpoint might be failing
   - Data structure mismatch

2. **passengerTypes array is empty**
   - passengerComposition is null/undefined
   - Logic error in generating passengerTypes array
   - Timing issue (component renders before data loads)

3. **PassengerForm conditional logic failing**
   - `isMultiPassenger` condition not working
   - passengerTypes prop not being passed correctly
   - Component defaulting to single passenger mode

## Debugging Steps

### Step 1: Verify sessionId is in URL

**Location:** `app/src/pages/CheckoutPage.tsx`

Add logging:
```typescript
const [searchParams] = useSearchParams();
const sessionId = searchParams.get('sessionId');

console.log('=== CHECKOUT DEBUG ===');
console.log('sessionId from URL:', sessionId);
console.log('flightId from params:', flightId);
```

**Expected:** sessionId should be a valid UUID string
**If null:** The issue is in RecommendationsPage not passing sessionId to checkout URL

### Step 2: Verify passenger composition fetch

**Location:** `app/src/pages/CheckoutPage.tsx` - useEffect for fetching composition

Add logging:
```typescript
useEffect(() => {
  const fetchPassengerComposition = async () => {
    if (!sessionId) {
      console.log('⚠️ No sessionId provided, using default single passenger');
      setPassengerComposition({ adults: 1, children: null });
      return;
    }

    console.log('📡 Fetching passenger composition for session:', sessionId);
    setLoadingComposition(true);
    setCompositionError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = `${apiUrl}/sessions/collected-data/${sessionId}`;
      console.log('Fetching from URL:', url);
      
      const response = await httpInterceptor.get(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch session data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Session data received:', data);
      
      const composition = data.collectedData?.passenger_composition;
      console.log('👥 Passenger composition:', composition);

      if (composition && composition.adults > 0) {
        setPassengerComposition(composition);
        console.log('✅ Passenger composition loaded:', composition);
      } else {
        setPassengerComposition({ adults: 1, children: null });
        console.log('⚠️ No passenger composition found, using default');
      }
    } catch (error) {
      console.error('❌ Error fetching passenger composition:', error);
      setCompositionError('Não foi possível carregar os dados dos passageiros');
      setPassengerComposition({ adults: 1, children: null });
    } finally {
      setLoadingComposition(false);
    }
  };

  fetchPassengerComposition();
}, [sessionId, httpInterceptor]);
```

**Expected:** 
- Should log the composition object with adults and children
- Example: `{ adults: 2, children: [{ age: 5, isPaying: true }] }`

**If error:** Check backend endpoint `/sessions/collected-data/:sessionId`

### Step 3: Verify passengerTypes array generation

**Location:** `app/src/pages/CheckoutPage.tsx` - passengerTypes useMemo

Add logging:
```typescript
const passengerTypes = useMemo((): PassengerType[] => {
  console.log('🔄 Generating passengerTypes from composition:', passengerComposition);
  
  if (!passengerComposition) {
    console.log('⚠️ No composition, returning empty array');
    return [];
  }

  const types: PassengerType[] = [];

  // Add adults
  console.log(`Adding ${passengerComposition.adults} adults`);
  for (let i = 0; i < passengerComposition.adults; i++) {
    types.push({ index: types.length, type: 'adult' });
  }

  // Add children
  if (passengerComposition.children) {
    console.log(`Adding ${passengerComposition.children.length} children`);
    for (const child of passengerComposition.children) {
      const passengerType = child.age <= 2 ? 'infant' : 'child';
      console.log(`  - Child age ${child.age} -> ${passengerType}`);
      types.push({
        index: types.length,
        type: passengerType,
        age: child.age
      });
    }
  }

  console.log('✅ Generated passengerTypes:', types);
  return types;
}, [passengerComposition]);

const passengerCount = useMemo(() => {
  const count = passengerTypes.length;
  console.log('👥 Total passenger count:', count);
  return count;
}, [passengerTypes]);
```

**Expected:**
- For 2 adults + 1 child (age 5): Should generate 3 PassengerType objects
- Array should look like:
  ```javascript
  [
    { index: 0, type: 'adult' },
    { index: 1, type: 'adult' },
    { index: 2, type: 'child', age: 5 }
  ]
  ```

### Step 4: Verify PassengerForm receives correct props

**Location:** `app/src/pages/CheckoutPage.tsx` - PassengerForm component

Add logging before rendering:
```typescript
{activeStep === 0 && (
  <>
    {(() => {
      console.log('📝 Rendering PassengerForm with:');
      console.log('  - passengerCount:', passengerCount);
      console.log('  - passengerTypes:', passengerTypes);
      console.log('  - passengerTypes.length:', passengerTypes?.length);
      return null;
    })()}
    
    {compositionError && (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {compositionError}
      </Alert>
    )}
    
    <PassengerForm
      onSubmit={handlePassengerSubmit}
      loading={bookingLoading}
      passengerCount={passengerCount}
      passengerTypes={passengerTypes}
      defaultValues={{...}}
    />
  </>
)}
```

### Step 5: Verify PassengerForm conditional logic

**Location:** `app/src/components/checkout/PassengerForm.tsx`

Add logging at the top of the component:
```typescript
export const PassengerForm: React.FC<PassengerFormProps> = ({
  onSubmit,
  loading = false,
  defaultValues = {},
  passengerCount,
  passengerTypes
}) => {
  console.log('🎨 PassengerForm rendered with:');
  console.log('  - passengerCount:', passengerCount);
  console.log('  - passengerTypes:', passengerTypes);
  console.log('  - passengerTypes?.length:', passengerTypes?.length);
  
  // Determina se é modo múltiplos passageiros
  const isMultiPassenger = passengerTypes && passengerTypes.length > 0;
  console.log('  - isMultiPassenger:', isMultiPassenger);
  
  if (isMultiPassenger) {
    console.log('✅ Using MULTI-PASSENGER mode');
  } else {
    console.log('⚠️ Using SINGLE-PASSENGER mode');
  }
  
  // ... rest of component
```

## Common Issues & Fixes

### Issue 1: sessionId not in URL

**Symptom:** Console shows "No sessionId provided"

**Fix:** Update RecommendationsPage to pass sessionId when navigating to checkout

```typescript
// In RecommendationsPage.tsx - handleFlightSelection
const checkoutUrl = sessionId 
  ? `/checkout/${flightId}?sessionId=${sessionId}`
  : `/checkout/${flightId}`;

console.log('Navigating to checkout:', checkoutUrl);
navigate(checkoutUrl);
```

**Verify:** Check that sessionId is in the URL params when you reach checkout

### Issue 2: API endpoint returns wrong data structure

**Symptom:** Console shows "No passenger composition found" even though data was collected

**Fix:** Verify the backend endpoint returns data in correct format:

```typescript
// Expected response structure:
{
  "collectedData": {
    "passenger_composition": {
      "adults": 2,
      "children": [
        { "age": 5, "isPaying": true }
      ]
    }
  }
}
```

**Check backend:** `backend/airdiscovery/src/modules/chatbot/sessions.controller.ts`

### Issue 3: passengerTypes array is empty due to timing

**Symptom:** passengerTypes is `[]` when PassengerForm renders

**Fix:** Add loading state check before rendering PassengerForm

```typescript
// In CheckoutPage.tsx
if (flightLoading || loadingComposition) {
  return (
    <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {flightLoading ? 'Carregando dados do voo...' : 'Carregando dados dos passageiros...'}
      </Typography>
    </Container>
  );
}

// Only render form after composition is loaded
{activeStep === 0 && passengerTypes.length > 0 && (
  <PassengerForm
    passengerCount={passengerCount}
    passengerTypes={passengerTypes}
    // ... other props
  />
)}
```

### Issue 4: PassengerForm condition is too strict

**Symptom:** isMultiPassenger is false even when passengerTypes has items

**Fix:** Update the condition in PassengerForm.tsx

```typescript
// Current (might be failing):
const isMultiPassenger = passengerTypes && passengerTypes.length > 0;

// More defensive:
const isMultiPassenger = Boolean(passengerTypes && passengerTypes.length > 1);

// Or use passengerCount as fallback:
const isMultiPassenger = (passengerTypes && passengerTypes.length > 1) || (passengerCount && passengerCount > 1);
```

### Issue 5: defaultValues breaking multi-passenger form

**Symptom:** Forms render but validation fails or data doesn't submit

**Fix:** Only apply defaultValues to first passenger

```typescript
// In CheckoutPage.tsx
<PassengerForm
  onSubmit={handlePassengerSubmit}
  loading={bookingLoading}
  passengerCount={passengerCount}
  passengerTypes={passengerTypes}
  defaultValues={passengerTypes.length > 0 ? {
    // Only for first passenger
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    document: '',
    birthDate: ''
  } : undefined}
/>
```

**In PassengerForm.tsx:**
```typescript
const multiForm = useForm<{ passengers: PassengerFormData[] }>({
  resolver: zodResolver(multiPassengerSchema),
  mode: 'onChange',
  defaultValues: {
    passengers: passengerTypes?.map((passenger, index) => ({
      // Only first passenger gets defaultValues
      ...(index === 0 ? defaultValues : {}),
      firstName: index === 0 ? (defaultValues?.firstName || '') : '',
      lastName: index === 0 ? (defaultValues?.lastName || '') : '',
      email: index === 0 ? (defaultValues?.email || '') : '',
      phone: '',
      document: '',
      birthDate: '',
    })) || []
  }
});
```

## Testing Checklist

After implementing fixes, test these scenarios:

- [ ] Navigate from chat → recommendations → checkout with sessionId in URL
- [ ] Verify passenger composition is fetched from session
- [ ] Verify correct number of forms render (e.g., 3 forms for 3 passengers)
- [ ] Verify each form has correct label (Adulto, Criança X anos, Bebê X anos)
- [ ] Verify first form pre-fills with user data
- [ ] Verify other forms are empty
- [ ] Fill all forms and submit
- [ ] Verify all passenger data is sent to backend
- [ ] Verify booking is created with all passengers

## Related Files

- `app/src/pages/CheckoutPage.tsx` - Main checkout page
- `app/src/components/checkout/PassengerForm.tsx` - Form component
- `app/src/pages/RecommendationsPage.tsx` - Navigation to checkout
- `backend/airdiscovery/src/modules/chatbot/sessions.controller.ts` - Session data endpoint
- `.kiro/specs/passenger-quantity/tasks.md` - Task 12 (this fix)
