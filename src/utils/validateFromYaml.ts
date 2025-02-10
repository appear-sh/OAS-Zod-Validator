import yaml from 'js-yaml';
import { validateOpenAPI, ValidationOptions, ValidationResult } from '../schemas/validator.js';
import { z } from 'zod';

export function validateFromYaml(
  yamlString: string, 
  options: ValidationOptions = {}
): ValidationResult {
  if (typeof yamlString !== 'string') {
    return {
      valid: false,
      errors: new z.ZodError([{
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: typeof yamlString,
        path: [],
        message: 'Input must be a string'
      }]),
      resolvedRefs: []
    };
  }

  try {
    const parsed = yaml.load(yamlString);
    
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        valid: false,
        errors: new z.ZodError([{
          code: z.ZodIssueCode.invalid_type,
          expected: 'object',
          received: Array.isArray(parsed) ? 'array' : typeof parsed,
          path: [],
          message: 'YAML must contain an object'
        }]),
        resolvedRefs: []
      };
    }

    return validateOpenAPI(parsed, options);
  } catch (error) {
    return {
      valid: false,
      errors: new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: error instanceof Error ? error.message : 'Failed to parse YAML content'
      }]),
      resolvedRefs: []
    };
  }
}
