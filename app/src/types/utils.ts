/**
 * Utility functions for chat domain transformations and formatting
 */

import { UserProfile, InterviewProgress, TravelRecommendation } from './chat';

/**
 * Formats budget from cents to Brazilian Real string
 */
export function formatBudgetToReal(budgetInCents: number): string {
  const reais = budgetInCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(reais);
}

/**
 * Formats budget from Real string to cents
 */
export function parseBudgetToCents(budgetString: string): number {
  const cleanedString = budgetString
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const reais = parseFloat(cleanedString);
  return Math.round(reais * 100);
}

/**
 * Creates a summary of user profile for display
 */
export function createProfileSummary(profile: UserProfile): string {
  const budgetFormatted = formatBudgetToReal(profile.budget);
  const activitiesText = profile.activities.length > 0 
    ? profile.activities.join(', ') 
    : 'Não especificado';
  const hobbiesText = profile.hobbies.length > 0 
    ? profile.hobbies.join(', ') 
    : 'Não especificado';

  return `
Origem: ${profile.origin}
Atividades: ${activitiesText}
Orçamento: ${budgetFormatted}
Propósito: ${profile.purpose || 'Não especificado'}
Hobbies: ${hobbiesText}
  `.trim();
}

/**
 * Calculates interview progress metrics
 */
export function calculateInterviewProgress(
  currentQuestion: number,
  totalQuestions: number,
  profile: UserProfile
): InterviewProgress {
  const hasOrigin = profile.origin.trim().length > 0;
  const hasActivities = profile.activities.length > 0;
  const hasBudget = profile.budget > 0;
  const hasPurpose = profile.purpose.trim().length > 0;
  const hasHobbies = profile.hobbies.length > 0;

  const canFinishEarly = hasOrigin && hasBudget && (hasActivities || hasPurpose);
  const isComplete = (hasOrigin && hasActivities && hasBudget && hasPurpose && hasHobbies) ||
                    (currentQuestion >= totalQuestions) ||
                    (currentQuestion >= 1 && canFinishEarly);

  const efficiency = Math.min(currentQuestion / totalQuestions, 1);

  return {
    currentQuestion,
    totalQuestions,
    efficiency,
    isComplete,
    canFinishEarly
  };
}

/**
 * Extracts recommended destination from LLM response
 */
export function extractRecommendedDestination(response: string): TravelRecommendation | null {
  try {
    // Look for pattern: "Recomendo [CITY] para você"
    const recommendPattern = /recomendo\s+([^!.]+?)(?:\s+para\s+você)?[!.]/i;
    const match = response.match(recommendPattern);
    
    if (match) {
      const destination = match[1].trim();
      
      return {
        destination,
        city: destination,
        confidence: 0.8, // Default confidence
        reasoning: ['Recomendação baseada no perfil do usuário']
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting recommended destination:', error);
    return null;
  }
}

/**
 * Validates if a profile is ready for recommendations
 */
export function isProfileReadyForRecommendation(profile: UserProfile): boolean {
  const hasOrigin = profile.origin.trim().length > 0;
  const hasActivitiesOrPurpose = profile.activities.length > 0 || profile.purpose.trim().length > 0;
  const hasBudget = profile.budget > 0;

  return hasOrigin && hasActivitiesOrPurpose && hasBudget;
}

/**
 * Creates a unique session ID
 */
export function createSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Creates a unique message ID
 */
export function createMessageId(): string {
  return crypto.randomUUID();
}

/**
 * Sanitizes user input for chat messages
 */
export function sanitizeMessageContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 1000); // Limit to 1000 characters
}

/**
 * Formats timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Checks if two UserProfiles are equal
 */
export function areProfilesEqual(profile1: UserProfile, profile2: UserProfile): boolean {
  return (
    profile1.origin === profile2.origin &&
    profile1.purpose === profile2.purpose &&
    profile1.budget === profile2.budget &&
    JSON.stringify(profile1.activities) === JSON.stringify(profile2.activities) &&
    JSON.stringify(profile1.hobbies) === JSON.stringify(profile2.hobbies)
  );
}