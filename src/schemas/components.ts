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
import {
  RequestBodyObject,
  ResponseObject,
  RequestBodyObject32,
  ResponseObject32,
} from './requestResponse.js';

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
  })
  .strict();

// Example Object (OAS 3.2)
const ExampleObject32 = z
  .object({
    summary: z.string().optional(),
    description: z.string().optional(),
    value: z.any().optional(),
    dataValue: z.any().optional(),
    serializedValue: z.any().optional(),
    externalValue: z.string().url().optional(),
  })
  .refine((data) => !(data.value && data.externalValue), {
    message: "Example cannot have both 'value' and 'externalValue'",
  })
  .refine(
    (data) => {
      const n = [
        data.value !== undefined,
        data.dataValue !== undefined,
        data.serializedValue !== undefined,
        data.externalValue !== undefined,
      ].filter(Boolean).length;
      return n <= 1;
    },
    {
      message:
        "Only one of 'value', 'dataValue', 'serializedValue', or 'externalValue' may be present",
    }
  );

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
export const ComponentsObject31 = z
  .object({
    schemas: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/, {
          message:
            'Schema names must contain only alphanumeric characters, dots, underscores, and hyphens',
        }),
        z.union([SchemaObject31, SchemaReferenceObject])
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
        z.union([ReferenceObject, z.any()])
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

export type Components31 = z.infer<typeof ComponentsObject31>;

// Components Object (OAS 3.2)
export const ComponentsObject32 = z
  .object({
    schemas: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/, {
          message:
            'Schema names must contain only alphanumeric characters, dots, underscores, and hyphens',
        }),
        z.union([SchemaObject31, SchemaReferenceObject])
      )
      .optional(),

    responses: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([ResponseObject32, ResponseReferenceObject])
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
        z.union([ExampleObject32, ExampleReferenceObject])
      )
      .optional(),

    requestBodies: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([RequestBodyObject32, RequestBodyReferenceObject])
      )
      .optional(),

    headers: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([HeaderObject, HeaderReferenceObject])
      )
      .optional(),

    // For 3.2 we still allow either a local object or a reference; URI refs are validated elsewhere
    securitySchemes: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([ReferenceObject, z.any()])
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

    // New reusable media types registry in 3.2
    mediaTypes: z.record(z.string(), z.any()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Components object must have at least one property',
  });

export type Components32 = z.infer<typeof ComponentsObject32>;
