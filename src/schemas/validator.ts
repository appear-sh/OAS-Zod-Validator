import { OpenAPIObject } from './openapi';
import { z } from 'zod';

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs?: string[];
}

export function validateOpenAPI(document: unknown): ValidationResult {
  try {
    OpenAPIObject.parse(document);
    return { 
      valid: true,
      resolvedRefs: [] // We'll implement reference tracking later
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error,
      };
    }
    throw error;
  }
}