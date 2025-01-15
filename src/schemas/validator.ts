import { OpenAPIObject } from './openapi';
import { z } from 'zod';

export interface ValidationOptions {
  strict?: boolean; // If false, skip or relax certain checks
  allowFutureOASVersions?: boolean; // Example toggle for broader version acceptance
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

  // Optionally skip certain validations for strictly matching references, etc.
  if (!options.strict) {
    // For demonstration: you might allow references that don't start with "#/"
    // or skip some path uniqueness checks here.
    // E.g., you could remove or patch the refine() calls that enforce uniqueness.
  }

  // Helper function to track refs
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
    // If allowFutureOASVersions is set, you might skip the version check above
    // or dynamically adjust the regex. For example:
    if (options.allowFutureOASVersions) {
      // In a real implementation, you might clone or modify the OpenAPIObject schema
      // to accept other major/minor versions. For brevity, we skip that here.
    }

    const parsed = OpenAPIObject.parse(document);
    trackRef(parsed);

    return {
      valid: true,
      resolvedRefs
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error,
        resolvedRefs
      };
    }
    throw error;
  }
}