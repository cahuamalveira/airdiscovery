import React from 'react';
import { Box, Button } from '@mui/material';
import { ButtonOption } from '@/types/json-chat';

interface ChatButtonsProps {
  options: readonly ButtonOption[];
  onButtonClick: (value: string, label: string) => void;
  disabled?: boolean;
}

/**
 * ChatButtons - Renders interactive button options for chat responses
 * Used for passenger quantity selection and other structured inputs
 */
export const ChatButtons: React.FC<ChatButtonsProps> = ({
  options,
  onButtonClick,
  disabled = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        mt: 2,
      }}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          variant="outlined"
          onClick={() => onButtonClick(option.value, option.label)}
          disabled={disabled}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 2,
            py: 1,
          }}
        >
          {option.label}
        </Button>
      ))}
    </Box>
  );
};
