import { z } from 'zod';

export interface ReferenceResolver {
  resolve: (ref: string) => unknown;
}

export class OpenAPIReferenceResolver implements ReferenceResolver {
  private document: any;
  private cache: Map<string, unknown>;

  constructor(document: any) {
    this.document = document;
    this.cache = new Map();
  }

  resolve(ref: string): unknown {
    if (this.cache.has(ref)) {
      return this.cache.get(ref);
    }

    const parts = ref.split('/');
    if (parts[0] !== '#') {
      throw new Error('Only local references are supported');
    }

    let current = this.document;
    for (let i = 1; i < parts.length; i++) {
      current = current[parts[i]];
      if (current === undefined) {
        throw new Error(`Invalid reference: ${ref}`);
      }
    }

    this.cache.set(ref, current);
    return current;
  }
}

export const withRefResolver = (schema: z.ZodType, resolver: ReferenceResolver) => {
  return schema.superRefine((data, ctx) => {
    if (data && typeof data === 'object' && '$ref' in data) {
      try {
        const resolved = resolver.resolve(data.$ref);
        // Validate resolved reference against the same schema
        const result = schema.safeParse(resolved);
        if (!result.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid reference: ${data.$ref}`,
            path: ['$ref'],
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : 'Invalid reference',
          path: ['$ref'],
        });
      }
    }
  });
};
