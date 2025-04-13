import { z } from 'zod';
import { OpenAPIValidatorError, ErrorCode } from './base.js';

/**
 * Error thrown when schema validation fails
 */
export class SchemaValidationError extends OpenAPIValidatorError {
  /** The Zod validation error */
  zodError: z.ZodError;

  constructor(
    message: string,
    zodError: z.ZodError,
    options?: {
      source?: string;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, {
      code: ErrorCode.SCHEMA_VALIDATION,
      source: options?.source,
      context: options?.context,
      cause: zodError,
    });
    this.zodError = zodError;
  }

  /**
   * Get a formatted representation of the validation errors
   */
  getFormattedErrors(): string {
    return this.zodError.errors
      .map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      })
      .join('\n');
  }
}

/**
 * Error thrown when a reference is invalid or not found
 */
export class ReferenceError extends OpenAPIValidatorError {
  /** The reference that caused the error */
  reference: string;

  constructor(
    reference: string,
    message: string,
    options: {
      code:
        | ErrorCode.INVALID_REFERENCE
        | ErrorCode.REFERENCE_NOT_FOUND
        | ErrorCode.CIRCULAR_REFERENCE;
      source?: string;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, {
      code: options.code,
      source: options.source,
      context: options.context,
    });
    this.reference = reference;
  }
}

/**
 * Error thrown when strict validation fails
 */
export class StrictValidationError extends OpenAPIValidatorError {
  constructor(
    message: string,
    options: {
      code?: ErrorCode.STRICT_VALIDATION | ErrorCode.RATE_LIMIT_REQUIRED;
      source?: string;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      code: options.code || ErrorCode.STRICT_VALIDATION,
      source: options.source,
      context: options.context,
    });
  }
}

/**
 * Error thrown when the OpenAPI version is not supported
 */
export class VersionError extends OpenAPIValidatorError {
  /** The version that was provided */
  version: string;

  constructor(
    version: string,
    message: string = `Unsupported OpenAPI version: ${version}`,
    options?: {
      source?: string;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, {
      code: ErrorCode.UNSUPPORTED_VERSION,
      source: options?.source,
      context: options?.context,
    });
    this.version = version;
  }
}
