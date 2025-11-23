import { useState, useCallback } from 'react';
import { BookingData } from '@/components/checkout/types';

/**
 * Hook para gerenciar navegação entre steps do checkout
 */
export const useCheckoutSteps = (initialStep: number = 0) => {
  const [activeStep, setActiveStep] = useState(initialStep);
  const steps = ['Dados do Passageiro', 'Confirmação', 'Pagamento', 'Confirmação Final'];

  // Função para avançar no stepper
  const handleNext = useCallback(() => {
    setActiveStep((prevActiveStep) => {
      console.log('Moving to next step:', prevActiveStep, '->', prevActiveStep + 1);
      return prevActiveStep + 1;
    });
  }, []); // Empty deps - uses functional update

  // Função para voltar no stepper
  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  // Função para navegar para uma step específica
  const handleStepClick = useCallback((stepIndex: number, bookingData?: BookingData | null) => {
    // Permitir navegação apenas para steps anteriores ou steps que já foram completadas
    if (stepIndex <= activeStep) {
      // Pode navegar para qualquer step anterior ou atual
      setActiveStep(stepIndex);
    } else if (stepIndex === 1 && bookingData) {
      // Permitir ir para confirmação se já temos dados de reserva
      setActiveStep(1);
    }
  }, [activeStep]);

  // Função para verificar se um step é clicável
  const isStepClickable = useCallback((stepIndex: number, bookingData?: BookingData | null): boolean => {
    // Step atual e anteriores sempre clicáveis
    if (stepIndex <= activeStep) return true;
    
    // Step de confirmação clicável se temos dados de reserva
    if (stepIndex === 1 && bookingData) return true;
    
    // Step de pagamento clicável se estamos no step de pagamento ou além
    if (stepIndex === 2 && activeStep >= 2) return true;
    
    // Step final clicável se estamos no step final
    if (stepIndex === 3 && activeStep >= 3) return true;
    
    return false;
  }, [activeStep]);

  const goToStep = useCallback((step: number) => {
    setActiveStep(step);
  }, []);

  return {
    activeStep,
    steps,
    handleNext,
    handleBack,
    handleStepClick,
    isStepClickable,
    goToStep
  };
};