/**
 * Redaction Utility
 * Provides functions to redact sensitive data from log entries
 * Supports payment fields, authentication fields, and environment-aware PII redaction
 */

const REDACTED_VALUE = '[REDACTED]';

/**
 * Payment-related field patterns
 */
const PAYMENT_FIELDS = [
  'cardNumber',
  'cardnumber',
  'card_number',
  'cvv',
  'cvc',
  'cardDetails',
  'card_details',
  'cardholderName',
  'cardholder_name',
  'expiryDate',
  'expiry_date',
  'securityCode',
  'security_code',
];

/**
 * Authentication-related field patterns
 */
const AUTH_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'apiKey',
  'api_key',
  'privateKey',
  'private_key',
  'authorization',
  'auth',
  'bearer',
  'sessionId',
  'session_id',
  'cookie',
  'cookies',
];

/**
 * PII (Personally Identifiable Information) field patterns
 * Only redacted in production environment
 */
const PII_FIELDS = [
  'email',
  'emailAddress',
  'email_address',
  'phone',
  'phoneNumber',
  'phone_number',
  'mobile',
  'mobileNumber',
  'mobile_number',
  'ssn',
  'socialSecurityNumber',
  'social_security_number',
  'taxId',
  'tax_id',
];

/**
 * Custom redaction patterns (regex)
 * Can be extended at runtime
 */
const customPatterns: RegExp[] = [];

/**
 * Add a custom redaction pattern
 * @param pattern - Regular expression or string pattern to match field names
 */
export function addRedactionPattern(pattern: string | RegExp): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  customPatterns.push(regex);
}

/**
 * Check if a field name should be redacted
 * @param fieldName - The name of the field to check
 * @param environment - Current environment (development, staging, production)
 * @returns true if the field should be redacted
 */
function shouldRedactField(fieldName: string, environment: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();

  // Always redact payment fields
  if (PAYMENT_FIELDS.some((field) => lowerFieldName.includes(field.toLowerCase()))) {
    return true;
  }

  // Always redact authentication fields
  if (AUTH_FIELDS.some((field) => lowerFieldName.includes(field.toLowerCase()))) {
    return true;
  }

  // Redact PII only in production
  if (environment === 'production') {
    if (PII_FIELDS.some((field) => lowerFieldName.includes(field.toLowerCase()))) {
      return true;
    }
  }

  // Check custom patterns
  if (customPatterns.some((pattern) => pattern.test(fieldName))) {
    return true;
  }

  return false;
}

/**
 * Redact sensitive data from an object
 * @param data - The data object to redact
 * @param environment - Current environment (defaults to NODE_ENV or 'development')
 * @returns A new object with sensitive fields redacted
 */
export function redact(data: any, environment?: string): any {
  const env = environment || process.env.NODE_ENV || process.env.SENTRY_ENVIRONMENT || 'development';

  // Handle null or undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => redact(item, env));
  }

  // Handle objects
  const redacted: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (shouldRedactField(key, env)) {
      redacted[key] = REDACTED_VALUE;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      redacted[key] = redact(value, env);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Redact sensitive data from request headers
 * Specifically handles common HTTP header patterns
 * @param headers - Request headers object
 * @returns Redacted headers object
 */
export function redactHeaders(headers: Record<string, any>): Record<string, any> {
  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Redact authorization headers
    if (lowerKey === 'authorization' || lowerKey === 'cookie' || lowerKey === 'set-cookie') {
      redacted[key] = REDACTED_VALUE;
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Redact sensitive query parameters from a URL
 * @param url - The URL string to redact
 * @returns URL with sensitive query parameters redacted
 */
export function redactUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Check each query parameter
    params.forEach((value, key) => {
      if (shouldRedactField(key, process.env.SENTRY_ENVIRONMENT || 'development')) {
        params.set(key, REDACTED_VALUE);
      }
    });

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Get the list of currently configured redaction patterns
 * Useful for debugging and testing
 */
export function getRedactionPatterns(): {
  payment: string[];
  auth: string[];
  pii: string[];
  custom: RegExp[];
} {
  return {
    payment: [...PAYMENT_FIELDS],
    auth: [...AUTH_FIELDS],
    pii: [...PII_FIELDS],
    custom: [...customPatterns],
  };
}
