import { z } from 'zod';
import { SchemaObject, ReferenceObject } from './core';

// Media Type Object
export const MediaTypeObject = z.object({
  schema: z.union([SchemaObject, ReferenceObject]).optional(),
  example: z.any().optional(),
  examples: z.record(z.string(), z.union([ReferenceObject, z.any()])).optional(),
  encoding: z.record(z.string(), z.any()).optional(),
});

// Request Body Object
export const RequestBodyObject = z.object({
  description: z.string().optional(),
  content: z.record(z.string(), MediaTypeObject),
  required: z.boolean().optional(),
});

// Response Object
export const ResponseObject = z.object({
  description: z.string(),
  headers: z.record(z.string(), z.union([ReferenceObject, z.any()])).optional(),
  content: z.record(z.string(), MediaTypeObject).optional(),
  links: z.record(z.string(), z.union([ReferenceObject, z.any()])).optional(),
});