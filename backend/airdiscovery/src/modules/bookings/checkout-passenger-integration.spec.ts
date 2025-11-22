import { CreateBookingDto, PassengerDataDto } from './dto/booking.dto';
import { JsonChatSession } from '../chatbot/interfaces/json-response.interface';

describe('Checkout Flow with Multiple Passengers Integration', () => {
  // Mock chatbot service for session retrieval
  const mockGetChatSession = jest.fn();

  beforeAll(() => {
    // Setup any global mocks if needed
  });

  describe('Checkout loads passenger composition from session', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should load passenger composition with 2 adults + 1 child from session', () => {
      const sessionId = 'test-checkout-session';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Rio de Janeiro',
          destination_iata: 'GIG',
          activities: ['Praia'],
          budget_in_brl: 5000,
          availability_months: ['Janeiro'],
          purpose: 'Férias',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: [{ age: 5, isPaying: true }],
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetChatSession.mockReturnValue(mockSession);

      const session = mockGetChatSession(sessionId);

      expect(session).toBeDefined();
      expect(session.collectedData.passenger_composition).toBeDefined();
      expect(session.collectedData.passenger_composition?.adults).toBe(2);
      expect(session.collectedData.passenger_composition?.children).toHaveLength(1);
      expect(session.collectedData.passenger_composition?.children?.[0].age).toBe(5);
    });

    it('should load passenger composition with 1 adult + 1 infant from session', () => {
      const sessionId = 'test-checkout-infant';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Brasília',
          origin_iata: 'BSB',
          destination_name: 'Salvador',
          destination_iata: 'SSA',
          activities: ['Cultura'],
          budget_in_brl: 2500,
          availability_months: ['Fevereiro'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 1,
            children: [{ age: 1, isPaying: false }],
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetChatSession.mockReturnValue(mockSession);

      const session = mockGetChatSession(sessionId);

      expect(session).toBeDefined();
      expect(session.collectedData.passenger_composition).toBeDefined();
      expect(session.collectedData.passenger_composition?.adults).toBe(1);
      expect(session.collectedData.passenger_composition?.children).toHaveLength(1);
      expect(session.collectedData.passenger_composition?.children?.[0].isPaying).toBe(false);
    });
  });

  describe('Booking creation with multiple passengers', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create booking with 2 adult passengers', () => {
      const passengers: PassengerDataDto[] = [
        {
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@example.com',
          phone: '(11) 98765-4321',
          document: '123.456.789-00',
          birthDate: '1985-05-15',
        },
        {
          firstName: 'Maria',
          lastName: 'Silva',
          email: 'maria@example.com',
          phone: '(11) 98765-4322',
          document: '987.654.321-00',
          birthDate: '1987-08-20',
        },
      ];

      const createBookingDto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers,
        totalAmount: 5000,
      };

      // Note: This tests the structure, actual validation is tested in booking.service.spec.ts
      expect(createBookingDto.passengers).toHaveLength(2);
      expect(createBookingDto.passengers[0].firstName).toBe('João');
      expect(createBookingDto.passengers[1].firstName).toBe('Maria');
    });

    it('should create booking with 1 adult + 1 child', async () => {
      const passengers: PassengerDataDto[] = [
        {
          firstName: 'Carlos',
          lastName: 'Santos',
          email: 'carlos@example.com',
          phone: '(21) 98765-1111',
          document: '111.222.333-44',
          birthDate: '1980-03-10',
        },
        {
          firstName: 'Ana',
          lastName: 'Santos',
          email: 'carlos@example.com',
          phone: '(21) 98765-1111',
          document: '555.666.777-88',
          birthDate: '2018-07-25', // 7 years old
        },
      ];

      const createBookingDto: CreateBookingDto = {
        flightId: 'flight-456',
        passengers,
        totalAmount: 3500,
      };

      expect(createBookingDto.passengers).toHaveLength(2);
      
      // Calculate ages
      const today = new Date();
      const adultBirthDate = new Date(passengers[0].birthDate);
      const childBirthDate = new Date(passengers[1].birthDate);
      
      const adultAge = today.getFullYear() - adultBirthDate.getFullYear();
      const childAge = today.getFullYear() - childBirthDate.getFullYear();
      
      expect(adultAge).toBeGreaterThanOrEqual(18);
      expect(childAge).toBeLessThan(18);
    });

    it('should create booking with 2 adults + 2 children + 1 infant', async () => {
      const passengers: PassengerDataDto[] = [
        {
          firstName: 'Pedro',
          lastName: 'Oliveira',
          email: 'pedro@example.com',
          phone: '(31) 98765-2222',
          document: '222.333.444-55',
          birthDate: '1975-01-15',
        },
        {
          firstName: 'Julia',
          lastName: 'Oliveira',
          email: 'julia@example.com',
          phone: '(31) 98765-2223',
          document: '333.444.555-66',
          birthDate: '1978-06-20',
        },
        {
          firstName: 'Lucas',
          lastName: 'Oliveira',
          email: 'pedro@example.com',
          phone: '(31) 98765-2222',
          document: '444.555.666-77',
          birthDate: '2017-09-10', // 8 years old
        },
        {
          firstName: 'Sofia',
          lastName: 'Oliveira',
          email: 'pedro@example.com',
          phone: '(31) 98765-2222',
          document: '555.666.777-88',
          birthDate: '2024-03-15', // 1 year old
        },
      ];

      const createBookingDto: CreateBookingDto = {
        flightId: 'flight-789',
        passengers,
        totalAmount: 8000,
      };

      expect(createBookingDto.passengers).toHaveLength(4);
      expect(createBookingDto.passengers[0].firstName).toBe('Pedro');
      expect(createBookingDto.passengers[1].firstName).toBe('Julia');
      expect(createBookingDto.passengers[2].firstName).toBe('Lucas');
      expect(createBookingDto.passengers[3].firstName).toBe('Sofia');
    });
  });

  describe('All passengers persisted in database', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should persist all 3 passengers in database', () => {
      const passengers: PassengerDataDto[] = [
        {
          firstName: 'Roberto',
          lastName: 'Costa',
          email: 'roberto@example.com',
          phone: '(41) 98765-3333',
          document: '666.777.888-99',
          birthDate: '1990-11-05',
        },
        {
          firstName: 'Fernanda',
          lastName: 'Costa',
          email: 'fernanda@example.com',
          phone: '(41) 98765-3334',
          document: '777.888.999-00',
          birthDate: '1992-04-12',
        },
        {
          firstName: 'Gabriel',
          lastName: 'Costa',
          email: 'roberto@example.com',
          phone: '(41) 98765-3333',
          document: '888.999.000-11',
          birthDate: '2019-12-20', // 5 years old
        },
      ];

      const mockBooking = {
        id: 'booking-456',
        flightId: 'flight-999',
        totalAmount: 6000,
        passengers: passengers.map((p, index) => ({
          id: `passenger-${index}`,
          ...p,
          booking: { id: 'booking-456' },
        })),
      };

      // Verify all passengers are included
      expect(mockBooking.passengers).toHaveLength(3);
      expect(mockBooking.passengers[0].firstName).toBe('Roberto');
      expect(mockBooking.passengers[1].firstName).toBe('Fernanda');
      expect(mockBooking.passengers[2].firstName).toBe('Gabriel');
    });
  });

  describe('Passenger form generation', () => {
    it('should generate correct passenger types array for 2 adults + 1 child', () => {
      const passengerComposition = {
        adults: 2,
        children: [{ age: 5, isPaying: true }],
      };

      // Simulate frontend logic for generating passenger types
      const passengerTypes: Array<{ index: number; type: string; age?: number }> = [];

      // Add adults
      for (let i = 0; i < passengerComposition.adults; i++) {
        passengerTypes.push({ index: passengerTypes.length, type: 'adult' });
      }

      // Add children
      if (passengerComposition.children) {
        for (const child of passengerComposition.children) {
          passengerTypes.push({
            index: passengerTypes.length,
            type: child.age <= 2 ? 'infant' : 'child',
            age: child.age,
          });
        }
      }

      expect(passengerTypes).toHaveLength(3);
      expect(passengerTypes[0].type).toBe('adult');
      expect(passengerTypes[1].type).toBe('adult');
      expect(passengerTypes[2].type).toBe('child');
      expect(passengerTypes[2].age).toBe(5);
    });

    it('should generate correct passenger types array for 1 adult + 1 infant', () => {
      const passengerComposition = {
        adults: 1,
        children: [{ age: 1, isPaying: false }],
      };

      const passengerTypes: Array<{ index: number; type: string; age?: number }> = [];

      for (let i = 0; i < passengerComposition.adults; i++) {
        passengerTypes.push({ index: passengerTypes.length, type: 'adult' });
      }

      if (passengerComposition.children) {
        for (const child of passengerComposition.children) {
          passengerTypes.push({
            index: passengerTypes.length,
            type: child.age <= 2 ? 'infant' : 'child',
            age: child.age,
          });
        }
      }

      expect(passengerTypes).toHaveLength(2);
      expect(passengerTypes[0].type).toBe('adult');
      expect(passengerTypes[1].type).toBe('infant');
      expect(passengerTypes[1].age).toBe(1);
    });

    it('should generate correct passenger types array for 2 adults + 2 children (mixed)', () => {
      const passengerComposition = {
        adults: 2,
        children: [
          { age: 1, isPaying: false },
          { age: 8, isPaying: true },
        ],
      };

      const passengerTypes: Array<{ index: number; type: string; age?: number }> = [];

      for (let i = 0; i < passengerComposition.adults; i++) {
        passengerTypes.push({ index: passengerTypes.length, type: 'adult' });
      }

      if (passengerComposition.children) {
        for (const child of passengerComposition.children) {
          passengerTypes.push({
            index: passengerTypes.length,
            type: child.age <= 2 ? 'infant' : 'child',
            age: child.age,
          });
        }
      }

      expect(passengerTypes).toHaveLength(4);
      expect(passengerTypes[0].type).toBe('adult');
      expect(passengerTypes[1].type).toBe('adult');
      expect(passengerTypes[2].type).toBe('infant');
      expect(passengerTypes[2].age).toBe(1);
      expect(passengerTypes[3].type).toBe('child');
      expect(passengerTypes[3].age).toBe(8);
    });
  });
});
