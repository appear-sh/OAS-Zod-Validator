import { z } from 'zod';

// Basic type definitions that are used throughout OpenAPI
export const ReferenceObject = z.object({
  $ref: z.string(),
});

// Extensible object for additional properties
export const ExtensibleObject = z.object({}).catchall(z.any());

// Schema Object (fixed version)
export const SchemaObject: z.ZodType = z.lazy(() => 
  z.object({
    type: z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object']).optional(),
    format: z.string().optional(),
    description: z.string().optional(),
    required: z.array(z.string()).optional(),
    properties: z.record(z.string(), z.union([z.lazy(() => SchemaObject), ReferenceObject])).optional(),
    items: z.union([z.lazy(() => SchemaObject), ReferenceObject]).optional(),
  }).and(ExtensibleObject)
);
