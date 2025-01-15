import { z } from 'zod';
import { SchemaObject, ReferenceObject } from './core';
import { SecuritySchemeObject } from './security';
import { RequestBodyObject, ResponseObject } from './requestResponse';

export const ComponentsObject = z.object({
  schemas: z.record(z.string(), z.union([SchemaObject, ReferenceObject])).optional(),
  responses: z.record(z.string(), z.union([ResponseObject, ReferenceObject])).optional(),
  parameters: z.record(z.string(), z.any()).optional(),
  examples: z.record(z.string(), z.any()).optional(),
  requestBodies: z.record(z.string(), z.union([RequestBodyObject, ReferenceObject])).optional(),
  headers: z.record(z.string(), z.any()).optional(),
  securitySchemes: z.record(z.string(), SecuritySchemeObject).optional(),
  links: z.record(z.string(), z.any()).optional(),
  callbacks: z.record(z.string(), z.any()).optional(),
});