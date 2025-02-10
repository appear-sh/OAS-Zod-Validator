import { validateOpenAPI, ValidationOptions, ValidationResult } from './schemas/validator.js';
import { validateFromYaml } from './utils/validateFromYaml.js';

// Core validation functions
export {
  validateOpenAPI,
  validateFromYaml
};

// Types
export type {
  ValidationOptions,
  ValidationResult
};

// Re-export types that consumers might need
export type { OpenAPIObject } from './schemas/openapi.js';
export type { OpenAPIObject31 } from './schemas/openapi31.js';
