import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Esquema de validação para dados do passageiro usando Zod
 */
const passengerSchema = z.object({
  firstName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  lastName: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email deve ter pelo menos 5 caracteres')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999'),
  document: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 999.999.999-99'),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato AAAA-MM-DD')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 120;
    }, 'Idade deve estar entre 0 e 120 anos')
});

/**
 * Esquema de validação para múltiplos passageiros
 */
const multiPassengerSchema = z.object({
  passengers: z.array(passengerSchema).min(1, 'Pelo menos um passageiro é obrigatório')
});

export type PassengerFormData = z.infer<typeof passengerSchema>;

/**
 * Tipo de passageiro com informações adicionais
 */
export interface PassengerType {
  index: number;
  type: 'adult' | 'child' | 'infant';
  age?: number;
}

interface PassengerFormProps {
  onSubmit: (data: PassengerFormData | PassengerFormData[]) => void;
  loading?: boolean;
  defaultValues?: Partial<PassengerFormData>;
  passengerCount?: number;
  passengerTypes?: PassengerType[];
}

/**
 * Componente para formulário de dados do passageiro
 */
export const PassengerForm: React.FC<PassengerFormProps> = ({
  onSubmit,
  loading = false,
  defaultValues = {},
  passengerCount,
  passengerTypes
}) => {
  // Determina se é modo múltiplos passageiros
  const isMultiPassenger = passengerTypes && passengerTypes.length > 0;
  
  // Configuração do formulário para modo único
  const singleForm = useForm<PassengerFormData>({
    resolver: zodResolver(passengerSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      document: '',
      birthDate: '',
      ...defaultValues
    }
  });

  // Configuração do formulário para modo múltiplo
  const multiForm = useForm<{ passengers: PassengerFormData[] }>({
    resolver: zodResolver(multiPassengerSchema),
    mode: 'onChange',
    defaultValues: {
      passengers: passengerTypes?.map(() => ({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        document: '',
        birthDate: '',
      })) || []
    }
  });

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Função para obter o label do tipo de passageiro
  const getPassengerLabel = (passenger: PassengerType, index: number): string => {
    const isPrimary = index === 0;
    let label = '';
    
    if (passenger.type === 'adult') {
      label = 'Adulto';
    } else if (passenger.type === 'child') {
      label = `Criança (${passenger.age} anos)`;
    } else if (passenger.type === 'infant') {
      label = `Bebê (${passenger.age} anos)`;
    }
    
    if (isPrimary) {
      label += ' (Passageiro Principal)';
    }
    
    return label;
  };

  // Handler de submit para modo único
  const handleSingleSubmit = (data: PassengerFormData) => {
    onSubmit(data);
  };

  // Handler de submit para modo múltiplo
  const handleMultiSubmit = (data: { passengers: PassengerFormData[] }) => {
    onSubmit(data.passengers);
  };

  // Renderiza campos de um passageiro para modo único
  const renderSinglePassengerFields = () => {
    const { control, formState: { errors } } = singleForm;

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nome *"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            )}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Sobrenome *"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 100%' }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="email"
                label="Email *"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name="phone"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                fullWidth
                label="Telefone *"
                placeholder="(11) 99999-9999"
                value={value}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  onChange(formatted);
                }}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name="document"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                fullWidth
                label="CPF *"
                placeholder="999.999.999-99"
                value={value}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  onChange(formatted);
                }}
                error={!!errors.document}
                helperText={errors.document?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label="Data de Nascimento *"
                InputLabelProps={{ shrink: true }}
                error={!!errors.birthDate}
                helperText={errors.birthDate?.message}
              />
            )}
          />
        </Box>
      </Box>
    );
  };

  // Renderiza campos de um passageiro para modo múltiplo
  const renderMultiPassengerFields = (index: number) => {
    const { control, formState: { errors } } = multiForm;
    const fieldErrors = errors.passengers?.[index];

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name={`passengers.${index}.firstName`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nome *"
                error={!!fieldErrors?.firstName}
                helperText={fieldErrors?.firstName?.message}
              />
            )}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name={`passengers.${index}.lastName`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Sobrenome *"
                error={!!fieldErrors?.lastName}
                helperText={fieldErrors?.lastName?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 100%' }}>
          <Controller
            name={`passengers.${index}.email`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="email"
                label="Email *"
                error={!!fieldErrors?.email}
                helperText={fieldErrors?.email?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name={`passengers.${index}.phone`}
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                fullWidth
                label="Telefone *"
                placeholder="(11) 99999-9999"
                value={value}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  onChange(formatted);
                }}
                error={!!fieldErrors?.phone}
                helperText={fieldErrors?.phone?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name={`passengers.${index}.document`}
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                fullWidth
                label="CPF *"
                placeholder="999.999.999-99"
                value={value}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  onChange(formatted);
                }}
                error={!!fieldErrors?.document}
                helperText={fieldErrors?.document?.message}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
          <Controller
            name={`passengers.${index}.birthDate`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label="Data de Nascimento *"
                InputLabelProps={{ shrink: true }}
                error={!!fieldErrors?.birthDate}
                helperText={fieldErrors?.birthDate?.message}
              />
            )}
          />
        </Box>
      </Box>
    );
  };

  if (isMultiPassenger) {
    // Modo múltiplos passageiros
    const { handleSubmit, formState: { isValid } } = multiForm;

    return (
      <Box>
        <form onSubmit={handleSubmit(handleMultiSubmit)}>
          {passengerTypes!.map((passenger, index) => (
            <Card key={index} elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {getPassengerLabel(passenger, index)}
                  </Typography>
                </Box>
                {renderMultiPassengerFields(index)}
              </CardContent>
            </Card>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Processando...' : 'Continuar'}
            </Button>
          </Box>
        </form>
      </Box>
    );
  }

  // Modo passageiro único (compatibilidade com código existente)
  const { handleSubmit, formState: { isValid } } = singleForm;

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Dados do Passageiro
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(handleSingleSubmit)}>
          {renderSinglePassengerFields()}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Processando...' : 'Continuar'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
