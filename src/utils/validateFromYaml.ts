import { load } from 'js-yaml';
import { ValidationOptions, ValidationResult, validateOpenAPI } from '../schemas/validator.js';
import { z } from 'zod';
import { YAMLParseError, SchemaValidationError } from '../errors/index.js';

/**
 * Validates an OpenAPI specification from a YAML or JSON string
 * 
 * @param content - YAML or JSON string containing the OpenAPI specification
 * @param options - Validation options
 * @returns Validation result
 * @throws {YAMLParseError} If the YAML parsing fails
 */
export function validateFromYaml(content: string, options: ValidationOptions = {}): ValidationResult {
  if (typeof content !== 'string') {
    const error = new z.ZodError([{ 
      code: z.ZodIssueCode.custom, 
      path: [], 
      message: "Input must be a string" 
    }]);
    
    throw new SchemaValidationError(
      "Input must be a string",
      error,
      { context: { inputType: typeof content } }
    );
  }

  try {
    const doc = load(content);
    
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc) || !('openapi' in doc)) {
      const error = new z.ZodError([{ 
        code: z.ZodIssueCode.custom, 
        path: [], 
        message: "YAML must contain an OpenAPI object" 
      }]);
      
      throw new SchemaValidationError(
        "YAML must contain an OpenAPI object", 
        error,
        { context: { receivedType: Array.isArray(doc) ? 'array' : typeof doc } }
      );
    }
    
    return validateOpenAPI(doc, options);
  } catch (err) {
    // If it's already a SchemaValidationError, just propagate it
    if (err instanceof SchemaValidationError) {
      throw err;
    }
    
    // Handle YAML parsing errors
    if (err instanceof Error) {
      throw new YAMLParseError(
        `Failed to parse YAML/JSON: ${err.message}`,
        { cause: err }
      );
    }
    
    // Handle other unknown errors
    throw new YAMLParseError(
      `Failed to parse YAML/JSON: ${String(err)}`
    );
  }
}
