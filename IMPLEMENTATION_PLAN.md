# Multi-Passenger Feature - Implementation Plan

## Quick Start

This document provides a step-by-step implementation plan for completing the multi-passenger booking feature.

## Current Situation

✅ **Backend:** Fully implemented and tested
❌ **Frontend:** Two critical issues need fixing

## Issues to Fix

### 1. Checkout Forms Not Rendering (BLOCKING)
- **File:** `app/CHECKOUT_FORMS_DEBUG.md`
- **Priority:** HIGH (blocks entire feature)
- **Tasks:** Task 12 in `.kiro/specs/passenger-quantity/tasks.md`

### 2. Incorrect Price Display
- **File:** `app/PRICING_DISPLAY_FIX.md`
- **Priority:** HIGH (affects user trust)
- **Tasks:** Task 10 in `.kiro/specs/passenger-quantity/tasks.md`

## Step-by-Step Implementation

### Phase 1: Debug & Fix Checkout Forms (2-3 hours)

#### Step 1.1: Add Debug Logging
**File:** `app/src/pages/CheckoutPage.tsx`

Add console logs to trace the data flow:
```typescript
// At the top of component
console.log('=== CHECKOUT DEBUG ===');
console.log('sessionId:', sessionId);
console.log('flightId:', flightId);

// In useEffect for fetching composition
console.log('📡 Fetching passenger composition...');
console.log('📦 Session data:', data);
console.log('👥 Composition:', composition);

// In passengerTypes useMemo
console.log('🔄 Generating passengerTypes:', passengerComposition);
console.log('✅ Generated:', types);

// Before rendering PassengerForm
console.log('📝 Rendering with passengerTypes:', passengerTypes);
```

**File:** `app/src/components/checkout/PassengerForm.tsx`

```typescript
console.log('🎨 PassengerForm props:', { passengerCount, passengerTypes });
console.log('isMultiPassenger:', isMultiPassenger);
```

#### Step 1.2: Test and Identify Issue

Run the app and navigate through the flow:
1. Start chat → specify multiple passengers
2. Get recommendations → select flight
3. Go to checkout → **check console logs**

Look for:
- Is sessionId in URL? ✓/✗
- Is composition fetched? ✓/✗
- Is passengerTypes array populated? ✓/✗
- Is PassengerForm receiving correct props? ✓/✗

#### Step 1.3: Apply Fix Based on Findings

**If sessionId is missing:**
```typescript
// In RecommendationsPage.tsx - handleFlightSelection
const checkoutUrl = sessionId 
  ? `/checkout/${flightId}?sessionId=${sessionId}`
  : `/checkout/${flightId}`;
navigate(checkoutUrl);
```

**If composition fetch fails:**
- Check backend endpoint: `GET /sessions/collected-data/:sessionId`
- Verify response structure matches expected format
- Add error handling and retry logic

**If passengerTypes is empty:**
```typescript
// Add loading guard in CheckoutPage
if (loadingComposition || !passengerComposition) {
  return <LoadingState />;
}

// Only render form when data is ready
{activeStep === 0 && passengerTypes.length > 0 && (
  <PassengerForm ... />
)}
```

**If PassengerForm condition fails:**
```typescript
// In PassengerForm.tsx - make condition more robust
const isMultiPassenger = Boolean(
  passengerTypes && passengerTypes.length > 1
);

// Or use passengerCount as fallback
const isMultiPassenger = 
  (passengerTypes && passengerTypes.length > 1) || 
  (passengerCount && passengerCount > 1);
```

#### Step 1.4: Fix Default Values

```typescript
// In PassengerForm.tsx - multiForm defaultValues
defaultValues: {
  passengers: passengerTypes?.map((passenger, index) => ({
    // Only first passenger gets user's default values
    firstName: index === 0 ? (defaultValues?.firstName || '') : '',
    lastName: index === 0 ? (defaultValues?.lastName || '') : '',
    email: index === 0 ? (defaultValues?.email || '') : '',
    phone: '',
    document: '',
    birthDate: '',
  })) || []
}
```

#### Step 1.5: Test Fix

Test with different passenger combinations:
- [ ] 1 adult (should show 1 form)
- [ ] 2 adults (should show 2 forms)
- [ ] 2 adults + 1 child (should show 3 forms)
- [ ] 1 adult + 1 infant (should show 2 forms)

Verify:
- [ ] Correct number of forms render
- [ ] Each form has correct label (Adulto, Criança X anos, Bebê X anos)
- [ ] First form pre-fills with user data
- [ ] Other forms are empty
- [ ] All forms validate correctly
- [ ] Submit sends all passenger data

### Phase 2: Fix Price Display (2-3 hours)

#### Step 2.1: Add Passenger Composition Fetch to RecommendationsPage

**File:** `app/src/pages/RecommendationsPage.tsx`

