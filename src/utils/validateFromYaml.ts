import { load } from 'js-yaml';
import { validateOpenAPI, ValidationOptions, ValidationResult } from '../schemas/validator';
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

  if (!yamlString.trim()) {
    return {
      valid: false,
      errors: new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Input cannot be empty'
      }]),
      resolvedRefs: []
    };
  }

  try {
    const parsed = load(yamlString);
    
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
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

// Example usage:
if (require.main === module) {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error('Usage: node validateFromYaml.js <path-to-yaml>');
    process.exit(1);
  }
  
  try {
    const result = validateFromYaml(fileName);
    if (result.valid) {
      console.log('YAML spec is valid OAS:', result.resolvedRefs);
    } else {
      console.error('YAML spec is invalid OAS:', result.errors);
    }
  } catch (err) {
    console.error('Error validating YAML:', err);
    process.exit(1);
  }
}
