# Flight Parameters Fix - Frontend Navigation Issue

## Problem

When navigating from the chat to the recommendations/flight search page, the URL was being constructed with default values instead of using the actual passenger composition and availability data collected during the conversation.

**Example URL (Before Fix):**
```
http://localhost:3000/recomendacoes/GYN/GDQ?departureDate=2025-12-15&adults=1&nonStop=false
```

Even though the user had specified 2 adults and a specific month during the chat, the URL always showed `adults=1` and a default date 30 days in the future.

## Root Cause

In `ChatPageV2.tsx`, the `navigateToRecommendations` function was using `createDefaultTravelParams()` which only took origin and destination as parameters, ignoring all the collected data from the conversation:

```typescript
// OLD CODE (BROKEN)
const travelParams = createDefaultTravelParams(
    recommendation.origin.iata,
    recommendation.destination.iata
);
```

This meant:
- ❌ Passenger composition was ignored
- ❌ Availability months were ignored
- ❌ Always defaulted to 1 adult
- ❌ Always defaulted to 30 days from now

## Solution

Enhanced the `navigateToRecommendations` function to extract passenger and date information from `state.collectedData`:

### 1. Extract Adults from Passenger Composition

```typescript
const passengerComposition = state.collectedData.passenger_composition;
const adults = passengerComposition?.adults || 1;
```

### 2. Calculate Departure Date from Availability Months

```typescript
const availabilityMonths = state.collectedData.availability_months;
let departureDate: string | undefined;

if (availabilityMonths && availabilityMonths.length > 0) {
    const monthName = availabilityMonths[0]; // e.g., "Janeiro", "Fevereiro"
    const monthMap: Record<string, number> = {
        'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, ...
    };
    
    const monthIndex = monthMap[monthName];
    if (monthIndex !== undefined) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // If the month is in the past, use next year
        const year = monthIndex < currentMonth ? currentYear + 1 : currentYear;
        
        // Set to the 15th of the month as a reasonable default
        const date = new Date(year, monthIndex, 15);
        departureDate = date.toISOString().split('T')[0];
    }
}
```

### 3. Build Travel Params with Collected Data

```typescript
const travelParams = {
    origin: recommendation.origin.iata,
    destination: recommendation.destination.iata,
    departureDate: departureDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults,
    nonStop: false
};
```

## How It Works Now

### User Journey:
1. User chats with bot
2. Bot asks: "Quantos adultos?" → User: "2 adultos"
3. Bot asks: "Em qual mês?" → User: "Janeiro"
4. Bot provides recommendation
5. User clicks "Ver opções de voo"

### Result (After Fix):
```
http://localhost:3000/recomendacoes/GYN/GDQ?departureDate=2026-01-15&adults=2&nonStop=false
```

✅ `adults=2` (from passenger_composition.adults)
✅ `departureDate=2026-01-15` (calculated from availability_months[0] = "Janeiro")

## Edge Cases Handled

1. **No passenger composition**: Falls back to `adults=1`
2. **No availability months**: Falls back to 30 days from now
3. **Past month selected**: Automatically uses next year (e.g., if it's December and user says "Janeiro", uses next January)
4. **Invalid month name**: Falls back to default date

## Files Modified

- `app/src/pages/ChatPageV2.tsx` - Enhanced `navigateToRecommendations` function

## Testing

### Manual Test Steps:

1. Start a chat session
2. Provide origin: "Goiânia"
3. Provide budget: "5000"
4. Select passengers: "2 adultos"
5. Select children: "Nenhuma"
6. Provide month: "Janeiro"
7. Provide activities: "Praia"
8. Provide purpose: "Lazer"
9. Wait for recommendation
10. Click "Ver opções de voo" or "Selecionar este destino"

### Expected Result:

URL should be:
```
/recomendacoes/GYN/[DESTINATION]?departureDate=2026-01-15&adults=2&nonStop=false
```

The RecommendationsPage should:
- ✅ Display flight search results
- ✅ Show correct number of adults (2)
- ✅ Use correct departure date (January 15, 2026)
- ✅ Pass correct parameters to Amadeus API

## Impact

### Before Fix:
- ❌ Flight search always used 1 adult
- ❌ Flight search always used default date
- ❌ User had to manually adjust parameters
- ❌ Poor user experience

### After Fix:
- ✅ Flight search uses actual passenger count
- ✅ Flight search uses user's preferred month
- ✅ Seamless transition from chat to flight search
- ✅ Professional user experience

## Related Components

- `app/src/pages/RecommendationsPage.tsx` - Reads the query parameters correctly (no changes needed)
- `app/src/utils/navigationUtils.ts` - Utility functions for URL building (no changes needed)
- `app/src/hooks/useFlightSearch.ts` - Uses the parameters for API calls (no changes needed)

The fix ensures that all the data collected during the conversation is properly passed to the flight search page, providing a seamless and intelligent user experience.
