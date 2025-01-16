import { z } from 'zod';
import { SchemaObject, ReferenceObject } from './core';

// Media Type Object
export const MediaTypeObject = z.object({
  schema: z.union([SchemaObject, ReferenceObject]).optional(),
  example: z.any().optional(),
  examples: z.record(z.string(), z.union([ReferenceObject, z.object({
    summary: z.string().optional(),
    description: z.string().optional(),
    value: z.any().optional(),
    externalValue: z.string().url().optional()
  }).refine(obj => !(obj.value && obj.externalValue), {
    message: 'Cannot have both \'value\' and \'externalValue\''
  })])).optional(),
  encoding: z.record(z.string(), z.any()).optional(),
}).passthrough();

// Request Body Object
export const RequestBodyObject = z.object({
  description: z.string().optional(),
  content: z.record(z.string(), MediaTypeObject),
  required: z.boolean().optional()
}).passthrough();

// Response Object
export const ResponseObject = z.object({
  description: z.string(),
  headers: z.record(z.string(), z.union([ReferenceObject, z.object({
    description: z.string().optional(),
    required: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    schema: z.union([SchemaObject, ReferenceObject]).optional()
  })])).optional(),
  content: z.record(z.string(), MediaTypeObject).optional(),
  links: z.record(z.string(), z.union([ReferenceObject, z.object({
    operationRef: z.string().optional(),
    operationId: z.string().optional(),
    parameters: z.record(z.string(), z.any()).optional(),
    requestBody: z.any().optional(),
    description: z.string().optional(),
    server: z.any().optional()
  }).refine(obj => !(obj.operationRef && obj.operationId), {
    message: 'Cannot have both \'operationRef\' and \'operationId\''
  })])).optional()
}).passthrough();

export const ResponsesObject = z.record(
  z.string(),
  z.union([ResponseObject, ReferenceObject])
);

export type RequestBody = z.infer<typeof RequestBodyObject>;
export type Response = z.infer<typeof ResponseObject>;