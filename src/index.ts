import { validateOpenAPI, ValidationOptions, ValidationResult } from './schemas/validator.js';
import { validateFromYaml } from './utils/validateFromYaml.js';
import { getValidationCache, CacheOptions, ValidationCache } from './utils/cache.js';
import { verifyRefTargets } from './utils/refResolver.js';

// Core validation functions
export {
  validateOpenAPI,
  validateFromYaml,
  verifyRefTargets
};

// Cache functionality
export {
  getValidationCache
};

// Types
export type {
  ValidationOptions,
  ValidationResult,
  CacheOptions
};

// Re-export types that consumers might need
export type { OpenAPIObject } from './schemas/openapi.js';
export type { OpenAPIObject31 } from './schemas/openapi31.js';

/**
 * Configure the global validation cache
 * 
 * @param options - Cache configuration options
 */
export function configureCache(options: CacheOptions): void {
  getValidationCache().configure(options);
}

/**
 * Reset the global validation cache
 */
export function resetCache(): void {
  getValidationCache().reset();
}
