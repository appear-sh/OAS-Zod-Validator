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
      Object.values(obj).forEach(value => trackRef(value));
    }
  };

  try {
    OpenAPIObject.parse(document);
    // Track all refs after successful validation
    trackRef(document);
    
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