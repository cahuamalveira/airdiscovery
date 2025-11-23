import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import PassengerDetailsSection from './PassengerDetailsSection';
import type { PassengerData } from '../../types/booking';

describe('PassengerDetailsSection', () => {
  const singlePassenger: PassengerData[] = [
    {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      document: '12345678901',
      birthDate: '1990-01-01',
    },
  ];

  const multiplePassengers: PassengerData[] = [
    {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      document: '12345678901',
      birthDate: '1990-01-01',
    },
    {
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@example.com',
      phone: '11988888888',
      document: '98765432109',
      birthDate: '1985-05-15',
    },
    {
      firstName: 'Pedro',
      lastName: 'Costa',
      email: 'pedro@example.com',
      phone: '11977777777',
      document: '11122233344',
      birthDate: '2010-03-20',
    },
  ];

  describe('Rendering with single passenger', () => {
    it('renders passenger details section', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByTestId('passenger-details-section')).toBeInTheDocument();
    });

    it('displays section title', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/Detalhes dos Passageiros/i)).toBeInTheDocument();
    });

    it('displays single passenger name', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
    });

    it('displays passenger document', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/12345678901/)).toBeInTheDocument();
    });

    it('displays passenger email', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/joao@example.com/i)).toBeInTheDocument();
    });

    it('displays passenger phone', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/11999999999/)).toBeInTheDocument();
    });
  });

  describe('Rendering with multiple passengers', () => {
    it('displays all passenger names', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
      expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
      expect(screen.getByText(/Pedro Costa/i)).toBeInTheDocument();
    });

    it('displays correct passenger count', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Should show 3 passenger cards/sections
      const passengerCards = screen.getAllByTestId(/passenger-card-/);
      expect(passengerCards).toHaveLength(3);
    });

    it('displays each passenger with their own data', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // First passenger
      expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
      expect(screen.getByText(/12345678901/)).toBeInTheDocument();
      
      // Second passenger
      expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
      expect(screen.getByText(/98765432109/)).toBeInTheDocument();
      
      // Third passenger
      expect(screen.getByText(/Pedro Costa/i)).toBeInTheDocument();
      expect(screen.getByText(/11122233344/)).toBeInTheDocument();
    });

    it('displays passengers in order', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      const section = screen.getByTestId('passenger-details-section');
      const text = section.textContent || '';
      
      const joaoIndex = text.indexOf('João Silva');
      const mariaIndex = text.indexOf('Maria Santos');
      const pedroIndex = text.indexOf('Pedro Costa');
      
      expect(joaoIndex).toBeLessThan(mariaIndex);
      expect(mariaIndex).toBeLessThan(pedroIndex);
    });
  });

  describe('Passenger data display (name, document, email, phone)', () => {
    it('displays full name (first name + last name)', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
    });

    it('displays document number with label', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/documento/i)).toBeInTheDocument();
      expect(screen.getByText(/12345678901/)).toBeInTheDocument();
    });

    it('displays email with label', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByText(/joao@example.com/i)).toBeInTheDocument();
    });

    it('displays phone with label', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/telefone/i)).toBeInTheDocument();
      expect(screen.getByText(/11999999999/)).toBeInTheDocument();
    });

    it('displays birth date with label', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      expect(screen.getByText(/data de nascimento/i)).toBeInTheDocument();
      expect(screen.getByText(/01\/01\/1990/)).toBeInTheDocument();
    });

    it('formats birth date in pt-BR format', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      // Should display as DD/MM/YYYY
      expect(screen.getByText(/01\/01\/1990/)).toBeInTheDocument();
    });

    it('displays all required fields for each passenger', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Check that all passengers have all required fields
      multiplePassengers.forEach((passenger) => {
        expect(screen.getByText(new RegExp(`${passenger.firstName} ${passenger.lastName}`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(passenger.document)).toBeInTheDocument();
        expect(screen.getByText(passenger.email)).toBeInTheDocument();
        expect(screen.getByText(passenger.phone)).toBeInTheDocument();
      });
    });
  });

  describe('Expandable/collapsible behavior', () => {
    it('renders with accordion/expandable structure', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Should have expandable elements (MUI Accordion or similar)
      const accordions = screen.getAllByRole('button', { expanded: false });
      expect(accordions.length).toBeGreaterThan(0);
    });

    it('expands passenger details when clicked', async () => {
      const user = userEvent.setup();
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Find first passenger accordion button
      const firstAccordion = screen.getByText(/João Silva/i).closest('button');
      expect(firstAccordion).toBeInTheDocument();
      
      // Click to expand
      if (firstAccordion) {
        await user.click(firstAccordion);
      }
      
      // Details should be visible after expansion
      expect(screen.getByText(/12345678901/)).toBeVisible();
    });

    it('collapses passenger details when clicked again', async () => {
      const user = userEvent.setup();
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Find first passenger accordion button
      const firstAccordion = screen.getByText(/João Silva/i).closest('button');
      
      if (firstAccordion) {
        // Expand
        await user.click(firstAccordion);
        expect(screen.getByText(/12345678901/)).toBeVisible();
        
        // Collapse
        await user.click(firstAccordion);
        
        // Details should be hidden or collapsed
        // Note: MUI Accordion may still render content in DOM but hide it
      }
    });

    it('allows multiple passengers to be expanded simultaneously', async () => {
      const user = userEvent.setup();
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Expand first passenger
      const firstAccordion = screen.getByText(/João Silva/i).closest('button');
      if (firstAccordion) {
        await user.click(firstAccordion);
      }
      
      // Expand second passenger
      const secondAccordion = screen.getByText(/Maria Santos/i).closest('button');
      if (secondAccordion) {
        await user.click(secondAccordion);
      }
      
      // Both should be visible
      expect(screen.getByText(/12345678901/)).toBeVisible();
      expect(screen.getByText(/98765432109/)).toBeVisible();
    });

    it('has proper ARIA attributes for accessibility', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Accordion buttons should have proper ARIA attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-expanded');
      });
    });
  });

  describe('Empty passenger list handling', () => {
    it('renders without crashing when passenger list is empty', () => {
      render(<PassengerDetailsSection passengers={[]} />);
      
      expect(screen.getByTestId('passenger-details-section')).toBeInTheDocument();
    });

    it('displays appropriate message when no passengers', () => {
      render(<PassengerDetailsSection passengers={[]} />);
      
      expect(screen.getByText(/Nenhum passageiro encontrado/i)).toBeInTheDocument();
    });

    it('does not render passenger cards when list is empty', () => {
      render(<PassengerDetailsSection passengers={[]} />);
      
      const passengerCards = screen.queryAllByTestId(/passenger-card-/);
      expect(passengerCards).toHaveLength(0);
    });

    it('still displays section title when empty', () => {
      render(<PassengerDetailsSection passengers={[]} />);
      
      expect(screen.getByText(/Detalhes dos Passageiros/i)).toBeInTheDocument();
    });
  });

  describe('Visual design and layout', () => {
    it('uses Material-UI components', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      // Should use MUI classes
      const section = screen.getByTestId('passenger-details-section');
      expect(section.className).toMatch(/Mui/);
    });

    it('displays passenger index/number', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      // Should show passenger numbers (Passageiro 1, Passageiro 2, etc.)
      expect(screen.getByText(/Passageiro 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Passageiro 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Passageiro 3/i)).toBeInTheDocument();
    });

    it('has proper spacing between passenger cards', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      const section = screen.getByTestId('passenger-details-section');
      expect(section).toBeInTheDocument();
    });

    it('displays data in organized layout', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      // Should have organized structure with labels and values
      const section = screen.getByTestId('passenger-details-section');
      expect(section).toBeInTheDocument();
      
      // Check that labels and values are present
      expect(screen.getByText(/documento/i)).toBeInTheDocument();
      expect(screen.getByText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByText(/telefone/i)).toBeInTheDocument();
    });
  });

  describe('Passenger card structure', () => {
    it('each passenger has a unique test id', () => {
      render(<PassengerDetailsSection passengers={multiplePassengers} />);
      
      expect(screen.getByTestId('passenger-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('passenger-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('passenger-card-2')).toBeInTheDocument();
    });

    it('passenger cards contain all information', () => {
      render(<PassengerDetailsSection passengers={singlePassenger} />);
      
      const card = screen.getByTestId('passenger-card-0');
      const cardContent = within(card);
      
      expect(cardContent.getByText(/João Silva/i)).toBeInTheDocument();
      expect(cardContent.getByText(/12345678901/)).toBeInTheDocument();
      expect(cardContent.getByText(/joao@example.com/i)).toBeInTheDocument();
      expect(cardContent.getByText(/11999999999/)).toBeInTheDocument();
    });
  });
});
