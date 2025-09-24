/**
 * Utility functions for chat session management
 */

/**
 * Generates a unique session ID for chat using UUID
 */
export function generateChatId(): string {
  return crypto.randomUUID();
}

/**
 * Validates if a chat ID has the correct UUID format
 */
export function isValidChatId(chatId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(chatId);
}

/**
 * Creates a navigation URL for a chat session
 */
export function createChatUrl(chatId: string): string {
  return `/chat/session/${chatId}`;
}

/**
 * Creates a navigation URL for the chat session manager
 */
export function createChatManagerUrl(): string {
  return '/chat';
}

/**
 * Extracts the session ID from a chat URL path
 */
export function extractChatIdFromPath(path: string): string | null {
  const match = path.match(/\/chat\/session\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i);
  return match ? match[1] : null;
}