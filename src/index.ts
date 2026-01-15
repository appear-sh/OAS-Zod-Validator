import {
  validateOpenAPI,
  validateOpenAPIEnhanced,
  ValidationOptions,
  ValidationResult,
  EnhancedValidationResult,
  validateOpenAPIDocument,
  LocatedValidationResult,
} from './schemas/validator.js';
import { validateFromYaml } from './utils/validateFromYaml.js';
import { getValidationCache, CacheOptions } from './utils/cache.js';
import { verifyRefTargets } from './utils/refResolver.js';
import { Position, Range, LocatedZodIssue } from './types/location.js';
import {
  ValidationErrorCode,
  ERROR_CODES,
  getErrorCodeInfo,
} from './errors/codes.js';

// Core validation functions
export {
  validateOpenAPI,
  validateOpenAPIEnhanced,
  validateFromYaml,
  verifyRefTargets,
  validateOpenAPIDocument,
};

// Cache functionality
export { getValidationCache };

// Error codes
export { ValidationErrorCode, ERROR_CODES, getErrorCodeInfo };

// Types
export type {
  ValidationOptions,
  ValidationResult,
  EnhancedValidationResult,
  CacheOptions,
  LocatedValidationResult,
  LocatedZodIssue,
  Position,
  Range,
};

// Re-export types that consumers might need
export type { OpenAPIObject } from './schemas/openapi.js';
export type { OpenAPIObject31 } from './schemas/openapi31.js';
export type { OpenAPIObject32 } from './schemas/openapi32.js';

// Export memory utilities
export {
  getMemoryUsageMB,
  trackMemoryUsage,
  MemoryOptions,
  DEFAULT_MEMORY_OPTIONS,
} from './utils/memoryUtils.js';

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
