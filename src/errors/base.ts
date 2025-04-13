/**
 * Base error class for the OpenAPI validator
 * All errors thrown by the validator should extend this class
 */
export class OpenAPIValidatorError extends Error {
  /** Error code for categorization and handling */
  code: string;

  /** Optional source of the error (file, location, etc.) */
  source?: string;

  /** Additional context information */
  context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code: string;
      source?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code;
    this.source = options.source;
    this.context = options.context;
  }
}

/**
 * Error codes used throughout the application
 */
export enum ErrorCode {
  // General errors
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  SCHEMA_VALIDATION = 'SCHEMA_VALIDATION',

  // Reference related errors
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  REFERENCE_NOT_FOUND = 'REFERENCE_NOT_FOUND',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',

  // Strict validation errors
  STRICT_VALIDATION = 'STRICT_VALIDATION',
  RATE_LIMIT_REQUIRED = 'RATE_LIMIT_REQUIRED',

  // File handling errors
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  INVALID_YAML = 'INVALID_YAML',
  INVALID_JSON = 'INVALID_JSON',

  // Unexpected errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
