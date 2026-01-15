/**
 * Error message utilities for OAS Zod Validator
 * Provides helper functions for working with error messages and suggestions
 */

import { ValidationErrorCode, getErrorCodeInfo } from './codes.js';

/**
 * Template replacement for messages with placeholders like {{expected}}, {{received}}
 */
export function formatMessage(
  message: string,
  replacements: Record<string, string | number>
): string {
  let formatted = message;
  for (const [key, value] of Object.entries(replacements)) {
    formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return formatted;
}

/**
 * Create an enhanced issue from a Zod issue
 */
export function enhanceZodIssue(
  issue: {
    code: string;
    path: (string | number)[];
    message: string;
    expected?: unknown;
    received?: unknown;
    validation?: string;
  },
  specVersion: string = '3.1.0'
): {
  code: string;
  category: string;
  message: string;
  suggestion?: string;
  specLink?: string;
  path: (string | number)[];
  expected?: unknown;
  received?: unknown;
} {
  // Try to map Zod code to our error code
  const mappedCode = mapZodCodeToErrorCode(
    issue.code,
    issue.validation,
    issue.received
  );
  const info = getErrorCodeInfo(mappedCode);

  // Build replacements for message formatting
  const replacements: Record<string, string | number> = {};
  if (issue.expected !== undefined) {
    replacements.expected = String(issue.expected);
  }
  if (issue.received !== undefined) {
    replacements.received = String(issue.received);
  }

  // Generate suggestion with replacements
  let suggestion: string | undefined;
  if (info?.suggestion) {
    suggestion = formatMessage(info.suggestion, replacements);
  }

  // Generate spec link (links to Appear's Specs Hub for enhanced UX)
  let specLink: string | undefined;
  if (info?.specSection) {
    specLink = `https://appear.sh/api-toolkit/specs?openapi=${specVersion}#${info.specSection}`;
  }

  return {
    code: mappedCode,
    category: info?.category || 'general',
    message: info?.defaultMessage || issue.message,
    suggestion,
    specLink,
    path: issue.path,
    expected: issue.expected,
    received: issue.received,
  };
}

/**
 * Map Zod issue codes to our error codes
 */
function mapZodCodeToErrorCode(
  zodCode: string,
  validation?: string,
  received?: unknown
): string {
  // Handle invalid_string validation checks first (regex, email, etc.)
  if (zodCode === 'invalid_string') {
    if (validation === 'email') return ValidationErrorCode.INVALID_EMAIL;
    if (validation === 'uri') return ValidationErrorCode.INVALID_URI;
    if (validation === 'uri-reference')
      return ValidationErrorCode.INVALID_URI_REFERENCE;
    if (validation === 'uuid') return ValidationErrorCode.INVALID_UUID;
    if (validation === 'hostname') return ValidationErrorCode.INVALID_HOSTNAME;
    if (validation === 'ipv4') return ValidationErrorCode.INVALID_IPV4;
    if (validation === 'ipv6') return ValidationErrorCode.INVALID_IPV6;
    if (validation === 'iri') return ValidationErrorCode.INVALID_IRI;
    if (validation === 'iri-reference')
      return ValidationErrorCode.INVALID_IRI_REFERENCE;
    if (validation === 'regex') return ValidationErrorCode.INVALID_REGEX;
    if (validation === 'datetime') return ValidationErrorCode.INVALID_DATE_TIME;
    return ValidationErrorCode.INVALID_FORMAT;
  }

  // Handle invalid_type - distinguish between missing field and type mismatch
  if (zodCode === 'invalid_type') {
    // If received is undefined, it's a missing required field
    if (received === 'undefined' || received === undefined) {
      return ValidationErrorCode.REQUIRED_FIELD;
    }
    // Otherwise it's a type mismatch
    return ValidationErrorCode.INVALID_TYPE;
  }

  // Handle invalid_number
  if (zodCode === 'invalid_number') {
    if (validation === 'min') return ValidationErrorCode.INVALID_MINIMUM;
    if (validation === 'max') return ValidationErrorCode.INVALID_MAXIMUM;
    if (validation === 'multipleOf')
      return ValidationErrorCode.INVALID_MULTIPLE_OF;
    return ValidationErrorCode.NUMERIC_CONSTRAINT_VIOLATION;
  }

  // Handle invalid_date
  if (zodCode === 'invalid_date') {
    return ValidationErrorCode.INVALID_DATE_TIME;
  }

  // Handle invalid_union
  if (zodCode === 'invalid_union') {
    return ValidationErrorCode.INVALID_UNION;
  }

  // Handle unrecognized_keys
  if (zodCode === 'unrecognized_keys') {
    return ValidationErrorCode.UNRECOGNIZED_KEYS;
  }

  // Handle custom validations
  if (zodCode === 'custom') {
    return ValidationErrorCode.CUSTOM_VALIDATION_FAILED;
  }

  // Handle too_small (min constraints)
  if (zodCode === 'too_small') {
    if (validation === 'string') return ValidationErrorCode.INVALID_MIN_LENGTH;
    return ValidationErrorCode.INVALID_MINIMUM;
  }

  // Handle too_big (max constraints)
  if (zodCode === 'too_big') {
    if (validation === 'string') return ValidationErrorCode.INVALID_MAX_LENGTH;
    return ValidationErrorCode.INVALID_MAXIMUM;
  }

  // Default fallback for unknown codes
  return ValidationErrorCode.INVALID_TYPE;
}

/**
 * Group errors by category
 */
export function groupErrorsByCategory<T extends { category: string }>(
  errors: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const error of errors) {
    if (!grouped[error.category]) {
      grouped[error.category] = [];
    }
    grouped[error.category].push(error);
  }
  return grouped;
}

/**
 * Sort errors by severity and path
 */
export function sortErrors<
  T extends { code: string; path: (string | number)[] },
>(errors: T[]): T[] {
  return [...errors].sort((a, b) => {
    // Sort by code (error codes starting with ERR_ take priority)
    const aIsErr = a.code.startsWith('ERR_');
    const bIsErr = b.code.startsWith('ERR_');
    if (aIsErr && !bIsErr) return -1;
    if (!aIsErr && bIsErr) return 1;

    // Then by path length (more specific paths first)
    if (b.path.length !== a.path.length) {
      return b.path.length - a.path.length;
    }

    // Then by code
    return a.code.localeCompare(b.code);
  });
}
