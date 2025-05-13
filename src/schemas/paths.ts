import { z } from 'zod';
import { SchemaObject, ReferenceObject, ExtensibleObject } from './core.js';
import { RequestBodyObject, ResponseObject } from './requestResponse.js';

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
  z.object({
    ...parameterBaseFields,
    name: z.string().regex(/^[A-Za-z0-9-]+$/, {
      message:
        'Header parameter names should contain only alphanumeric characters and hyphens',
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
      .array(z.union([ParameterObject, ReferenceObject]))
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
    parameters: z.array(z.union([ParameterObject, ReferenceObject])).optional(),
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
      return operations.some((op) => op in pathItem);
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
      // Check for path parameter consistency and uniqueness
      const pathParams = new Map();

      for (const path of Object.keys(paths)) {
        const matches = path.match(/\{([^}]+)\}/g);
        if (matches) {
          for (const match of matches) {
            // Check if this parameter name has been seen before
            if (pathParams.has(match)) {
              // If seen in a different path, it's a duplicate across paths
              if (pathParams.get(match) !== path) {
                return false;
              }
            } else {
              pathParams.set(match, path);
            }
          }
        }
      }

      return true;
    },
    {
      message: 'Path parameters must be unique across all paths',
    }
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
