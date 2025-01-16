import { load } from 'js-yaml';
import { validateOpenAPI, ValidationOptions, ValidationResult } from '../schemas/validator';
import { z } from 'zod';

/**
 * Validates an OpenAPI specification from a YAML string
 * @param yamlString The YAML string containing the OpenAPI specification
 * @param options Validation options
 * @returns ValidationResult object
 */
export function validateFromYaml(
  yamlString: string, 
  options: ValidationOptions = {}
): ValidationResult {
  try {
    const parsed = load(yamlString);
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        valid: false,
        errors: new z.ZodError([{
          code: z.ZodIssueCode.custom,
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
        message: error instanceof Error ? error.message : 'Invalid YAML'
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
