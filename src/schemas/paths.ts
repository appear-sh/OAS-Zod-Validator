import { z } from 'zod';
import { SchemaObject, ReferenceObject } from './core';
import { RequestBodyObject, ResponseObject } from './requestResponse';

// Parameter Object
export const ParameterObject = z.object({
  name: z.string(),
  in: z.enum(['query', 'header', 'path', 'cookie']),
  description: z.string().optional(),
  required: z.boolean().default(false),
  deprecated: z.boolean().optional(),
  allowEmptyValue: z.boolean().optional(),
  schema: z.union([SchemaObject, ReferenceObject]),
});

// Operation Object
export const OperationObject = z.object({
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  operationId: z.string().optional(),
  parameters: z.array(z.union([ParameterObject, ReferenceObject])).optional(),
  requestBody: z.union([RequestBodyObject, ReferenceObject]).optional(),
  responses: z.record(z.string(), z.union([ResponseObject, ReferenceObject])),
  deprecated: z.boolean().optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
});

// Path Item Object
export const PathItemObject = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  get: OperationObject.optional(),
  put: OperationObject.optional(),
  post: OperationObject.optional(),
  delete: OperationObject.optional(),
  options: OperationObject.optional(),
  head: OperationObject.optional(),
  patch: OperationObject.optional(),
  trace: OperationObject.optional(),
  servers: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
  parameters: z.array(z.union([ParameterObject, ReferenceObject])).optional(),
});

// Paths Object
export const PathsObject = z.record(z.string(), PathItemObject); 