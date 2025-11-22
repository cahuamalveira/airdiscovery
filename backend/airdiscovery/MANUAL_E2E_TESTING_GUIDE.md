# Manual End-to-End Testing Guide - Passenger Quantity Feature

This guide provides instructions for manually testing the complete passenger quantity feature from chat to booking.

## Prerequisites

1. Backend server running (`npm run start:dev` in `backend/airdiscovery`)
2. Frontend server running (`npm run dev` in `app`)
3. AWS credentials configured for DynamoDB and Bedrock
4. Test user account created

## Test Scenarios

### Scenario 1: Single Adult Traveler

**Objective**: Verify the system handles a single adult passenger correctly.

**Steps**:
1. Open the chat interface
2. Start a new conversation
3. Provide origin city (e.g., "São Paulo")
4. Provide budget (e.g., "R$ 3000")
5. When asked about passengers, select "1 adulto"
6. Complete the rest of the interview (availability, activities, etc.)
7. Review flight recommendations
8. Select a flight and proceed to checkout
9. Verify only 1 passenger form is displayed
10. Fill in passenger details
11. Complete the booking

**Expected Results**:
- Chat flow includes passenger question after budget
- Button options appear for passenger selection
- Flight search uses `adults=1` parameter
- Checkout shows 1 passenger form labeled "Passageiro Principal"
- Booking is created successfully with 1 passenger

---

### Scenario 2: Two Adults + One Child (Age 5)

**Objective**: Verify the system handles multiple paying passengers.

**Steps**:
1. Start a new chat conversation
2. Provide origin and budget
3. When asked about passengers:
   - Select "2 adultos"
   - Select "1 criança"
   - Select age range "3-5 anos" for the child
4. Complete the interview
5. Review flight recommendations (should reflect per-person budget)
6. Select a flight and proceed to checkout
7. Verify 3 passenger forms are displayed (2 adults + 1 child)
8. Fill in all passenger details
9. Complete the booking

**Expected Results**:
- Chat collects adults and children separately
- Budget calculation shows per-person amount (total / 3)
- Flight search uses `adults=2, children=1`
- Checkout shows 3 forms: "Adulto", "Adulto", "Criança (5 anos)"
- All 3 passengers are saved in the database

---

### Scenario 3: One Adult + One Infant (Age 1)

**Objective**: Verify the system handles infants (non-paying passengers).

**Steps**:
1. Start a new chat conversation
2. Provide origin and budget
3. When asked about passengers:
   - Select "1 adulto"
   - Select "1 criança"
   - Select age range "0-2 anos" for the infant
4. Complete the interview
5. Review recommendations (budget should be for 1 paying passenger)
6. Select a flight and proceed to checkout
7. Verify 2 passenger forms are displayed (1 adult + 1 infant)
8. Fill in all passenger details
9. Complete the booking

**Expected Results**:
- Chat collects infant age correctly
- Budget calculation uses only 1 paying passenger
- Flight search uses `adults=1, infants=1`
- Checkout shows 2 forms: "Adulto", "Bebê (1 ano)"
- Both passengers are saved in the database

---

### Scenario 4: Two Adults + Two Children (Ages 1 and 8)

**Objective**: Verify the system handles mixed passenger types.

**Steps**:
1. Start a new chat conversation
2. Provide origin and budget (e.g., "R$ 8000")
3. When asked about passengers:
   - Select "2 adultos"
   - Select "2 crianças"
   - Select "0-2 anos" for first child
   - Select "6-11 anos" for second child
4. Complete the interview
5. Review recommendations (budget for 3 paying passengers)
6. Select a flight and proceed to checkout
7. Verify 4 passenger forms are displayed
8. Fill in all passenger details
9. Complete the booking

**Expected Results**:
- Chat collects both children's ages
- Budget calculation: R$ 8000 / 3 = R$ 2666.67 per person
- Flight search uses `adults=2, children=1, infants=1`
- Checkout shows: "Adulto", "Adulto", "Bebê (1 ano)", "Criança (8 anos)"
- All 4 passengers are saved in the database

---

