import { z } from 'zod';
import { SchemaObject, SchemaObject31, ExtensibleObject } from './core.js';
import { ReferenceObject, ParameterReferenceObject } from './reference.js';
import {
  RequestBodyObject,
  RequestBodyObject31,
  ResponseObject,
  ResponseObject31,
} from './requestResponse.js';

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

// Specific parameter types with location-specific validation
export const ParameterObject = z.discriminatedUnion('in', [
  // Path parameters are always required
  z.object({
    ...parameterBaseFields,
    name: z.string().min(1, { message: 'Parameter name cannot be empty' }),
    in: z.literal('path'),
    required: z.literal(true),
    schema: z.union([SchemaObject, ReferenceObject]),
  }),
  // Query parameters
  z.object({
    ...parameterBaseFields,
    name: z.string().min(1, { message: 'Parameter name cannot be empty' }),
    in: z.literal('query'),
    schema: z.union([SchemaObject, ReferenceObject]),
    allowReserved: z.boolean().optional(),
  }),
  // Header parameters
  // Header parameters - RFC 7230 allows token chars including underscore
  z.object({
    ...parameterBaseFields,
    name: z.string().regex(/^[A-Za-z0-9_-]+$/, {
      message:
        'Header parameter names should contain only alphanumeric characters, hyphens, and underscores',
    }),
    in: z.literal('header'),
    schema: z.union([SchemaObject, ReferenceObject]),
  }),
  // Cookie parameters
  z.object({
    ...parameterBaseFields,
    name: z.string().min(1, { message: 'Parameter name cannot be empty' }),
    in: z.literal('cookie'),
    schema: z.union([SchemaObject, ReferenceObject]),
  }),
]);

