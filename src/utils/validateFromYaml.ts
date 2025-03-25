import { load } from 'js-yaml';
import { ValidationOptions, ValidationResult, validateOpenAPI } from '../schemas/validator.js';
import { z } from 'zod';
import { YAMLParseError, SchemaValidationError } from '../errors/index.js';
import { getValidationCache } from './cache.js';

/**
 * Cache for parsed YAML/JSON documents
 */
const YAML_CACHE = new Map<string, unknown>();

/**
 * Max size for the YAML cache
 */
const MAX_YAML_CACHE_SIZE = 50;

/**
 * Generate a cache key for YAML content
 * 
 * @param content - YAML content to generate a key for
 * @returns A cache key based on a lightweight hash of the content
 */
function generateYamlCacheKey(content: string): string {
  // Simple "hash" using first 100 chars + length + last 100 chars 
  const start = content.slice(0, 100);
  const end = content.slice(-100);
  return `${start}_${content.length}_${end}`;
}

/**
 * Parse YAML content with caching
 * 
 * @param content - YAML content to parse
 * @returns Parsed YAML document
 */
function parseYamlWithCache(content: string): unknown {
  // Don't use cache in test mode
  if (process.env.NODE_ENV === 'test') {
    return load(content);
  }
  
  const key = generateYamlCacheKey(content);
  
  if (YAML_CACHE.has(key)) {
    return YAML_CACHE.get(key);
  }
  
  const parsed = load(content);
  
  // Cache management: remove oldest entries if cache is too large
  if (YAML_CACHE.size >= MAX_YAML_CACHE_SIZE) {
    const keysToDelete = Array.from(YAML_CACHE.keys()).slice(0, 5); // Remove 5 oldest entries
    keysToDelete.forEach(k => YAML_CACHE.delete(k));
  }
  
  YAML_CACHE.set(key, parsed);
  return parsed;
}

/**
 * Validates an OpenAPI specification from a YAML or JSON string
 * 
 * @param content - YAML or JSON string containing the OpenAPI specification
 * @param options - Validation options
 * @returns Validation result
 * @throws {YAMLParseError} If the YAML parsing fails
 * @throws {SchemaValidationError} If the input is not a string
 */
export function validateFromYaml(content: string, options: ValidationOptions = {}): ValidationResult {
  // First validate that content is a string before attempting any caching operations
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
  
  // Disable caching in test environment
  const testMode = process.env.NODE_ENV === 'test';
  const cacheOptions = testMode 
    ? { ...options.cache, enabled: false }
    : options.cache;
  
  const cache = getValidationCache(cacheOptions);
  
  // First check if we have the full result cached
  const contentHash = generateYamlCacheKey(content);
  const cacheKey = `yaml_${contentHash}_${JSON.stringify(options)}`;
  const cachedResult = cache.getValidationResult(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }

  try {
    // Use cached YAML parsing if available
    const doc = parseYamlWithCache(content);
    
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
    
    const result = validateOpenAPI(doc, options);
    
    // Cache the result with the YAML-specific key if not in test mode
    if (!testMode) {
      cache.setValidationResult(cacheKey, result);
    }
    
    return result;
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
