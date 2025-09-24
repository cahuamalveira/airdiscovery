/**
 * Type guards and validation utilities for chat domain types
 */

import { UserProfile, ChatSession, ChatMessage, StreamChunk, StreamMetadata } from './chat';

/**
 * Type guard for UserProfile
 */
export function isUserProfile(obj: unknown): obj is UserProfile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as UserProfile).origin === 'string' &&
    Array.isArray((obj as UserProfile).activities) &&
    typeof (obj as UserProfile).budget === 'number' &&
    typeof (obj as UserProfile).purpose === 'string' &&
    Array.isArray((obj as UserProfile).hobbies)
  );
}

/**
 * Type guard for ChatMessage
 */
export function isChatMessage(obj: unknown): obj is ChatMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ChatMessage).id === 'string' &&
    ['user', 'assistant', 'system'].includes((obj as ChatMessage).role) &&
    typeof (obj as ChatMessage).content === 'string' &&
    (obj as ChatMessage).timestamp instanceof Date
  );
}

/**
 * Type guard for ChatSession
 */
export function isChatSession(obj: unknown): obj is ChatSession {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ChatSession).sessionId === 'string' &&
    typeof (obj as ChatSession).userId === 'string' &&
    Array.isArray((obj as ChatSession).messages) &&
    isUserProfile((obj as ChatSession).profileData) &&
    typeof (obj as ChatSession).currentQuestionIndex === 'number' &&
    typeof (obj as ChatSession).interviewComplete === 'boolean' &&
    typeof (obj as ChatSession).readyForRecommendation === 'boolean'
  );
}

/**
 * Type guard for StreamChunk
 */
export function isStreamChunk(obj: unknown): obj is StreamChunk {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as StreamChunk).content === 'string' &&
    typeof (obj as StreamChunk).isComplete === 'boolean' &&
    typeof (obj as StreamChunk).sessionId === 'string'
  );
}

/**
 * Validates budget is within reasonable bounds
 */
export function isValidBudget(budget: number): boolean {
  return budget >= 0 && budget <= 10000000; // 0 to R$ 100,000
}

/**
 * Validates origin is a non-empty string
 */
export function isValidOrigin(origin: string): boolean {
  return typeof origin === 'string' && origin.trim().length > 0;
}

/**
 * Validates activities array
 */
export function isValidActivities(activities: readonly string[]): boolean {
  return Array.isArray(activities) && activities.every(activity => 
    typeof activity === 'string' && activity.trim().length > 0
  );
}

/**
 * Validates purpose is a non-empty string
 */
export function isValidPurpose(purpose: string): boolean {
  return typeof purpose === 'string' && purpose.trim().length > 0;
}

/**
 * Validates hobbies array
 */
export function isValidHobbies(hobbies: readonly string[]): boolean {
  return Array.isArray(hobbies) && hobbies.every(hobby => 
    typeof hobby === 'string' && hobby.trim().length > 0
  );
}

/**
 * Validates complete UserProfile
 */
export function isValidUserProfile(profile: UserProfile): boolean {
  return (
    isValidOrigin(profile.origin) &&
    isValidActivities(profile.activities) &&
    isValidBudget(profile.budget) &&
    isValidPurpose(profile.purpose) &&
    isValidHobbies(profile.hobbies)
  );
}

/**
 * Validates interview progress
 */
export function isValidInterviewProgress(
  currentQuestion: number, 
  totalQuestions: number
): boolean {
  return (
    typeof currentQuestion === 'number' &&
    typeof totalQuestions === 'number' &&
    currentQuestion >= 0 &&
    totalQuestions > 0 &&
    currentQuestion <= totalQuestions
  );
}