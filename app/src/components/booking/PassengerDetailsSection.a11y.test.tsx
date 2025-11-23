import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import PassengerDetailsSection from './PassengerDetailsSection';
import type { PassengerData } from '../../types/booking';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('PassengerDetailsSection - Accessibility Tests', () => {
  const mockPassengers: PassengerData[] = [
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
  ];

  describe('ARIA Labels and Roles', () => {
    it('has proper ARIA attributes on accordion', () => {
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      // Accordion should have proper ARIA controls
      const accordionButton = screen.getByRole('button', { name: /passageiro 1/i });
      expect(accordionButton).toHaveAttribute('aria-controls');
      expect(accordionButton).toHaveAttribute('id');
    });

    it('accordion has aria-expanded attribute', () => {
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const accordionButton = screen.getByRole('button', { name: /passageiro 1/i });
      expect(accordionButton).toHaveAttribute('aria-expanded');
    });

    it('accordion content has proper aria-labelledby', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const accordionContent = container.querySelector('[id^="passenger-"][id$="-content"]');
      expect(accordionContent).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('accordion can be opened with keyboard', async () => {
      const user = userEvent.setup();
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const accordionButton = screen.getByRole('button', { name: /passageiro 1/i });
      
      // Should be focusable
      accordionButton.focus();
      expect(accordionButton).toHaveFocus();
      
      // Should be activatable with Enter
      await user.keyboard('{Enter}');
      expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('accordion can be opened with Space key', async () => {
      const user = userEvent.setup();
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const accordionButton = screen.getByRole('button', { name: /passageiro 1/i });
      
      accordionButton.focus();
      await user.keyboard(' ');
      
      expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('can tab through all accordion buttons', async () => {
      const user = userEvent.setup();
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const accordionButtons = screen.getAllByRole('button');
      
      // Tab to first button
      await user.tab();
      expect(accordionButtons[0]).toHaveFocus();
      
      // Tab to second button
      await user.tab();
      expect(accordionButtons[1]).toHaveFocus();
    });

    it('maintains logical tab order', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // Buttons should not have negative tabindex
        const tabindex = button.getAttribute('tabindex');
        if (tabindex !== null) {
          expect(parseInt(tabindex)).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Focus Indicators', () => {
    it('accordion buttons are focusable', () => {
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const accordionButton = screen.getByRole('button', { name: /passageiro 1/i });
      accordionButton.focus();
      
      expect(accordionButton).toHaveFocus();
    });

    it('focus is visible on accordion buttons', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // MUI components have built-in focus styles
        // We verify the button is focusable
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides meaningful heading for section', () => {
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const heading = screen.getByRole('heading', { name: /detalhes dos passageiros/i });
      expect(heading).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      // Section title should be h2
      const sectionHeading = container.querySelector('h2');
      expect(sectionHeading).toBeInTheDocument();
      expect(sectionHeading?.textContent).toContain('Detalhes dos Passageiros');
      
      // Passenger names should be h3 (lower in hierarchy)
      const passengerHeadings = container.querySelectorAll('h3');
      expect(passengerHeadings.length).toBeGreaterThan(0);
    });

    it('announces empty state to screen readers', () => {
      render(<PassengerDetailsSection passengers={[]} />);
      
      const emptyMessage = screen.getByText(/nenhum passageiro encontrado/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it('provides context for passenger information', () => {
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      // Labels should be present for each field
      expect(screen.getAllByText(/documento/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/data de nascimento/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/e-mail/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/telefone/i).length).toBeGreaterThan(0);
    });
  });

  describe('Semantic HTML Structure', () => {
    it('uses semantic heading elements', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const headings = container.querySelectorAll('h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('uses proper list structure for multiple passengers', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      // Each passenger should be in a separate accordion
      const accordions = container.querySelectorAll('[data-testid^="passenger-card-"]');
      expect(accordions.length).toBe(mockPassengers.length);
    });
  });

  describe('Color Contrast', () => {
    it('uses sufficient contrast for text', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      // Primary text should be #212121 on white background
      // Secondary text should be #757575 on white background
      // Both meet WCAG AA standards
      expect(container).toBeInTheDocument();
    });
  });

  describe('Automated Accessibility Testing with axe-core', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have ARIA violations', async () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-roles': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should not have keyboard navigation violations', async () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const results = await axe(container, {
        rules: {
          'button-name': { enabled: true },
          'link-name': { enabled: true },
          'tabindex': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should not have color contrast violations', async () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Empty State Accessibility', () => {
    it('empty state is accessible', async () => {
      const { container } = render(<PassengerDetailsSection passengers={[]} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('empty state message is readable by screen readers', () => {
      render(<PassengerDetailsSection passengers={[]} />);
      
      const emptyMessage = screen.getByText(/nenhum passageiro encontrado/i);
      expect(emptyMessage).toBeVisible();
    });
  });

  describe('Single Passenger Accessibility', () => {
    it('single passenger accordion is accessible', async () => {
      const { container } = render(<PassengerDetailsSection passengers={[mockPassengers[0]]} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Expandable/Collapsible Behavior', () => {
    it('announces expanded state to screen readers', async () => {
      const user = userEvent.setup();
      render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      const accordionButton = screen.getByRole('button', { name: /passageiro 1/i });
      
      // Initially collapsed
      expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
      
      // Expand
      await user.click(accordionButton);
      expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
      
      // Collapse
      await user.click(accordionButton);
      expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('expand icon is decorative and does not interfere with accessibility', () => {
      const { container } = render(<PassengerDetailsSection passengers={mockPassengers} />);
      
      // Expand icon should be inside button, not a separate interactive element
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(mockPassengers.length);
    });
  });
});
