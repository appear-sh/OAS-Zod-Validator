/**
 * Error codes for OAS Zod Validator
 * Finer-grained error codes for programmatic handling and identification
 */

/**
 * Error code enumeration for all validation error types
 */
export enum ValidationErrorCode {
  // Schema validation (ERR_001-ERR_099)
  INVALID_TYPE = 'ERR_001',
  REQUIRED_FIELD = 'ERR_002',
  UNRECOGNIZED_KEYS = 'ERR_003',
  INVALID_UNION = 'ERR_004',
  CUSTOM_VALIDATION_FAILED = 'ERR_005',

  // Format validation (ERR_100-ERR_199)
  INVALID_FORMAT = 'ERR_101',
  FORMAT_TYPE_MISMATCH = 'ERR_102',
  INVALID_DATE_TIME = 'ERR_103',
  INVALID_EMAIL = 'ERR_104',
  INVALID_URI = 'ERR_105',
  INVALID_UUID = 'ERR_106',
  INVALID_HOSTNAME = 'ERR_107',
  INVALID_IPV4 = 'ERR_108',
  INVALID_IPV6 = 'ERR_109',
  INVALID_URI_REFERENCE = 'ERR_110',
  INVALID_IRI = 'ERR_111',
  INVALID_IRI_REFERENCE = 'ERR_112',

  // Reference resolution (ERR_200-ERR_299)
  INVALID_REFERENCE = 'ERR_201',
  REFERENCE_NOT_FOUND = 'ERR_202',
  CIRCULAR_REFERENCE = 'ERR_203',
  INVALID_JSON_POINTER = 'ERR_204',
  REFERENCE_RESOLUTION_FAILED = 'ERR_205',

  // Pattern validation (ERR_300-ERR_399)
  INVALID_REGEX = 'ERR_301',
  REGEX_COMPILE_FAILED = 'ERR_302',
  PATTERN_VALIDATION_FAILED = 'ERR_303',

  // Numeric constraints (ERR_400-ERR_499)
  INVALID_MINIMUM = 'ERR_401',
  INVALID_MAXIMUM = 'ERR_402',
  INVALID_MIN_LENGTH = 'ERR_403',
  INVALID_MAX_LENGTH = 'ERR_404',
  INVALID_EXCLUSIVE_MINIMUM = 'ERR_405',
  INVALID_EXCLUSIVE_MAXIMUM = 'ERR_406',
  INVALID_MULTIPLE_OF = 'ERR_407',
  NUMERIC_CONSTRAINT_VIOLATION = 'ERR_408',

  // Strict mode (ERR_500-ERR_599)
  DUPLICATE_OPERATION_ID = 'ERR_501',
  AMBIGUOUS_PATH = 'ERR_502',
  DUPLICATE_TAG = 'ERR_503',
  MISSING_RATE_LIMITS = 'ERR_504',
  DUPLICATE_PARAMETER = 'ERR_505',
  TAG_NAME_REQUIRED = 'ERR_506',
  OPERATION_ID_REQUIRED = 'ERR_507',

  // API patterns (ERR_600-ERR_699)
  BULK_REQUEST_INVALID = 'ERR_601',
  PAGINATION_INVALID = 'ERR_602',
  PAGINATION_PARAMS_MISSING = 'ERR_603',
  PAGINATION_HEADERS_MISSING = 'ERR_604',
  BULK_RESPONSE_INVALID = 'ERR_605',

  // Version and parsing (ERR_700-ERR_799)
  UNSUPPORTED_VERSION = 'ERR_701',
  INVALID_VERSION_FORMAT = 'ERR_702',
  JSON_PARSE_ERROR = 'ERR_703',
  YAML_PARSE_ERROR = 'ERR_704',

  // General (ERR_900-ERR_999)
  INTERNAL_ERROR = 'ERR_901',
  ABORTED = 'ERR_902',
}

/**
 * Error category types
 */
