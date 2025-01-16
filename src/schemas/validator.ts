import { z } from 'zod';
import { OpenAPIObject } from './openapi';
import { OpenAPIObject31 } from './openapi31';
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

function detectOpenAPIVersion(doc: Record<string, unknown>): '3.0' | '3.1' {
  if (!doc || typeof doc.openapi !== 'string') {
    return '3.0'; // fallback or throw; your call
  }
  if (doc.openapi.startsWith('3.1.')) {
    return '3.1';
  }
  return '3.0';
}

export function validateOpenAPI(
  document: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const resolvedRefs: string[] = [];

  const trackRef = (obj: Record<string, unknown>): void => {
    if (obj && typeof obj === 'object') {
      if (obj.$ref && typeof obj.$ref === 'string') {
        resolvedRefs.push(obj.$ref);
      }
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          trackRef(value as Record<string, unknown>);
        }
      }
    }
  };

  try {
    let parsed: Record<string, unknown>;
    const docAsObject = document as Record<string, unknown>;

    if (options.allowFutureOASVersions) {
      // Use 3.1 schema for any future version
      parsed = OpenAPIObject31.parse(docAsObject);
    } else {
      const version = detectOpenAPIVersion(docAsObject);
      if (version === '3.1') {
        parsed = OpenAPIObject31.parse(docAsObject);
      } else {
        parsed = OpenAPIObject.parse(docAsObject);
      }
    }

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