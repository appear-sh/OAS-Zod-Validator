import { z } from 'zod';
import { OpenAPIObject } from './openapi.js';
import { OpenAPIObject31 } from './openapi31.js';
import { verifyRefTargets } from '../utils/verifyRefTargets.js';
import { OpenAPISpec, PathItem, Operation } from './types.js';
import { BulkRequestSchema, BulkResponseSchema, PaginationHeadersSchema, PaginationParamsSchema } from './api_patterns.js';
import { 
  ErrorCode, 
  SchemaValidationError, 
  StrictValidationError, 
  VersionError 
} from '../errors/index.js';
import { 
  OpenAPIVersion, 
  createOpenAPIVersion 
} from '../types/index.js';
import { getValidationCache, CacheOptions } from '../utils/cache.js';

/**
 * Options for validating OpenAPI specifications
 */
export interface ValidationOptions {
  /** Enable strict validation mode with additional checks */
  strict?: boolean;
  
  /** Allow future OpenAPI versions (beyond those fully supported) */
  allowFutureOASVersions?: boolean;
  
  /** Strict validation rule configurations */
  strictRules?: {
    /** Require rate limit headers in responses */
    requireRateLimitHeaders?: boolean;
  };
  
  /** Cache configuration options */
  cache?: CacheOptions;
}

/**
 * Result of OpenAPI validation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  
  /** Validation errors, if any */
  errors?: z.ZodError;
  
  /** References that were resolved successfully */
  resolvedRefs: string[];
}

/**
 * Detects the OpenAPI version from a document
 * 
 * @param doc - The document to check
 * @returns The OpenAPI version as a branded type
 * @throws {VersionError} If the version is missing or unsupported
 */
function detectOpenAPIVersion(doc: Record<string, unknown>): OpenAPIVersion {
  if (!doc || typeof doc.openapi !== 'string') {
    throw new VersionError('unknown', 'Invalid OpenAPI document: missing or invalid openapi version');
  }
  
  try {
    if (doc.openapi.startsWith('3.1.')) {
      return createOpenAPIVersion(doc.openapi);
    }
    if (doc.openapi.startsWith('3.0.')) {
      return createOpenAPIVersion(doc.openapi);
    }
    throw new VersionError(doc.openapi);
  } catch (error) {
    if (error instanceof VersionError) {
      throw error;
    }
    throw new VersionError(typeof doc.openapi === 'string' ? doc.openapi : 'unknown');
  }
}

/**
 * Validates that rate limit headers are present in responses when required
 * 
 * @param doc - The OpenAPI document to validate
 * @param options - Validation options
 * @returns ZodError if validation fails, otherwise undefined
 */
function validateRateLimitHeaders(doc: OpenAPISpec, options: ValidationOptions): z.ZodError | undefined {
  if (!options.strict || !options.strictRules?.requireRateLimitHeaders) {
    return undefined;
  }

  const issues: z.ZodIssue[] = [];
  
  const paths = doc.paths || {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    
    for (const [methodKey, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== 'object' || methodKey === '$ref') continue;
      
      const responses = 'responses' in operation ? operation.responses : {};
      for (const [status, response] of Object.entries(responses)) {
        if (!response || typeof response !== 'object') continue;
        if ('$ref' in response) continue;
        
        const headers = 'headers' in response ? (response.headers as Record<string, unknown>) : {};
        const required = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'];
        if (!required.every(header => header in headers)) {
          issues.push({
            code: z.ZodIssueCode.custom,
            path: ['paths', pathKey, methodKey, 'responses', status, 'headers'],
            message: 'Rate limiting headers are required in strict mode'
          });
        }
      }
    }
  }
  
  return issues.length ? new z.ZodError(issues) : undefined;
}

/**
 * Creates a customized Zod error map based on validation options
 * 
 * @param options - Validation options
 * @returns A Zod error map function
 */
const createErrorMap = (options: ValidationOptions): z.ZodErrorMap => {
  return (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.custom) {
      switch (issue.path[issue.path.length - 1]) {
        case 'headers':
          if (options.strict && options.strictRules?.requireRateLimitHeaders) {
            return { message: issue.message ?? ctx.defaultError };
          }
          return { message: ctx.defaultError };
        default:
          return { message: ctx.defaultError };
      }
    }
    return { message: ctx.defaultError };
  };
};

/**
 * Validates API patterns like bulk operations and pagination
 * 
 * @param doc - The OpenAPI document to validate
 * @returns ZodError if validation fails, otherwise undefined
 */
