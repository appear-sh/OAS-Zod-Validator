import type { z } from 'zod';
import type { OpenAPIObject } from './openapi.js';
import type { OpenAPIObject31 } from './openapi31.js';

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

export interface Operation {
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: Record<string, unknown>;
      };
    };
    required?: boolean;
  };
  responses?: {
    [statusCode: string]: {
      content?: {
        'application/json'?: {
          schema?: Record<string, unknown>;
        };
      };
      headers?: Record<string, unknown>;
      description?: string;
    };
  };
  parameters?: Array<{
    name: string;
    in?: string;
    schema?: Record<string, unknown>;
  }>;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  options?: Operation;
  head?: Operation;
  trace?: Operation;
  $ref?: string;
}