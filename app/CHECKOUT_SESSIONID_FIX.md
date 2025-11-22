# Checkout SessionId Fix - Passing Passenger Data to Checkout

## Problem

The checkout page was NOT displaying multiple passenger forms because it wasn't receiving the `sessionId` needed to fetch the passenger composition from the chat session.

**Flow Before Fix:**
```
Chat → Recommendations → Checkout
       (sessionId lost)  (no sessionId = defaults to 1 passenger)
```

## Root Cause

1. **ChatPageV2** navigated to recommendations WITHOUT sessionId in URL
2. **RecommendationsPage** didn't have sessionId to pass along
3. **CheckoutPage** expected sessionId but never received it
4. **Result**: Always defaulted to single passenger form

## Solution

Pass sessionId through the entire navigation chain via URL query parameters.

### 1. ChatPageV2 - Add SessionId to Recommendations URL

**File:** `app/src/pages/ChatPageV2.tsx`

```typescript
// BEFORE
const recommendationsUrl = createRecommendationsUrl(travelParams);
navigate(recommendationsUrl);

// AFTER
const recommendationsUrl = createRecommendationsUrl(travelParams);
const urlWithSession = `${recommendationsUrl}&sessionId=${sessionId}`;
navigate(urlWithSession);
```

**Example URL:**
```
/recomendacoes/GYN/GDQ?departureDate=2026-01-15&adults=2&nonStop=false&sessionId=abc123
```

### 2. RecommendationsPage - Extract and Pass SessionId

**File:** `app/src/pages/RecommendationsPage.tsx`

**Extract sessionId from URL:**
```typescript
const [searchParams] = useSearchParams();
const sessionId = searchParams.get('sessionId');
```

**Pass sessionId to checkout:**
```typescript
// BEFORE
navigate(`/checkout/${flightId}`);

// AFTER
const checkoutUrl = sessionId 
  ? `/checkout/${flightId}?sessionId=${sessionId}`
  : `/checkout/${flightId}`;
navigate(checkoutUrl);
```

**Example URL:**
```
/checkout/flight-123?sessionId=abc123
```

### 3. CheckoutPage - Read SessionId from Query Params

**File:** `app/src/pages/CheckoutPage.tsx`

```typescript
// BEFORE
const { flightId, sessionId } = useParams<{ flightId: string; sessionId?: string }>();

// AFTER
const { flightId } = useParams<{ flightId: string }>();
const [searchParams] = useSearchParams();
const sessionId = searchParams.get('sessionId');
```

## How It Works Now

### Complete Flow:

1. **Chat Session** (sessionId: "abc123")
   - User: "2 adultos"
   - User: "1 criança"
   - User: "5 anos"
   - Passenger composition saved: `{ adults: 2, children: [{ age: 5, isPaying: true }] }`

2. **Navigate to Recommendations**
   ```
   /recomendacoes/GYN/GDQ?departureDate=2026-01-15&adults=2&nonStop=false&sessionId=abc123
   ```

3. **Select Flight**
   ```
   /checkout/flight-456?sessionId=abc123
   ```

4. **Checkout Page**
   - Reads `sessionId=abc123` from URL
   - Fetches passenger composition from backend
   - Generates passenger types: `[{ type: 'adult' }, { type: 'adult' }, { type: 'child', age: 5 }]`
   - Renders 3 passenger forms:
     - "Adulto (Passageiro Principal)"
     - "Adulto"
     - "Criança (5 anos)"

## Files Modified

1. **app/src/pages/ChatPageV2.tsx**
   - Added sessionId to recommendations URL

2. **app/src/pages/RecommendationsPage.tsx**
   - Extract sessionId from query params
   - Pass sessionId to checkout URL

3. **app/src/pages/CheckoutPage.tsx**
   - Read sessionId from query params instead of route params
   - Added `useSearchParams` import

## Testing

### Test Scenario: Family of 3

1. **Start Chat**
   - Complete conversation with 2 adults + 1 child (5 years)
   - Note the sessionId in browser URL: `/chat/session/abc123`

2. **Click "Ver opções de voo"**
   - Verify URL includes sessionId:
     ```
     /recomendacoes/GYN/GDQ?...&sessionId=abc123
     ```

3. **Select a Flight**
   - Verify URL includes sessionId:
     ```
     /checkout/flight-456?sessionId=abc123
     ```

4. **Checkout Page**
   - ✅ Should display 3 passenger cards
   - ✅ Card 1: "Adulto (Passageiro Principal)"
   - ✅ Card 2: "Adulto"
   - ✅ Card 3: "Criança (5 anos)"

### Expected Console Logs:

```javascript
// ChatPageV2
Navigating to: /recomendacoes/GYN/GDQ?departureDate=2026-01-15&adults=2&nonStop=false&sessionId=abc123

// RecommendationsPage
Navigating to checkout: /checkout/flight-456?sessionId=abc123

// CheckoutPage
Passenger composition loaded: { adults: 2, children: [{ age: 5, isPaying: true }] }
```

## Edge Cases Handled

1. **No SessionId**: Falls back to single passenger (existing behavior)
2. **Invalid SessionId**: Backend returns error, falls back to single passenger
3. **Session Expired**: Shows error message, falls back to single passenger
4. **Direct Checkout Access**: Works without sessionId (single passenger)

## Impact

### Before Fix:
- ❌ Always showed 1 passenger form
- ❌ User had to manually enter all passengers
- ❌ Lost conversation context
- ❌ Poor user experience

### After Fix:
- ✅ Shows correct number of passenger forms
- ✅ Preserves conversation context
- ✅ Seamless flow from chat to checkout
- ✅ Professional user experience

## Verification

Run the app and test:

```bash
# Terminal 1 - Backend
cd backend/airdiscovery
npm run start:dev

# Terminal 2 - Frontend
cd app
npm run dev
```

Then:
1. Go to http://localhost:3000/chat
2. Start a new chat session
3. Specify multiple passengers
4. Complete the conversation
5. Click "Ver opções de voo"
6. Select a flight
7. **Verify**: Checkout shows multiple passenger forms!

The fix is now complete and the UI will display forms for all passengers!
