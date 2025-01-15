import { OpenAPIObject } from './openapi';
import { z } from 'zod';
import { OpenAPIReferenceResolver, withRefResolver } from './reference';

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs?: string[];
}

export function validateOpenAPI(document: unknown): ValidationResult {
  try {
    const resolver = new OpenAPIReferenceResolver(document);
    const schemaWithRefs = withRefResolver(OpenAPIObject, resolver);
    
    schemaWithRefs.parse(document);
    return {
      valid: true,
      resolvedRefs: Array.from(resolver['cache'].keys()),
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