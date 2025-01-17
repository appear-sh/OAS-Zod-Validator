import { z } from 'zod';
import { OpenAPIObject } from './openapi';
import { OpenAPIObject31 } from './openapi31';
import { verifyRefTargets } from '../utils/verifyRefTargets';

export interface StrictValidationRules {
  requireRateLimitHeaders?: boolean;
  requirePagination?: boolean;
  // Other rules can be added here
}

export interface ValidationOptions {
  strict?: boolean;
  strictRules?: StrictValidationRules;
  allowFutureOASVersions?: boolean;
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

export function validateOpenAPI(
  document: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const resolvedRefs: string[] = [];
  
  try {
    const docAsObject = document as Record<string, unknown>;
    let parsed: z.infer<typeof OpenAPIObject | typeof OpenAPIObject31>;

    const parseParams = {
      path: [],
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