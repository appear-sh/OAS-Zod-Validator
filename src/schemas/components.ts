import { z } from 'zod';
import { SchemaObject, SchemaObject31 } from './core.js';
import {
  ReferenceObject,
  SchemaReferenceObject,
  ResponseReferenceObject,
  ParameterReferenceObject,
  ExampleReferenceObject,
  RequestBodyReferenceObject,
  HeaderReferenceObject,
  // SecuritySchemeReferenceObject,
  LinkReferenceObject,
  CallbackReferenceObject,
} from './reference.js';
import { RequestBodyObject, ResponseObject } from './requestResponse.js';

// Parameter Object (reused from paths.ts to avoid circular dependency)
const ParameterObject = z.object({
  name: z.string(),
  in: z.enum(['query', 'header', 'path', 'cookie']),
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  schema: z.union([SchemaObject, ReferenceObject]),
});

// Header Object
export const HeaderObject = z.object({
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  schema: z.union([SchemaObject, ReferenceObject]),
});

// Example Object
const ExampleObject = z
  .object({
    summary: z.string().optional(),
    description: z.string().optional(),
    value: z.any().optional(),
    externalValue: z.string().url().optional(),
  })
  .refine((data) => !(data.value && data.externalValue), {
    message: "Example cannot have both 'value' and 'externalValue'",
  });

// Link Object
export const LinkObject = z
  .object({
    operationRef: z.string().optional(),
    operationId: z.string().optional(),
    parameters: z.record(z.string(), z.any()).optional(),
    requestBody: z.any().optional(),
    description: z.string().optional(),
    server: z.any().optional(),
  })
  .refine((data) => !(data.operationRef && data.operationId), {
    message: "Link cannot have both 'operationRef' and 'operationId'",
  });

// Callback Object
const CallbackObject = z.record(z.string(), z.record(z.string(), z.any()));

// Components Object
export const ComponentsObject = z
  .object({
    schemas: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/, {
          message:
            'Schema names must contain only alphanumeric characters, dots, underscores, and hyphens',
        }),
        z.union([SchemaObject, SchemaReferenceObject])
      )
      .optional(),

    responses: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([ResponseObject, ResponseReferenceObject])
      )
      .optional(),

    parameters: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([ParameterObject, ParameterReferenceObject])
      )
      .optional(),

    examples: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([ExampleObject, ExampleReferenceObject])
      )
      .optional(),

    requestBodies: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([RequestBodyObject, RequestBodyReferenceObject])
      )
      .optional(),

    headers: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([HeaderObject, HeaderReferenceObject])
      )
      .optional(),

    securitySchemes: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([ReferenceObject, z.any()]) // TODO: replace any with SecuritySchemeObject
      )
      .optional(),

    links: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([LinkObject, LinkReferenceObject])
      )
      .optional(),

    callbacks: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([CallbackObject, CallbackReferenceObject])
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Components object must have at least one property',
  });

export type Components = z.infer<typeof ComponentsObject>;

// 3.1 variant using SchemaObject31 for component schemas
export const ComponentsObject31 = ComponentsObject.safeExtend({
  schemas: z
    .record(
      z.string().regex(/^[a-zA-Z0-9._-]+$/, {
        message:
          'Schema names must contain only alphanumeric characters, dots, underscores, and hyphens',
      }),
      z.union([SchemaObject31, SchemaReferenceObject])
    )
    .optional(),
});

export type Components31 = z.infer<typeof ComponentsObject31>;
