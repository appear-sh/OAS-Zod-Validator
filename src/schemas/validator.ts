import { OpenAPIObject } from './openapi';
import { z } from 'zod';

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs: string[];
}

export function validateOpenAPI(document: unknown): ValidationResult {
  const resolvedRefs: string[] = [];

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