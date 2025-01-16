import { load } from 'js-yaml';
import { validateOpenAPI, ValidationOptions, ValidationResult } from '../schemas/validator';
import { z } from 'zod';
import fs from 'fs';

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

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const fileName = args[0];
  const options: ValidationOptions = {
    allowFutureOASVersions: args.includes('--allow-future'),
    strict: args.includes('--strict')
  };

  if (!fileName) {
    console.error('Usage: ts-node validateFromYaml.ts <path-to-yaml> [--allow-future] [--strict]');
    process.exit(1);
  }

  try {
    const yamlContent = fs.readFileSync(fileName, 'utf-8');
    const result = validateFromYaml(yamlContent, options);
    
    if (result.valid) {
      console.log('YAML spec is valid OAS');
      process.exit(0);
    } else {
      console.error('YAML spec is invalid:', result.errors);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error reading or validating YAML file:', err);
    process.exit(1);
  }
}
