import { OpenAPIObject } from './openapi';
import { z } from 'zod';
import { verifyRefTargets } from '../utils/verifyRefTargets';

export interface ValidationOptions {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs: string[];
}

export function validateOpenAPI(
  document: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const resolvedRefs: string[] = [];

  const trackRef = (obj: any) => {
    if (obj && typeof obj === 'object') {
      if (obj.$ref && typeof obj.$ref === 'string') {
        resolvedRefs.push(obj.$ref);
      }
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          trackRef(value);
        }
      }
    }
  };

  try {
    if (options.allowFutureOASVersions) {
      // In a real implementation, you might override the OpenAPIObject schema's 'openapi' regex
    }

    const parsed = OpenAPIObject.parse(document);
    trackRef(parsed);

    if (options.strict) {
      verifyRefTargets(parsed, resolvedRefs);
    }

    return { valid: true, resolvedRefs };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error, resolvedRefs };
    }
    throw error;
  }
}