function validateAPIPatterns(doc: OpenAPISpec): z.ZodError | undefined {
  const issues: z.ZodIssue[] = [];
  
  const paths = doc.paths || {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    // Validate bulk operations pattern
    if (pathKey.endsWith('/bulk') && 'post' in pathItem) {
      const operation = (pathItem as PathItem).post as Operation;
      if (!operation?.requestBody?.content?.['application/json']?.schema) continue;
      
      try {
        BulkRequestSchema.parse(operation.requestBody.content['application/json'].schema);
        if (operation.responses?.['200']?.content?.['application/json']?.schema) {
          BulkResponseSchema.parse(operation.responses['200'].content['application/json'].schema);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          issues.push(...error.issues);
        }
      }
    }

    // Validate pagination pattern
    if ('get' in pathItem) {
      const operation = (pathItem as PathItem).get as Operation;
      if (!operation?.parameters) continue;

      try {
        const paginationParams = operation.parameters.filter(p => 
          ['page', 'per_page', 'sort'].includes(p.name));
        
        if (paginationParams.length > 0) {
          PaginationParamsSchema.parse(Object.fromEntries(
            paginationParams.map(p => [p.name, p.schema])
          ));

          if (operation.responses?.['200']?.headers) {
            PaginationHeadersSchema.parse(operation.responses['200'].headers);
          }
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          issues.push(...error.issues);
        }
      }
    }
  }

  return issues.length ? new z.ZodError(issues) : undefined;
}

/**
 * Validates an OpenAPI specification document
 * 
 * @param document - The OpenAPI document to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateOpenAPI(
  document: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  // Disable caching if we're in test environment
  const testMode = process.env.NODE_ENV === 'test';
  const cacheOptions = testMode 
    ? { ...options.cache, enabled: false }
    : options.cache;
    
  const cache = getValidationCache(cacheOptions);
  const cacheKey = cache.generateDocumentKey(document, options);
  
  // Check if we have a cached result
  const cachedResult = cache.getValidationResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  const resolvedRefs: string[] = [];
  
  try {
    const docAsObject = document as Record<string, unknown>;
    let parsed: OpenAPISpec;

    const parseParams = {
      path: [],
      errorMap: createErrorMap(options),
      data: { 
        strict: options.strict,
        strictRules: options.strictRules 
      }
    };

    if (options.allowFutureOASVersions && typeof docAsObject.openapi === 'string' && docAsObject.openapi.startsWith('3.')) {
      parsed = OpenAPIObject31.parse(docAsObject, parseParams);
    } else {
      const version = detectOpenAPIVersion(docAsObject);
      if (version.startsWith('3.1')) {
        parsed = OpenAPIObject31.parse(docAsObject, parseParams);
      } else {
        parsed = OpenAPIObject.parse(docAsObject, parseParams);
      }
    }

    if (options.strict) {
      verifyRefTargets(parsed, resolvedRefs);
      
      const apiPatternsError = validateAPIPatterns(parsed);
      if (apiPatternsError) {
        throw new SchemaValidationError(
          'API pattern validation failed', 
          apiPatternsError,
          { context: { strict: true } }
        );
      }

      if (options.strictRules?.requireRateLimitHeaders) {
        const rateLimitError = validateRateLimitHeaders(parsed, options);
        if (rateLimitError) {
          throw new StrictValidationError(
            'Rate limiting headers are required in strict mode', 
            { 
              code: ErrorCode.RATE_LIMIT_REQUIRED,
              context: { strict: true }
            }
          );
        }
      }
    }

    const result = { valid: true, resolvedRefs };
    
    // Don't store in cache if in test mode to avoid test interference
    if (!testMode) {
      cache.setValidationResult(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    let result: ValidationResult;
    
    if (error instanceof z.ZodError) {
      result = { 
        valid: false, 
        errors: error, 
        resolvedRefs 
      };
    } else if (error instanceof SchemaValidationError) {
      result = { 
        valid: false, 
        errors: error.zodError, 
        resolvedRefs 
      };
    } else if (error instanceof StrictValidationError) {
      result = {
        valid: false,
        errors: new z.ZodError([{
          code: z.ZodIssueCode.custom,
          path: [],
          message: error.message
        }]),
        resolvedRefs
      };
    } else {
      result = { 
        valid: false, 
        errors: new z.ZodError([{ 
          code: z.ZodIssueCode.custom,
          path: [],
          message: error instanceof Error ? error.message : 'Unknown error'
        }]), 
        resolvedRefs 
      };
    }
    
    // Don't store in cache if in test mode to avoid test interference
    if (!testMode) {
      cache.setValidationResult(cacheKey, result);
    }
    
    return result;
  }
}