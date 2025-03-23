import { OpenAPIValidatorError, ErrorCode } from './base.js';

/**
 * Error thrown when there's an issue reading or parsing files
 */
export class FileError extends OpenAPIValidatorError {
  /** The file path that caused the error */
  filePath?: string;

  constructor(
    message: string,
    options: {
      code: ErrorCode.FILE_READ_ERROR | ErrorCode.INVALID_YAML | ErrorCode.INVALID_JSON;
      filePath?: string;
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, {
      code: options.code,
      source: options.filePath,
      cause: options.cause,
      context: options.context
    });
    this.filePath = options.filePath;
  }
}

/**
 * Error thrown when YAML parsing fails
 */
export class YAMLParseError extends FileError {
  constructor(
    message: string,
    options: {
      filePath?: string;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      code: ErrorCode.INVALID_YAML,
      filePath: options.filePath,
      cause: options.cause,
      context: options.context
    });
  }
}

/**
 * Error thrown when JSON parsing fails
 */
export class JSONParseError extends FileError {
  constructor(
    message: string,
    options: {
      filePath?: string;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      code: ErrorCode.INVALID_JSON,
      filePath: options.filePath,
      cause: options.cause,
      context: options.context
    });
  }
} 