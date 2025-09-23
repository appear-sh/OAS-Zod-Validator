import { z } from 'zod';
import { ExtensibleObject } from './core.js';
import { ReferenceObject, ParameterReferenceObject } from './reference.js';
import { ParameterObject } from './paths.js';
import {
  RequestBodyObject32,
  ResponseObject32,
} from './requestResponse.js';

// OperationObject for OAS 3.2 using 3.2 request/response shapes
const BaseOperationObject32 = z
  .object({
    tags: z.array(z.string()).optional(),
    summary: z
      .string()
      .max(120, { message: 'Summary should be concise (max 120 characters)' })
      .optional(),
    description: z.string().optional(),
    operationId: z.string().min(1).optional(),
    parameters: z
      .array(z.union([ParameterObject, ParameterReferenceObject]))
      .max(50, { message: 'Too many parameters. Consider restructuring the API.' })
      .optional()
      .refine((params) => {
        if (!params) return true;
        const seen = new Set<string>();
        for (const param of params) {
          if ('$ref' in param) continue;
          const key = `${(param as any).in}:${(param as any).name}`;
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      }, {
        message: 'Duplicate parameters with same name and location are not allowed',
      }),
    requestBody: z.union([RequestBodyObject32, ReferenceObject]).optional(),
    responses: z
      .record(
        z.string().regex(/^[1-5][0-9][0-9]$|^default$/),
        z.union([ResponseObject32, ReferenceObject])
      )
      .refine((responses) => Object.keys(responses).length > 0, {
        message: 'At least one response must be defined',
      })
      .optional(),
    deprecated: z.boolean().optional(),
    security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  })
  .and(ExtensibleObject);

type Operation32 = z.infer<typeof BaseOperationObject32>;
export const OperationObject32: z.ZodType<Operation32> = BaseOperationObject32.refine(
  (op) => op.responses !== undefined,
  { message: "Operation must include a 'responses' object defining potential responses", path: ['responses'] }
);

// PathItem for OAS 3.2
export const PathItemObject32 = z
  .object({
    summary: z.string().optional(),
    description: z.string().optional(),
    get: OperationObject32.optional(),
    put: OperationObject32.optional(),
    post: OperationObject32.optional(),
    delete: OperationObject32.optional(),
    options: OperationObject32.optional(),
    head: OperationObject32.optional(),
    patch: OperationObject32.optional(),
    trace: OperationObject32.optional(),
    query: OperationObject32.optional(),
    additionalOperations: z.record(z.string(), OperationObject32).optional(),
    servers: z
      .array(
        z.object({
          url: z.string().url(),
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
      .refine((params) => {
        if (!params) return true;
        const seen = new Set<string>();
        for (const param of params) {
          if ('$ref' in param) continue;
          const key = `${(param as any).in}:${(param as any).name}`;
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      }, {
        message:
          'Duplicate parameters with same name and location are not allowed at the Path Item level',
      }),
  })
  .and(ExtensibleObject)
  .refine((pathItem) => {
    const operations = ['get','put','post','delete','options','head','patch','trace','query'];
    const hasStd = operations.some((op) => op in (pathItem as any));
    const hasAdditional = typeof (pathItem as any).additionalOperations === 'object' &&
      Object.keys((pathItem as any).additionalOperations || {}).length > 0;
    return hasStd || hasAdditional;
  }, { message: 'Path item must define at least one operation' });

export const PathsObject32: z.ZodType<Record<string, z.infer<typeof PathItemObject32>>> = z
  .record(
    z
      .string()
      .regex(/^\//, { message: 'Path must start with forward slash' })
      .regex(/^\/[^?#]*$/, { message: 'Path must not include query parameters or fragments' })
      .regex(/^(?:\/[^/{}]+|\/\{[^/{}]+\})*\/?$/, {
        message: 'Path must follow pattern of /segment or /{param} with no empty segments',
      }),
    PathItemObject32
  );

export type Paths32 = z.infer<typeof PathsObject32>;


