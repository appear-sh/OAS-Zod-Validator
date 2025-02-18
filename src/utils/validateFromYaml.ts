import { load } from 'js-yaml';
import { ValidationOptions, ValidationResult, validateOpenAPI } from '../schemas/validator.js';
import { z } from 'zod';

/**
 * Validates an OpenAPI specification from a YAML or JSON string
 * @param content - YAML or JSON string containing the OpenAPI specification
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFromYaml(content: string, options: ValidationOptions = {}): ValidationResult {
  if (typeof content !== 'string') {
    return {
      valid: false,
      errors: new z.ZodError([{ code: z.ZodIssueCode.custom, path: [], message: "Input must be a string" }]),
      resolvedRefs: []
    };
  }

  try {
    const doc = load(content);
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc) || !('openapi' in doc)) {
      return {
        valid: false,
        errors: new z.ZodError([{ code: z.ZodIssueCode.custom, path: [], message: "YAML must contain an object" }]),
        resolvedRefs: []
      };
    }
    return validateOpenAPI(doc, options);
  } catch (err) {
    return {
      valid: false,
      errors: new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: `Failed to parse YAML/JSON: ${err instanceof Error ? err.message : String(err)}`
      }]),
      resolvedRefs: []
    };
  }
}