```typescript
// Add state
const [passengerComposition, setPassengerComposition] = useState<PassengerComposition | null>(null);

// Add useEffect to fetch
useEffect(() => {
  if (!sessionId) return;
  
  const fetchComposition = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/sessions/collected-data/${sessionId}`);
      const data = await response.json();
      setPassengerComposition(data.collectedData?.passenger_composition);
    } catch (error) {
      console.error('Error fetching passenger composition:', error);
    }
  };
  
  fetchComposition();
}, [sessionId]);
```

#### Step 2.2: Calculate Paying Passengers

```typescript
// Add useMemo
const payingPassengers = useMemo(() => {
  if (!passengerComposition) return 1;
  
  let count = passengerComposition.adults;
  if (passengerComposition.children) {
    count += passengerComposition.children.filter(c => c.age > 2).length;
  }
  return count;
}, [passengerComposition]);
```

#### Step 2.3: Update Price Display

```typescript
// Replace the price display section (around line 277-282)
<Box sx={{ textAlign: 'right' }}>
  <Typography variant="h5" color="primary" fontWeight="bold">
    {formatCurrency(parseFloat(offer.price.total) * 100)}
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Total para {payingPassengers} passageiro{payingPassengers > 1 ? 's' : ''}
  </Typography>
  {payingPassengers > 1 && (
    <Typography variant="caption" color="text.disabled" display="block">
      {formatCurrency((parseFloat(offer.price.total) / payingPassengers) * 100)} por pessoa
    </Typography>
  )}
</Box>
```

#### Step 2.4: Update PriceSummary Component

**File:** `app/src/components/checkout/PriceSummary.tsx`

Add passenger breakdown:
```typescript
<Box sx={{ mb: 2 }}>
  <Typography variant="body2" color="text.secondary">
    {passengerComposition.adults} adulto{passengerComposition.adults > 1 ? 's' : ''}
    {passengerComposition.children && passengerComposition.children.length > 0 && (
      <> + {passengerComposition.children.length} criança{passengerComposition.children.length > 1 ? 's' : ''}</>
    )}
  </Typography>
</Box>
```

#### Step 2.5: Test Pricing Display

Test scenarios:
- [ ] 1 adult: Shows "Total para 1 passageiro" (no per-person)
- [ ] 2 adults: Shows "Total para 2 passageiros" + "R$ X por pessoa"
- [ ] 2 adults + 1 child (age 5): Shows "Total para 3 passageiros" + per-person
- [ ] 1 adult + 1 infant (age 1): Shows "Total para 1 passageiro" (infant non-paying)

Verify:
- [ ] Total price matches Amadeus response
- [ ] Per-person calculation is correct
- [ ] Pricing in checkout matches recommendations
- [ ] Final booking amount is correct

### Phase 3: Integration Testing (1-2 hours)

#### Test Complete User Journey

1. **Start Chat**
   - Specify origin, budget
   - Select multiple passengers (e.g., 2 adults + 1 child age 5)
   - Complete chat flow

2. **View Recommendations**
   - Verify flight search includes passenger params
   - Verify pricing shows "Total para 3 passageiros"
   - Verify per-person price is total / 3
   - Select a flight

3. **Checkout**
   - Verify 3 passenger forms render
   - Verify labels: "Adulto (Passageiro Principal)", "Adulto", "Criança (5 anos)"
   - Fill all forms
   - Verify validation works
   - Submit

4. **Booking Created**
   - Verify booking has 3 passengers
   - Verify total amount matches flight offer
   - Verify all passenger data saved

#### Test Edge Cases

- [ ] Maximum passengers (9 total)
- [ ] Infants with adults (1 adult + 1 infant)
- [ ] Multiple children of different ages
- [ ] Navigation back/forward during checkout
- [ ] Session expiry handling
- [ ] API errors handling

### Phase 4: Cleanup & Documentation (30 min)

1. **Remove Debug Logs**
   - Remove or comment out console.log statements
   - Keep only essential error logging

2. **Update Task Status**
   - Mark Task 10 as complete in tasks.md
   - Mark Task 12 as complete in tasks.md

3. **Create Summary Document**
   - Document any issues encountered
   - Document solutions applied
   - Note any remaining edge cases

## Verification Checklist

Before considering the feature complete:

- [ ] Backend tests pass (already done)
- [ ] Frontend builds without errors
- [ ] All passenger combinations work (1-9 passengers)
- [ ] Pricing is accurate throughout flow
- [ ] Forms render correctly for all passengers
- [ ] Validation works for all forms
- [ ] Booking creates with all passengers
- [ ] Error states are handled gracefully
- [ ] Loading states provide feedback
- [ ] User experience is smooth

## Rollback Plan

If issues are found in production:

1. **Quick Fix:** Set default to 1 adult if composition fetch fails
2. **Disable Feature:** Hide passenger selection in chat (default to 1 adult)
3. **Full Rollback:** Revert to previous version

## Support Resources

- **Spec:** `.kiro/specs/passenger-quantity/`
- **Debug Guide:** `app/CHECKOUT_FORMS_DEBUG.md`
- **Pricing Fix:** `app/PRICING_DISPLAY_FIX.md`
- **Summary:** `app/MULTI_PASSENGER_IMPLEMENTATION_SUMMARY.md`
- **Backend Tests:** `backend/airdiscovery/src/modules/chatbot/passenger-integration.spec.ts`

## Estimated Timeline

- **Phase 1 (Checkout Forms):** 2-3 hours
- **Phase 2 (Price Display):** 2-3 hours
- **Phase 3 (Testing):** 1-2 hours
- **Phase 4 (Cleanup):** 30 minutes

**Total:** 6-9 hours of focused development

## Getting Started

1. Read `app/CHECKOUT_FORMS_DEBUG.md` for detailed debugging steps
2. Start with Phase 1 - this is the blocking issue
3. Follow the step-by-step guide above
4. Test thoroughly after each phase
5. Document any issues or deviations from the plan

Good luck! 🚀
