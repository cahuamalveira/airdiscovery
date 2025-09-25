import React from 'react';
import {
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepButton,
} from '@mui/material';

interface CheckoutStepperProps {
  activeStep: number;
  steps: string[];
  onStepClick: (stepIndex: number) => void;
  isStepClickable: (stepIndex: number) => boolean;
}

/**
 * Componente para o stepper de checkout com navegação clicável
 */
export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({
  activeStep,
  steps,
  onStepClick,
  isStepClickable,
}) => {
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label}>
            {isStepClickable(index) ? (
              <StepButton 
                onClick={() => onStepClick(index)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    '& .MuiStepLabel-label': {
                      color: 'primary.main'
                    }
                  },
                  '& .MuiStepLabel-label': {
                    transition: 'color 0.2s ease-in-out'
                  }
                }}
              >
                {label}
              </StepButton>
            ) : (
              <StepLabel 
                sx={{
                  '& .MuiStepLabel-label': {
                    color: 'text.disabled',
                    cursor: 'not-allowed'
                  }
                }}
              >
                {label}
              </StepLabel>
            )}
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};