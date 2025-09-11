import { z } from 'zod';
import { DEFAULT_VALIDATION_CONFIG } from '../types/auth';

/**
 * Schemas de validação usando Zod para formulários de autenticação
 */

// Schema para login
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Senha é obrigatória'),
});

// Schema para cadastro
export const signUpSchema = z.object({
  name: z
    .string()
    .min(DEFAULT_VALIDATION_CONFIG.minNameLength, `Nome deve ter pelo menos ${DEFAULT_VALIDATION_CONFIG.minNameLength} caracteres`)
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .transform(name => name.trim()),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(DEFAULT_VALIDATION_CONFIG.minPasswordLength, `Senha deve ter pelo menos ${DEFAULT_VALIDATION_CONFIG.minPasswordLength} caracteres`)
    .regex(
      DEFAULT_VALIDATION_CONFIG.passwordRegex,
      'Senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 símbolo'
    ),
});

// Schema para confirmação de código
export const confirmationSchema = z.object({
  confirmationCode: z
    .string()
    .min(DEFAULT_VALIDATION_CONFIG.minCodeLength, `Código deve ter pelo menos ${DEFAULT_VALIDATION_CONFIG.minCodeLength} caracteres`)
    .max(8, 'Código deve ter no máximo 8 caracteres')
    .regex(/^\d+$/, 'Código deve conter apenas números'),
});

// Schema para esqueci minha senha
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .transform(email => email.toLowerCase().trim()),
});

// Schema para redefinir senha
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .transform(email => email.toLowerCase().trim()),
  confirmationCode: z
    .string()
    .min(DEFAULT_VALIDATION_CONFIG.minCodeLength, `Código deve ter pelo menos ${DEFAULT_VALIDATION_CONFIG.minCodeLength} caracteres`)
    .max(8, 'Código deve ter no máximo 8 caracteres')
    .regex(/^\d+$/, 'Código deve conter apenas números'),
  newPassword: z
    .string()
    .min(DEFAULT_VALIDATION_CONFIG.minPasswordLength, `Nova senha deve ter pelo menos ${DEFAULT_VALIDATION_CONFIG.minPasswordLength} caracteres`)
    .regex(
      DEFAULT_VALIDATION_CONFIG.passwordRegex,
      'Nova senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 símbolo'
    ),
});

// Tipos inferidos dos schemas
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ConfirmationFormData = z.infer<typeof confirmationSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
