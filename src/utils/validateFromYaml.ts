import { load } from 'js-yaml';
import { validateOpenAPI, ValidationOptions, ValidationResult } from '../schemas/validator';

export function validateFromYaml(
  yamlString: string, 
  options: ValidationOptions = {}
): ValidationResult {
  if (typeof yamlString !== 'string') {
    return {
      valid: false,
      errors: new Error('Input must be a string'),
    };
  }

  if (!yamlString.trim()) {
    return {
      valid: false,
      errors: new Error('Input cannot be empty'),
    };
  }

  try {
    const parsed = load(yamlString);
    
    if (parsed === null || typeof parsed !== 'object') {
      return {
        valid: false,
        errors: new Error('YAML must contain an object'),
      };
    }

    return validateOpenAPI(parsed, options);
  } catch (error) {
    return {
      valid: false,
      errors: error instanceof Error 
        ? error 
        : new Error('Failed to parse YAML content'),
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