## Button Interaction Testing

**Objective**: Verify button-based passenger selection works correctly.

**CRITICAL**: Buttons MUST appear for ALL passenger-related questions. If the user has to type text instead of clicking buttons, this is a BUG.

**Steps**:
1. Start a new conversation
2. Complete origin and budget questions
3. **VERIFY**: When asked "Quantas pessoas vão viajar? Primeiro, me diga quantos adultos:", buttons MUST appear with options: "1 adulto", "2 adultos", "3 adultos", "4 adultos", "Mais..."
4. Click "2 adultos" button
5. **VERIFY**: When asked "E quantas crianças?", buttons MUST appear with options: "Nenhuma", "1 criança", "2 crianças", "3 crianças", "Mais..."
6. Click "1 criança" button
7. **VERIFY**: When asked "Qual a idade da criança?", buttons MUST appear with options: "0-2 anos", "3-5 anos", "6-11 anos", "12-17 anos"
8. Click an age range button (e.g., "3-5 anos")
9. Verify the chat continues to the next question (availability)

**Expected Results**:
- Buttons are clearly visible and clickable for ALL passenger questions
- Selected option appears as user message in the chat
- Text input is hidden when buttons are shown
- Text input reappears after button selection
- Chat flow progresses smoothly to availability question after all passenger data is collected
- User NEVER has to type text for passenger information

**If Buttons Don't Appear**:
This is a critical bug. The LLM is not following the prompt instructions. Check:
1. Backend logs for the JSON response from the LLM
2. Verify `button_options` field is present in the JSON response
3. Check if the frontend is receiving and rendering the buttons correctly

---

## Error Scenario Testing

### Test 1: Invalid Passenger Composition

**Steps**:
1. Try to proceed without selecting any adults
2. Verify error message appears

**Expected Result**:
- Error message in Portuguese: "É necessário pelo menos um adulto na viagem"

### Test 2: Too Many Infants

**Steps**:
1. Select "1 adulto"
2. Select "2 crianças"
3. Select "0-2 anos" for both children
4. Verify error message appears

**Expected Result**:
- Error message: "Número de bebês não pode exceder número de adultos"

### Test 3: Insufficient Budget

**Steps**:
1. Provide low budget (e.g., "R$ 500")
2. Select "4 adultos"
3. Verify budget validation error

**Expected Result**:
- Error message about insufficient budget per person

---

## Backward Compatibility Testing

**Objective**: Verify old sessions without passenger data still work.

**Steps**:
1. Access an old chat session (created before passenger feature)
2. Try to view flight recommendations
3. Verify system defaults to 1 adult
4. Complete booking flow

**Expected Result**:
- System handles missing passenger data gracefully
- Defaults to 1 adult passenger
- No errors or crashes

---

## Checklist

Use this checklist to track your manual testing progress:

- [ ] Scenario 1: Single Adult Traveler
- [ ] Scenario 2: Two Adults + One Child
- [ ] Scenario 3: One Adult + One Infant
- [ ] Scenario 4: Mixed Passenger Types
- [ ] Button Interactions
- [ ] Error: No Adults
- [ ] Error: Too Many Infants
- [ ] Error: Insufficient Budget
- [ ] Backward Compatibility
- [ ] All error messages are in Portuguese
- [ ] All error messages are user-friendly
- [ ] Passenger forms render correctly
- [ ] All passengers are saved in database
- [ ] Flight search parameters are correct

---

## Issue Reporting

If you find any issues during testing, document them with:

1. **Issue Title**: Brief description
2. **Steps to Reproduce**: Exact steps that caused the issue
3. **Expected Behavior**: What should have happened
4. **Actual Behavior**: What actually happened
5. **Screenshots**: If applicable
6. **Browser/Environment**: Browser version, OS, etc.

---

## Notes

- Test with different browsers (Chrome, Firefox, Safari, Edge)
- Test on different screen sizes (desktop, tablet, mobile)
- Verify all Portuguese translations are correct
- Check console for any JavaScript errors
- Monitor network requests for correct API parameters
- Verify database entries after each booking

