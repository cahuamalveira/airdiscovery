import { ConversationStage, CollectedData } from '../interfaces/json-response.interface';

/**
 * Interface for button options
 */
export interface ButtonOption {
  readonly label: string;
  readonly value: string;
}

/**
 * Static button options for passenger selection
 * These are predefined values that cannot be modified by user input
 */
export const PASSENGER_BUTTON_OPTIONS = {
  adults: [
    { label: '1 adulto', value: '1' },
    { label: '2 adultos', value: '2' },
    { label: '3 adultos', value: '3' },
    { label: '4 adultos', value: '4' },
  ] as readonly ButtonOption[],

  children: [
    { label: 'Nenhuma', value: '0' },
    { label: '1 criança', value: '1' },
    { label: '2 crianças', value: '2' },
    { label: '3 crianças', value: '3' },
  ] as readonly ButtonOption[],
} as const;

/**
 * Generates button options based on conversation stage and collected data.
 * Only returns options for the collecting_passengers stage.
 * 
 * @param stage - Current conversation stage
 * @param collectedData - Data collected so far in the conversation
 * @returns Button options array or null if no buttons needed
 */
export function getButtonOptionsForStage(
  stage: ConversationStage,
  collectedData: CollectedData
): readonly ButtonOption[] | null {
  // Only show buttons for collecting_passengers stage
  if (stage !== 'collecting_passengers') {
    return null;
  }

  const passengerComposition = collectedData.passenger_composition;

  // No passenger data yet - show adult options
  if (!passengerComposition) {
    return PASSENGER_BUTTON_OPTIONS.adults;
  }

  // Adults collected but children not yet - show children options
  if (passengerComposition.adults !== null && passengerComposition.children === null) {
    return PASSENGER_BUTTON_OPTIONS.children;
  }

  // All passenger data collected - no buttons needed
  return null;
}
