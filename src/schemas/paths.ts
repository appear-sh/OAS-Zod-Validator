import { z } from 'zod';
import { SchemaObject, ReferenceObject, ExtensibleObject } from './core';
import { RequestBodyObject, ResponseObject } from './requestResponse';

// Enhanced Parameter Location Object
const parameterBaseFields = {
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  allowEmptyValue: z.boolean().optional(),
  style: z.string().optional(),
  explode: z.boolean().optional(),
  example: z.any().optional(),
} as const;

const ParameterBase = z.object(parameterBaseFields).and(ExtensibleObject);

// Specific parameter types with location-specific validation
export const ParameterObject = z.discriminatedUnion('in', [
  // Path parameters are always required
  z.object({
    ...parameterBaseFields,
    name: z.string(),
    in: z.literal('path'),
    required: z.literal(true),
    schema: z.union([SchemaObject, ReferenceObject]),
  }),
  // Query parameters
  z.object({
    ...parameterBaseFields,
    name: z.string(),
    in: z.literal('query'),
    schema: z.union([SchemaObject, ReferenceObject]),
    allowReserved: z.boolean().optional(),
  }),
  // Header parameters
  z.object({
    ...parameterBaseFields,
    name: z.string().regex(/^[^A-Za-z0-9-]+$/, {
      message: 'Header parameter names should contain only ASCII characters',
    }),
    in: z.literal('header'),
    schema: z.union([SchemaObject, ReferenceObject]),
  }),
  // Cookie parameters
  z.object({
    ...parameterBaseFields,
    name: z.string(),
    in: z.literal('cookie'),
    schema: z.union([SchemaObject, ReferenceObject]),
  }),
]);

// Enhanced Operation Object with better validation
export const OperationObject = z.object({
  tags: z.array(z.string()).optional(),
  summary: z.string().max(120, { 
    message: 'Summary should be concise (max 120 characters)' 
  }).optional(),
  description: z.string().optional(),
  operationId: z.string()
    .regex(/^[a-zA-Z0-9]+$/, {
      message: 'operationId must contain only alphanumeric characters'
    })
    .optional(),
  parameters: z.array(z.union([ParameterObject, ReferenceObject]))
    .max(50, {
      message: 'Too many parameters. Consider restructuring the API.'
    })
    .optional(),
  requestBody: z.union([RequestBodyObject, ReferenceObject]).optional(),
  responses: z.record(
    z.string().regex(/^[1-5][0-9][0-9]$|^default$/, {
      message: 'Response status code must be a valid HTTP status code or "default"'
    }),
    z.union([ResponseObject, ReferenceObject])
  ).refine((responses) => {
    // Ensure there's at least one response defined
    return Object.keys(responses).length > 0;
  }, {
    message: 'At least one response must be defined'
  }),
  deprecated: z.boolean().optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
}).and(ExtensibleObject);

// Enhanced Path Item Object
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
    url: z.string().url({
      message: 'Server URL must be a valid URL'
    }),
    description: z.string().optional(),
  })).optional(),
  parameters: z.array(z.union([ParameterObject, ReferenceObject])).optional(),
}).and(ExtensibleObject)
.refine((pathItem) => {
  // Ensure at least one operation is defined
  const operations = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
  return operations.some(op => op in pathItem);
}, {
  message: 'Path item must define at least one operation'
});

// Enhanced Paths Object with path validation
export const PathsObject = z.record(
  z.string()
    .regex(/^\//, { message: 'Path must start with forward slash' })
    .regex(/^\/[^?#]*$/, { 
      message: 'Path must not include query parameters or fragments' 
    }),
  PathItemObject
).refine((paths) => {
  // Check for path parameter consistency
  const pathParams = new Set();
  for (const path of Object.keys(paths)) {
    const matches = path.match(/\{([^}]+)\}/g);
    if (matches) {
      for (const match of matches) {
        if (pathParams.has(match)) {
          return false;
        }
        pathParams.add(match);
      }
    }
  }
  return true;
}, {
  message: 'Path parameters must be unique across all paths'
}); 