export type ErrorCategory =
  | 'schema'
  | 'format'
  | 'reference'
  | 'pattern'
  | 'numeric'
  | 'strict'
  | 'api_pattern'
  | 'version'
  | 'general';

/**
 * Interface for error code metadata
 */
export interface ErrorCodeInfo {
  code: ValidationErrorCode;
  category: ErrorCategory;
  defaultMessage: string;
  suggestion?: string;
  specSection?: string;
}

/**
 * Map of all error codes to their metadata
 */
export const ERROR_CODES: Record<ValidationErrorCode, ErrorCodeInfo> = {
  [ValidationErrorCode.INVALID_TYPE]: {
    code: ValidationErrorCode.INVALID_TYPE,
    category: 'schema',
    defaultMessage: 'Invalid type',
    suggestion:
      'Expected {{expected}}, received {{received}}. Check the field type matches the OAS specification.',
  },
  [ValidationErrorCode.REQUIRED_FIELD]: {
    code: ValidationErrorCode.REQUIRED_FIELD,
    category: 'schema',
    defaultMessage: 'Required field is missing',
    suggestion: 'Add the required field to your OpenAPI document.',
    specSection: 'info-object',
  },
  [ValidationErrorCode.UNRECOGNIZED_KEYS]: {
    code: ValidationErrorCode.UNRECOGNIZED_KEYS,
    category: 'schema',
    defaultMessage: 'Unrecognized keys detected',
    suggestion: 'Remove keys that are not part of the OpenAPI specification.',
    specSection: 'specification-extensions',
  },
  [ValidationErrorCode.INVALID_UNION]: {
    code: ValidationErrorCode.INVALID_UNION,
    category: 'schema',
    defaultMessage: 'Value does not match any expected type',
    suggestion:
      'Check that the value matches one of the allowed types in the union.',
  },
  [ValidationErrorCode.CUSTOM_VALIDATION_FAILED]: {
    code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
    category: 'schema',
    defaultMessage: 'Custom validation failed',
    suggestion: 'Check the custom validation rules for this field.',
  },
  [ValidationErrorCode.INVALID_FORMAT]: {
    code: ValidationErrorCode.INVALID_FORMAT,
    category: 'format',
    defaultMessage: 'Invalid format',
    suggestion:
      'Check the format value matches OAS specification requirements.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.FORMAT_TYPE_MISMATCH]: {
    code: ValidationErrorCode.FORMAT_TYPE_MISMATCH,
    category: 'format',
    defaultMessage: 'Format is not valid for the type',
    suggestion:
      'Some formats can only be used with specific types. For example, "email" can only be used with "string".',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_DATE_TIME]: {
    code: ValidationErrorCode.INVALID_DATE_TIME,
    category: 'format',
    defaultMessage: 'Invalid date-time format',
    suggestion:
      'Use ISO 8601 format: "YYYY-MM-DDTHH:mm:ssZ" or "YYYY-MM-DDTHH:mm:ss.sssZ"',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_EMAIL]: {
    code: ValidationErrorCode.INVALID_EMAIL,
    category: 'format',
    defaultMessage: 'Invalid email format',
    suggestion: 'Use a valid email address format like "user@example.com"',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_URI]: {
    code: ValidationErrorCode.INVALID_URI,
    category: 'format',
    defaultMessage: 'Invalid URI format',
    suggestion: 'Use a valid URI format. Example: "https://api.example.com"',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_UUID]: {
    code: ValidationErrorCode.INVALID_UUID,
    category: 'format',
    defaultMessage: 'Invalid UUID format',
    suggestion: 'Use UUID format: "123e4567-e89b-12d3-a456-426614174000"',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_HOSTNAME]: {
    code: ValidationErrorCode.INVALID_HOSTNAME,
    category: 'format',
    defaultMessage: 'Invalid hostname format',
    suggestion: 'Use a valid hostname format like "api.example.com"',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_IPV4]: {
    code: ValidationErrorCode.INVALID_IPV4,
    category: 'format',
    defaultMessage: 'Invalid IPv4 address format',
    suggestion: 'Use valid IPv4 format: "192.168.1.1"',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_IPV6]: {
    code: ValidationErrorCode.INVALID_IPV6,
    category: 'format',
    defaultMessage: 'Invalid IPv6 address format',
    suggestion:
      'Use valid IPv6 format: "2001:0db8:85a3:0000:0000:8a2e:0370:7334"',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_URI_REFERENCE]: {
    code: ValidationErrorCode.INVALID_URI_REFERENCE,
    category: 'format',
    defaultMessage: 'Invalid URI reference format',
    suggestion: 'Use a valid URI reference format.',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_IRI]: {
    code: ValidationErrorCode.INVALID_IRI,
    category: 'format',
    defaultMessage: 'Invalid IRI format',
    suggestion:
      'Use a valid IRI format (Internationalized Resource Identifier).',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_IRI_REFERENCE]: {
    code: ValidationErrorCode.INVALID_IRI_REFERENCE,
    category: 'format',
    defaultMessage: 'Invalid IRI reference format',
    suggestion: 'Use a valid IRI reference format.',
    specSection: 'data-type-format',
  },
  [ValidationErrorCode.INVALID_REFERENCE]: {
    code: ValidationErrorCode.INVALID_REFERENCE,
    category: 'reference',
    defaultMessage: 'Invalid reference format',
    suggestion: 'References must start with "#/" and use JSON Pointer format.',
    specSection: 'reference-object',
  },
  [ValidationErrorCode.REFERENCE_NOT_FOUND]: {
    code: ValidationErrorCode.REFERENCE_NOT_FOUND,
    category: 'reference',
    defaultMessage: 'Reference not found',
    suggestion:
      'Ensure the referenced component exists in your OpenAPI document.',
    specSection: 'reference-object',
  },
  [ValidationErrorCode.CIRCULAR_REFERENCE]: {
    code: ValidationErrorCode.CIRCULAR_REFERENCE,
    category: 'reference',
    defaultMessage: 'Circular reference detected',
    suggestion: 'Remove circular references by restructuring your schemas.',
    specSection: 'reference-object',
  },
  [ValidationErrorCode.INVALID_JSON_POINTER]: {
    code: ValidationErrorCode.INVALID_JSON_POINTER,
    category: 'reference',
    defaultMessage: 'Invalid JSON pointer in reference',
    suggestion:
      'Use valid JSON Pointer format: "#/components/schemas/SchemaName"',
    specSection: 'reference-object',
  },
  [ValidationErrorCode.REFERENCE_RESOLUTION_FAILED]: {
    code: ValidationErrorCode.REFERENCE_RESOLUTION_FAILED,
    category: 'reference',
    defaultMessage: 'Failed to resolve reference',
    suggestion: 'Check that all referenced components are defined.',
  },
  [ValidationErrorCode.INVALID_REGEX]: {
    code: ValidationErrorCode.INVALID_REGEX,
    category: 'pattern',
    defaultMessage: 'Invalid regular expression',
    suggestion: 'Use a valid regular expression pattern.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.REGEX_COMPILE_FAILED]: {
    code: ValidationErrorCode.REGEX_COMPILE_FAILED,
    category: 'pattern',
    defaultMessage: 'Failed to compile regular expression',
    suggestion: 'Check the regex pattern for syntax errors.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.PATTERN_VALIDATION_FAILED]: {
    code: ValidationErrorCode.PATTERN_VALIDATION_FAILED,
    category: 'pattern',
    defaultMessage: 'Pattern validation failed',
    suggestion: 'The value does not match the required pattern.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_MINIMUM]: {
    code: ValidationErrorCode.INVALID_MINIMUM,
    category: 'numeric',
    defaultMessage: 'Value is below minimum',
    suggestion: 'The value must be greater than or equal to the minimum.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_MAXIMUM]: {
    code: ValidationErrorCode.INVALID_MAXIMUM,
    category: 'numeric',
    defaultMessage: 'Value exceeds maximum',
    suggestion: 'The value must be less than or equal to the maximum.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_MIN_LENGTH]: {
    code: ValidationErrorCode.INVALID_MIN_LENGTH,
    category: 'numeric',
    defaultMessage: 'String is too short',
    suggestion:
      'The string must have at least the minimum number of characters.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_MAX_LENGTH]: {
    code: ValidationErrorCode.INVALID_MAX_LENGTH,
    category: 'numeric',
    defaultMessage: 'String is too long',
    suggestion: 'The string must not exceed the maximum number of characters.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_EXCLUSIVE_MINIMUM]: {
    code: ValidationErrorCode.INVALID_EXCLUSIVE_MINIMUM,
    category: 'numeric',
    defaultMessage: 'Value must be greater than minimum',
    suggestion:
      'The value must be strictly greater than the exclusive minimum.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_EXCLUSIVE_MAXIMUM]: {
    code: ValidationErrorCode.INVALID_EXCLUSIVE_MAXIMUM,
    category: 'numeric',
    defaultMessage: 'Value must be less than maximum',
    suggestion: 'The value must be strictly less than the exclusive maximum.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.INVALID_MULTIPLE_OF]: {
    code: ValidationErrorCode.INVALID_MULTIPLE_OF,
    category: 'numeric',
    defaultMessage: 'Value is not a multiple',
    suggestion: 'The value must be a multiple of the specified number.',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.NUMERIC_CONSTRAINT_VIOLATION]: {
    code: ValidationErrorCode.NUMERIC_CONSTRAINT_VIOLATION,
    category: 'numeric',
    defaultMessage: 'Numeric constraint violated',
    suggestion:
      'Check the numeric constraints (minimum, maximum, multipleOf, etc.).',
    specSection: 'schema-object',
  },
  [ValidationErrorCode.DUPLICATE_OPERATION_ID]: {
    code: ValidationErrorCode.DUPLICATE_OPERATION_ID,
    category: 'strict',
    defaultMessage: 'Duplicate operationId',
    suggestion: 'Each operation must have a unique operationId.',
    specSection: 'operation-object',
  },
  [ValidationErrorCode.AMBIGUOUS_PATH]: {
    code: ValidationErrorCode.AMBIGUOUS_PATH,
    category: 'strict',
    defaultMessage: 'Ambiguous path template',
    suggestion:
      'Path templates must be unique. /pets/{petId} and /pets/{name} are ambiguous.',
    specSection: 'paths-object',
  },
  [ValidationErrorCode.DUPLICATE_TAG]: {
    code: ValidationErrorCode.DUPLICATE_TAG,
    category: 'strict',
    defaultMessage: 'Duplicate tag name',
    suggestion: 'Tag names must be unique in the tags array.',
    specSection: 'tag-object',
  },
  [ValidationErrorCode.MISSING_RATE_LIMITS]: {
    code: ValidationErrorCode.MISSING_RATE_LIMITS,
    category: 'strict',
    defaultMessage: 'Rate limit headers are required',
    suggestion:
      'Add rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) to responses.',
  },
  [ValidationErrorCode.DUPLICATE_PARAMETER]: {
    code: ValidationErrorCode.DUPLICATE_PARAMETER,
    category: 'strict',
    defaultMessage: 'Duplicate parameter',
    suggestion: 'Parameters must be unique by name and location (in).',
    specSection: 'parameter-object',
  },
  [ValidationErrorCode.TAG_NAME_REQUIRED]: {
    code: ValidationErrorCode.TAG_NAME_REQUIRED,
    category: 'strict',
    defaultMessage: 'Tag name is required',
    suggestion: 'Each tag object must have a name property.',
    specSection: 'tag-object',
  },
  [ValidationErrorCode.OPERATION_ID_REQUIRED]: {
    code: ValidationErrorCode.OPERATION_ID_REQUIRED,
    category: 'strict',
    defaultMessage: 'OperationId is required',
    suggestion:
      'Each operation should have an operationId for stable client generation.',
    specSection: 'operation-object',
  },
  [ValidationErrorCode.BULK_REQUEST_INVALID]: {
    code: ValidationErrorCode.BULK_REQUEST_INVALID,
    category: 'api_pattern',
    defaultMessage: 'Invalid bulk request schema',
    suggestion:
      'Bulk endpoints should have a request body with an array of items.',
    specSection: 'request-body-object',
  },
  [ValidationErrorCode.PAGINATION_INVALID]: {
    code: ValidationErrorCode.PAGINATION_INVALID,
    category: 'api_pattern',
    defaultMessage: 'Invalid pagination configuration',
    suggestion: 'Check pagination parameters and response headers.',
  },
  [ValidationErrorCode.PAGINATION_PARAMS_MISSING]: {
    code: ValidationErrorCode.PAGINATION_PARAMS_MISSING,
    category: 'api_pattern',
    defaultMessage: 'Pagination parameters missing',
    suggestion:
      'Pagination endpoints should have page, per_page, or similar parameters.',
  },
  [ValidationErrorCode.PAGINATION_HEADERS_MISSING]: {
    code: ValidationErrorCode.PAGINATION_HEADERS_MISSING,
    category: 'api_pattern',
    defaultMessage: 'Pagination response headers missing',
    suggestion:
      'Pagination responses should include Total-Count or similar headers.',
  },
  [ValidationErrorCode.BULK_RESPONSE_INVALID]: {
    code: ValidationErrorCode.BULK_RESPONSE_INVALID,
    category: 'api_pattern',
    defaultMessage: 'Invalid bulk response schema',
    suggestion:
      'Bulk endpoints should have a response body with an array of items.',
    specSection: 'response-object',
  },
  [ValidationErrorCode.UNSUPPORTED_VERSION]: {
    code: ValidationErrorCode.UNSUPPORTED_VERSION,
    category: 'version',
    defaultMessage: 'Unsupported OpenAPI version',
    suggestion: 'Supported versions are 3.0.x, 3.1.x, and 3.2.x',
    specSection: 'oas-object',
  },
  [ValidationErrorCode.INVALID_VERSION_FORMAT]: {
    code: ValidationErrorCode.INVALID_VERSION_FORMAT,
    category: 'version',
    defaultMessage: 'Invalid version format',
    suggestion: 'Use semver format: "3.0.0", "3.1.0", "3.2.0"',
    specSection: 'oas-object',
  },
  [ValidationErrorCode.JSON_PARSE_ERROR]: {
    code: ValidationErrorCode.JSON_PARSE_ERROR,
    category: 'version',
    defaultMessage: 'Failed to parse JSON',
    suggestion: 'Check your JSON syntax for errors.',
  },
  [ValidationErrorCode.YAML_PARSE_ERROR]: {
    code: ValidationErrorCode.YAML_PARSE_ERROR,
    category: 'version',
    defaultMessage: 'Failed to parse YAML',
    suggestion: 'Check your YAML syntax for errors.',
  },
  [ValidationErrorCode.INTERNAL_ERROR]: {
    code: ValidationErrorCode.INTERNAL_ERROR,
    category: 'general',
    defaultMessage: 'Internal validation error',
    suggestion: 'This is unexpected. Please report the issue.',
  },
  [ValidationErrorCode.ABORTED]: {
    code: ValidationErrorCode.ABORTED,
    category: 'general',
    defaultMessage: 'Validation was aborted',
    suggestion: 'The validation was cancelled before completion.',
  },
};

/**
 * Get error code info by code string
 */
export function getErrorCodeInfo(code: string): ErrorCodeInfo | undefined {
  const codeEnum = Object.values(ValidationErrorCode).find((c) => c === code);
  if (codeEnum) {
    return ERROR_CODES[codeEnum];
  }
  return undefined;
}
