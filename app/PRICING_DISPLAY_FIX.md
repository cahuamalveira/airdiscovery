# Pricing Display Fix - Multi-Passenger Support

## Issue Identified

The RecommendationsPage currently displays flight prices incorrectly when multiple passengers are involved.

### Current Behavior (INCORRECT)
```typescript
// Line 277-282 in RecommendationsPage.tsx
<Typography variant="h5" color="primary" fontWeight="bold">
  {formatCurrency(parseFloat(offer.price.total) * 100)}
</Typography>
<Typography variant="body2" color="text.secondary">
  Total por pessoa  // ❌ WRONG - This is actually total for ALL passengers
</Typography>
```

**Example Problem:**
- Search for: 2 adults + 1 child (3 paying passengers)
- Amadeus returns: `price.total = "3000.00"` (R$ 3000 for all 3 passengers)
- UI shows: "R$ 3000 Total por pessoa" ❌
- User thinks: Each person costs R$ 3000, so total = R$ 9000 ❌❌❌

### Root Cause

**Amadeus API Behavior:**
The Amadeus Flight Offers Search API returns `price.total` as the **total price for ALL passengers** in the search request, not per-person pricing.

When you search with:
```
adults=2&children=1
```

The returned `offer.price.total` is the sum of:
- 2 adult fares
- 1 child fare (ages 2-11)

## Solution

### 1. Fetch Passenger Composition in RecommendationsPage

The page needs to know how many passengers were in the search to calculate per-person pricing.

```typescript
// Add to RecommendationsPage.tsx
const [passengerComposition, setPassengerComposition] = useState<PassengerComposition | null>(null);

useEffect(() => {
  if (sessionId) {
    const fetchComposition = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/sessions/collected-data/${sessionId}`);
      const data = await response.json();
      setPassengerComposition(data.collectedData?.passenger_composition);
    };
    fetchComposition();
  }
}, [sessionId]);
```

### 2. Calculate Paying Passengers

```typescript
const payingPassengers = useMemo(() => {
  if (!passengerComposition) return 1; // Default to 1 if not available
  
  let count = passengerComposition.adults;
  
  // Add children over 2 years (paying passengers)
  if (passengerComposition.children) {
    count += passengerComposition.children.filter(c => c.age > 2).length;
  }
  
  return count;
}, [passengerComposition]);
```

### 3. Update Price Display

```typescript
<Box sx={{ textAlign: 'right' }}>
  <Typography variant="h5" color="primary" fontWeight="bold">
    {formatCurrency(parseFloat(offer.price.total) * 100)}
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Total para {payingPassengers} passageiro{payingPassengers > 1 ? 's' : ''}
  </Typography>
  {payingPassengers > 1 && (
    <Typography variant="caption" color="text.disabled" display="block">
      R$ {(parseFloat(offer.price.total) / payingPassengers).toFixed(2)} por pessoa
    </Typography>
  )}
</Box>
```

### Expected Result (CORRECT)

**Example:**
- Search for: 2 adults + 1 child (3 paying passengers)
- Amadeus returns: `price.total = "3000.00"`
- UI shows: 
  - "R$ 3.000,00" (large, bold)
  - "Total para 3 passageiros" (medium)
  - "R$ 1.000,00 por pessoa" (small, gray) ✅

## Implementation Tasks

See `.kiro/specs/passenger-quantity/tasks.md` - Task 10:

- [ ] 10.1 Update RecommendationsPage to fetch passenger composition
- [ ] 10.2 Update price display logic
- [ ] 10.3 Update PriceSummary component in checkout
- [ ] 11.4 Test pricing display accuracy

## Amadeus API Reference

According to Amadeus Flight Offers Search API documentation:

**Request Parameters:**
- `adults` (required): Number of adult travelers (age 12+)
- `children` (optional): Number of child travelers (age 2-11)
- `infants` (optional): Number of infant travelers (age 0-1)

**Response:**
- `price.total`: **Total price for all travelers** in the request
- `price.currency`: Currency code (e.g., "BRL")
- `travelerPricings[]`: Array with individual pricing per traveler type

**Note:** The `travelerPricings` array contains per-traveler breakdowns, but for simplicity, we're calculating per-person by dividing total by paying passengers count.

## Testing Checklist

- [ ] Test with 1 adult: Shows total only, no per-person
- [ ] Test with 2 adults: Shows total and per-person (total / 2)
- [ ] Test with 2 adults + 1 child (age 5): Shows total for 3 passengers, per-person = total / 3
- [ ] Test with 1 adult + 1 infant (age 1): Shows total for 1 passenger (infant is non-paying)
- [ ] Test with 2 adults + 2 children (ages 1, 8): Shows total for 3 passengers (1 infant non-paying)
- [ ] Verify pricing in checkout matches recommendations
- [ ] Verify final booking amount matches Amadeus offer total

## Related Issues

See also: **`app/CHECKOUT_FORMS_DEBUG.md`** - Checkout forms not rendering for all passengers

## Related Files

- `app/src/pages/RecommendationsPage.tsx` - Main fix location
- `app/src/components/checkout/PriceSummary.tsx` - Verify consistency
- `backend/airdiscovery/src/common/amadeus/amadeus-client.service.ts` - API integration
- `.kiro/specs/passenger-quantity/design.md` - Design documentation
- `.kiro/specs/passenger-quantity/tasks.md` - Implementation tasks (Task 10 & 12)
