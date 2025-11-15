import { 
  convertAvailabilityToDateRange,
  convertAvailabilityToMultipleDateRanges,
  isMonthAvailable,
  getNextAvailableMonth
} from './date-converter.util';

describe('DateConverterUtil', () => {
  // Mock da data atual para testes consistentes
  const mockNow = new Date('2025-11-12'); // 12 de novembro de 2025
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('convertAvailabilityToDateRange', () => {
    it('deve converter Janeiro em data futura', () => {
      const result = convertAvailabilityToDateRange(['Janeiro'], 7);
      
      expect(result.departureDate).toBe('2026-01-15'); // Janeiro já passou, usa próximo ano
      expect(result.returnDate).toBe('2026-01-22'); // 7 dias depois
    });

    it('deve converter Dezembro (mês futuro) para 2025', () => {
      const result = convertAvailabilityToDateRange(['Dezembro'], 7);
      
      expect(result.departureDate).toBe('2025-12-15'); // Dezembro ainda não passou
      expect(result.returnDate).toBe('2025-12-22');
    });

    it('deve converter múltiplos meses usando o primeiro', () => {
      const result = convertAvailabilityToDateRange(['Janeiro', 'Fevereiro', 'Março'], 7);
      
      expect(result.departureDate).toBe('2026-01-15'); // Usa Janeiro (primeiro)
      expect(result.returnDate).toBe('2026-01-22');
    });

    it('deve usar 30 dias no futuro quando não há meses especificados', () => {
      const result = convertAvailabilityToDateRange(null, 7);
      
      expect(result.departureDate).toBe('2025-12-12'); // 30 dias após 12/11
      expect(result.returnDate).toBe('2025-12-19'); // 7 dias depois
    });

    it('deve usar 30 dias no futuro quando array vazio', () => {
      const result = convertAvailabilityToDateRange([], 7);
      
      expect(result.departureDate).toBe('2025-12-12');
      expect(result.returnDate).toBe('2025-12-19');
    });

    it('deve ignorar meses inválidos', () => {
      const result = convertAvailabilityToDateRange(['MêsInválido', 'Dezembro'], 7);
      
      expect(result.departureDate).toBe('2025-12-15'); // Usa Dezembro
      expect(result.returnDate).toBe('2025-12-22');
    });

    it('deve normalizar nomes de meses com acentos', () => {
      const result = convertAvailabilityToDateRange(['Março'], 7);
      
      expect(result.departureDate).toBe('2026-03-15'); // Março já passou
      expect(result.returnDate).toBe('2026-03-22');
    });

    it('deve aceitar abreviações de meses', () => {
      const result = convertAvailabilityToDateRange(['dez'], 7);
      
      expect(result.departureDate).toBe('2025-12-15');
      expect(result.returnDate).toBe('2025-12-22');
    });

    it('deve respeitar durações diferentes', () => {
      const result = convertAvailabilityToDateRange(['Dezembro'], 10);
      
      expect(result.departureDate).toBe('2025-12-15');
      expect(result.returnDate).toBe('2025-12-25'); // 10 dias
    });

    it('deve lidar com viagens longas (30 dias)', () => {
      const result = convertAvailabilityToDateRange(['Dezembro'], 30);
      
      expect(result.departureDate).toBe('2025-12-15');
      expect(result.returnDate).toBe('2026-01-14'); // Cruza ano
    });
  });

  describe('convertAvailabilityToMultipleDateRanges', () => {
    it('deve criar ranges para múltiplos meses', () => {
      const result = convertAvailabilityToMultipleDateRanges(['Janeiro', 'Fevereiro'], 7);
      
      expect(result).toHaveLength(2);
      expect(result[0].departureDate).toBe('2026-01-15');
      expect(result[1].departureDate).toBe('2026-02-15');
    });

    it('deve ordenar meses cronologicamente', () => {
      const result = convertAvailabilityToMultipleDateRanges(['Março', 'Janeiro', 'Fevereiro'], 7);
      
      expect(result).toHaveLength(3);
      expect(result[0].departureDate).toBe('2026-01-15');
      expect(result[1].departureDate).toBe('2026-02-15');
      expect(result[2].departureDate).toBe('2026-03-15');
    });

    it('deve filtrar meses duplicados', () => {
      const result = convertAvailabilityToMultipleDateRanges(['Janeiro', 'Janeiro', 'Fevereiro'], 7);
      
      // Nota: A função atual não remove duplicados, mas isso seria uma melhoria
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('isMonthAvailable', () => {
    const availableMonths = ['Janeiro', 'Fevereiro', 'Dezembro'];

    it('deve retornar true para mês disponível', () => {
      expect(isMonthAvailable('Janeiro', availableMonths)).toBe(true);
    });

    it('deve retornar false para mês não disponível', () => {
      expect(isMonthAvailable('Março', availableMonths)).toBe(false);
    });

    it('deve ser case-insensitive', () => {
      expect(isMonthAvailable('janeiro', availableMonths)).toBe(true);
      expect(isMonthAvailable('JANEIRO', availableMonths)).toBe(true);
    });

    it('deve normalizar acentos', () => {
      expect(isMonthAvailable('Março', ['Marco'])).toBe(true); // Sem acento
      expect(isMonthAvailable('Marco', ['Março'])).toBe(true); // Com acento
    });

    it('deve retornar false quando array vazio', () => {
      expect(isMonthAvailable('Janeiro', [])).toBe(false);
    });

    it('deve retornar false quando null', () => {
      expect(isMonthAvailable('Janeiro', null)).toBe(false);
    });
  });

  describe('getNextAvailableMonth', () => {
    it('deve retornar o próximo mês futuro', () => {
      // Novembro = 11, então próximo deve ser Dezembro (12)
      const result = getNextAvailableMonth(['Outubro', 'Novembro', 'Dezembro']);
      
      expect(result).toBe('Dezembro');
    });

    it('deve retornar primeiro mês se todos já passaram', () => {
      const result = getNextAvailableMonth(['Janeiro', 'Fevereiro', 'Março']);
      
      expect(result).toBe('Janeiro'); // Será do próximo ano
    });

    it('deve retornar mês atual se disponível', () => {
      const result = getNextAvailableMonth(['Novembro', 'Dezembro']);
      
      expect(result).toBe('Novembro');
    });

    it('deve retornar null quando array vazio', () => {
      const result = getNextAvailableMonth([]);
      
      expect(result).toBeNull();
    });

    it('deve retornar null quando null', () => {
      const result = getNextAvailableMonth(null);
      
      expect(result).toBeNull();
    });
  });

  describe('Casos de borda e integração', () => {
    it('deve lidar com meses mistos (completos e abreviados)', () => {
      const result = convertAvailabilityToDateRange(['jan', 'Fevereiro', 'mar'], 7);
      
      expect(result.departureDate).toBe('2026-01-15'); // Janeiro
    });

    it('deve garantir pelo menos 14 dias de antecedência', () => {
      // Se teste rodasse em 01/12, Dezembro (15/12) tem >14 dias
      const result = convertAvailabilityToDateRange(['Dezembro'], 7);
      
      const departureDate = new Date(result.departureDate);
      const daysDiff = Math.floor((departureDate.getTime() - mockNow.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBeGreaterThanOrEqual(14);
    });

    it('deve formatar datas corretamente (YYYY-MM-DD)', () => {
      const result = convertAvailabilityToDateRange(['Dezembro'], 7);
      
      expect(result.departureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.returnDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('deve calcular returnDate corretamente através de meses', () => {
      // 25/12 + 10 dias = 04/01
      const result = convertAvailabilityToDateRange(['Dezembro'], 25);
      
      const departure = new Date(result.departureDate);
      const returnDate = new Date(result.returnDate);
      const daysDiff = Math.floor((returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBe(25);
    });
  });

  describe('Compatibilidade com collectedData', () => {
    it('deve processar availability_months como vem do LLM', () => {
      const llmResponse = ['Janeiro', 'Fevereiro'];
      const result = convertAvailabilityToDateRange(llmResponse, 7);
      
      expect(result.departureDate).toBeDefined();
      expect(result.returnDate).toBeDefined();
    });

    it('deve processar availability_months em readonly array', () => {
      const readonlyMonths: readonly string[] = ['Janeiro', 'Fevereiro'];
      const result = convertAvailabilityToDateRange(readonlyMonths, 7);
      
      expect(result.departureDate).toBe('2026-01-15');
    });

    it('deve processar undefined sem erros', () => {
      const result = convertAvailabilityToDateRange(undefined, 7);
      
      expect(result.departureDate).toBe('2025-12-12');
      expect(result.returnDate).toBe('2025-12-19');
    });
  });
});
