import { z } from 'zod';
import { OpenAPIObject } from './openapi';
import { OpenAPIObject31 } from './openapi31';
import { verifyRefTargets } from '../utils/verifyRefTargets';
import { OpenAPISpec } from './types';

export interface ValidationOptions {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
  strictRules?: {
    requireRateLimitHeaders?: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs: string[];
}

function detectOpenAPIVersion(doc: Record<string, unknown>): '3.0' | '3.1' {
  if (!doc || typeof doc.openapi !== 'string') {
    throw new Error('Invalid OpenAPI document: missing or invalid openapi version');
  }
  
  if (doc.openapi.startsWith('3.1.')) {
    return '3.1';
  }
  if (doc.openapi.startsWith('3.0.')) {
    return '3.0';
  }
  throw new Error(`Unsupported OpenAPI version: ${doc.openapi}`);
}

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

export function validateOpenAPI(
  document: unknown,
  options: ValidationOptions = {}
): ValidationResult {
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
      if (version === '3.1') {
        parsed = OpenAPIObject31.parse(docAsObject, parseParams);
      } else {
        parsed = OpenAPIObject.parse(docAsObject, parseParams);
      }
    }

    if (options.strict) {
      verifyRefTargets(parsed, resolvedRefs);
      
      if (options.strictRules?.requireRateLimitHeaders) {
        const rateLimitError = validateRateLimitHeaders(parsed, options);
        if (rateLimitError) {
          return { valid: false, errors: rateLimitError, resolvedRefs };
        }
      }
    }

    return { valid: true, resolvedRefs };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error, resolvedRefs };
    }
    return { valid: false, errors: new z.ZodError([{ 
      code: z.ZodIssueCode.custom,
      path: [],
      message: error instanceof Error ? error.message : 'Unknown error'
    }]), resolvedRefs };
  }
}