// Base OperationObject structure before refinement
const BaseOperationObject = z
  .object({
    tags: z.array(z.string()).optional(),
    summary: z
      .string()
      .max(120, {
        message: 'Summary should be concise (max 120 characters)',
      })
      .optional(),
    description: z.string().optional(),
    operationId: z
      .string()
      .min(1, { message: 'operationId, if present, must not be empty' })
      .optional(),
    parameters: z
      .array(z.union([ParameterObject, ParameterReferenceObject]))
      .max(50, {
        message: 'Too many parameters. Consider restructuring the API.',
      })
      .optional()
      .refine(
        (params) => {
          if (!params) return true;

          // Check for duplicate parameter names+locations
          const seen = new Set();
          for (const param of params) {
            if ('$ref' in param) continue; // Skip reference objects

            const key = `${param.in}:${param.name}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }

          return true;
        },
        {
          message:
            'Duplicate parameters with same name and location are not allowed',
        }
      ),
    requestBody: z.union([RequestBodyObject, ReferenceObject]).optional(),
    responses: z
      .record(
        z.string().regex(/^[1-5][0-9][0-9]$|^default$/, {
          message:
            'Response status code must be a valid HTTP status code or "default"',
        }),
        z.union([ResponseObject, ReferenceObject])
      )
      .refine(
        (responses) => {
          // Ensure there's at least one response defined
          return Object.keys(responses).length > 0;
        },
        {
          message: 'At least one response must be defined',
        }
      )
      .optional(),
    deprecated: z.boolean().optional(),
    security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  })
  .and(ExtensibleObject);

// Define the final type after refinement
type Operation = z.infer<typeof BaseOperationObject>;

// Apply the refinement with explicit typing
export const OperationObject: z.ZodType<Operation> = BaseOperationObject.refine(
  (op) => op.responses !== undefined,
  {
    message:
      "Operation must include a 'responses' object defining potential responses",
    path: ['responses'], // Specify the path relative to the OperationObject
  }
);

// Enhanced Path Item Object
export const PathItemObject = z
  .object({
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
    servers: z
      .array(
        z.object({
          url: z.string().url({
            message: 'Server URL must be a valid URL',
          }),
          description: z.string().optional(),
          variables: z
            .record(
              z.string(),
              z.object({
                default: z.string(),
                description: z.string().optional(),
                enum: z.array(z.string()).optional(),
              })
            )
            .optional(),
        })
      )
      .optional(),
    parameters: z
      .array(z.union([ParameterObject, ParameterReferenceObject]))
      .optional()
      .refine(
        (params) => {
          if (!params) return true;
          // Check for duplicate parameter names+locations
          const seen = new Set();
          for (const param of params) {
            // Skip reference objects as their content is validated elsewhere,
            // and we are concerned with duplicates in *this* specific list.
            if ('$ref' in param) continue;

            const key = `${param.in}:${param.name}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        {
          message:
            'Duplicate parameters with same name and location are not allowed at the Path Item level',
        }
      ),
  })
  .and(ExtensibleObject)
  .refine(
    (pathItem) => {
      // Ensure at least one operation is defined
      const operations = [
        'get',
        'put',
        'post',
        'delete',
        'options',
        'head',
        'patch',
        'trace',
      ];
      const hasStd = operations.some((op) => op in pathItem);
      return hasStd;
    },
    {
      message: 'Path item must define at least one operation',
    }
  );

// Enhanced Paths Object with path validation
export const PathsObject: z.ZodType<
  Record<string, z.infer<typeof PathItemObject>>
> = z
  .record(
    z
      .string()
      .regex(/^\//, { message: 'Path must start with forward slash' })
      .regex(/^\/[^?#]*$/, {
        message: 'Path must not include query parameters or fragments',
      })
      .regex(/^(?:\/[^/{}]+|\/\{[^/{}]+\})*\/?$/, {
        message:
          'Path must follow pattern of /segment or /{param} with no empty segments',
      }),
    PathItemObject
  )
  .refine(
    (paths) => {
      // Check for path parameter definitions
      for (const [path, pathItem] of Object.entries(paths)) {
        const pathParamMatches = path.match(/\{([^}]+)\}/g) || [];
        if (pathParamMatches.length === 0) continue; // No path parameters to check

        // Collect all defined parameters from the path item
        const definedParams = new Set<string>();

        // Path-level parameters
        const pathParams = pathItem.parameters || [];
        for (const param of pathParams) {
          if ('$ref' in param) continue; // Skip reference objects
          if (param.in === 'path') {
            definedParams.add(`{${param.name}}`);
          }
        }

        // Check operation-level parameters
        const operations = [
          'get',
          'put',
          'post',
          'delete',
          'options',
          'head',
          'patch',
          'trace',
        ] as const;
        for (const op of operations) {
          const operation = pathItem[op];
          if (!operation) continue;

          const operationParams = operation.parameters || [];
          for (const param of operationParams) {
            if ('$ref' in param) continue; // Skip reference objects
            if (param.in === 'path') {
              definedParams.add(`{${param.name}}`);
            }
          }
        }

        // Ensure all path parameters in the URL are defined in parameters
        for (const pathParam of pathParamMatches) {
          if (!definedParams.has(pathParam)) {
            return false;
          }
        }
      }

      return true;
    },
    {
      message:
        'All path parameters in the URL must be defined in the parameters section',
    }
  );

// ============================================================================
// OpenAPI 3.1 Paths (uses SchemaObject31 which allows type to be omitted)
// ============================================================================

// Parameter types for OAS 3.1 - uses SchemaObject31
export const ParameterObject31 = z.discriminatedUnion('in', [
  // Path parameters are always required
  z.object({
    ...parameterBaseFields,
    name: z.string().min(1, { message: 'Parameter name cannot be empty' }),
    in: z.literal('path'),
    required: z.literal(true),
    schema: z.union([SchemaObject31, ReferenceObject]),
  }),
  // Query parameters
  z.object({
    ...parameterBaseFields,
    name: z.string().min(1, { message: 'Parameter name cannot be empty' }),
    in: z.literal('query'),
    schema: z.union([SchemaObject31, ReferenceObject]),
    allowReserved: z.boolean().optional(),
  }),
  // Header parameters - RFC 7230 allows token chars including underscore
  z.object({
    ...parameterBaseFields,
    name: z.string().regex(/^[A-Za-z0-9_-]+$/, {
      message:
        'Header parameter names should contain only alphanumeric characters, hyphens, and underscores',
    }),
    in: z.literal('header'),
    schema: z.union([SchemaObject31, ReferenceObject]),
  }),
  // Cookie parameters
  z.object({
    ...parameterBaseFields,
    name: z.string().min(1, { message: 'Parameter name cannot be empty' }),
    in: z.literal('cookie'),
    schema: z.union([SchemaObject31, ReferenceObject]),
  }),
]);

// Base OperationObject for OAS 3.1
const BaseOperationObject31 = z
  .object({
    tags: z.array(z.string()).optional(),
    summary: z
      .string()
      .max(120, {
        message: 'Summary should be concise (max 120 characters)',
      })
      .optional(),
    description: z.string().optional(),
    operationId: z
      .string()
      .min(1, { message: 'operationId, if present, must not be empty' })
      .optional(),
    parameters: z
      .array(z.union([ParameterObject31, ParameterReferenceObject]))
      .max(50, {
        message: 'Too many parameters. Consider restructuring the API.',
      })
      .optional()
      .refine(
        (params) => {
          if (!params) return true;
          const seen = new Set();
          for (const param of params) {
            if ('$ref' in param) continue;
            const key = `${param.in}:${param.name}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        {
          message:
            'Duplicate parameters with same name and location are not allowed',
        }
      ),
    requestBody: z.union([RequestBodyObject31, ReferenceObject]).optional(),
    responses: z
      .record(
        z.string().regex(/^[1-5][0-9][0-9]$|^default$/, {
          message:
            'Response status code must be a valid HTTP status code or "default"',
        }),
        z.union([ResponseObject31, ReferenceObject])
      )
      .refine(
        (responses) => Object.keys(responses).length > 0,
        { message: 'At least one response must be defined' }
      )
      .optional(),
    deprecated: z.boolean().optional(),
    security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  })
  .and(ExtensibleObject);

type Operation31 = z.infer<typeof BaseOperationObject31>;
export const OperationObject31: z.ZodType<Operation31> =
  BaseOperationObject31.refine((op) => op.responses !== undefined, {
    message:
      "Operation must include a 'responses' object defining potential responses",
    path: ['responses'],
  });

// PathItem for OAS 3.1
export const PathItemObject31 = z
  .object({
    $ref: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    get: OperationObject31.optional(),
    put: OperationObject31.optional(),
    post: OperationObject31.optional(),
    delete: OperationObject31.optional(),
    options: OperationObject31.optional(),
    head: OperationObject31.optional(),
    patch: OperationObject31.optional(),
    trace: OperationObject31.optional(),
    servers: z.array(z.any()).optional(),
    parameters: z
      .array(z.union([ParameterObject31, ParameterReferenceObject]))
      .optional()
      .refine(
        (params) => {
          if (!params) return true;
          const seen = new Set();
          for (const param of params) {
            if ('$ref' in param) continue;
            const key = `${param.in}:${param.name}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        {
          message:
            'Duplicate parameters with same name and location are not allowed at the Path Item level',
        }
      ),
  })
  .and(ExtensibleObject)
  .refine(
    (pathItem) => {
      const operations = [
        'get',
        'put',
        'post',
        'delete',
        'options',
        'head',
        'patch',
        'trace',
      ];
      return operations.some((op) => op in pathItem);
    },
    { message: 'Path item must define at least one operation' }
  );

// Paths Object for OAS 3.1
export const PathsObject31: z.ZodType<
  Record<string, z.infer<typeof PathItemObject31>>
> = z
  .record(
    z
      .string()
      .regex(/^\//, { message: 'Path must start with forward slash' })
      .regex(/^\/[^?#]*$/, {
        message: 'Path must not include query parameters or fragments',
      })
      .regex(/^(?:\/[^/{}]+|\/\{[^/{}]+\})*\/?$/, {
        message:
          'Path must follow pattern of /segment or /{param} with no empty segments',
      }),
    PathItemObject31
  )
  .refine(
    (paths) => {
      // Validate that all path parameters in the URL are defined
      for (const [pathKey, pathItem] of Object.entries(paths)) {
        const pathParamMatches = pathKey.match(/\{[^}]+\}/g) || [];
        if (pathParamMatches.length === 0) continue;

        const definedParams = new Set<string>();
        const pathParams = pathItem.parameters || [];
        for (const param of pathParams) {
          if ('$ref' in param) continue;
          if (param.in === 'path') {
            definedParams.add(`{${param.name}}`);
          }
        }

        const operations = [
          'get',
          'put',
          'post',
          'delete',
          'options',
          'head',
          'patch',
          'trace',
        ] as const;
        for (const op of operations) {
          const operation = pathItem[op];
          if (!operation) continue;
          const operationParams = operation.parameters || [];
          for (const param of operationParams) {
            if ('$ref' in param) continue;
            if (param.in === 'path') {
              definedParams.add(`{${param.name}}`);
            }
          }
        }

        for (const pathParam of pathParamMatches) {
          if (!definedParams.has(pathParam)) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        'All path parameters in the URL must be defined in the parameters section',
    }
  );
