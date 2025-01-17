import type { z } from 'zod';
import type { OpenAPIObject } from './openapi';
import type { OpenAPIObject31 } from './openapi31';

export type OpenAPISpec = z.infer<typeof OpenAPIObject | typeof OpenAPIObject31>;

export interface ValidationOptions {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs: string[];
}