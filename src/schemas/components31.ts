import { z } from 'zod';
import { SchemaObject31 } from './core31.js';
import {
  ReferenceObject,
  SchemaReferenceObject,
  ResponseReferenceObject,
  ParameterReferenceObject,
  ExampleReferenceObject,
  RequestBodyReferenceObject,
  HeaderReferenceObject,
  LinkReferenceObject,
  CallbackReferenceObject,
} from './reference.js';
import { RequestBodyObject31, ResponseObject31 } from './requestResponse31.js';

const ParameterObject = z.object({
  name: z.string(),
  in: z.enum(['query', 'header', 'path', 'cookie']),
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  schema: z.union([SchemaObject31, ReferenceObject]),
});

export const HeaderObject31 = z.object({
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  schema: z.union([SchemaObject31, ReferenceObject]),
});

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

export const LinkObject31 = z
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

const CallbackObject = z.record(z.string(), z.record(z.string(), z.any()));

export const ComponentsObject31 = z
  .object({
    schemas: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([SchemaObject31, SchemaReferenceObject])
      )
      .optional(),
    responses: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([ResponseObject31, ResponseReferenceObject])
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
        z.union([RequestBodyObject31, RequestBodyReferenceObject])
      )
      .optional(),
    headers: z
      .record(
        z.string().regex(/^[a-zA-Z0-9._-]+$/),
        z.union([HeaderObject31, HeaderReferenceObject])
      )
      .optional(),
    securitySchemes: z
      .record(z.string().regex(/^[a-zA-Z0-9._-]+$/), z.union([ReferenceObject, z.any()]))
      .optional(),
    links: z
      .record(z.string().regex(/^[a-zA-Z0-9._-]+$/), z.union([LinkObject31, LinkReferenceObject]))
      .optional(),
    callbacks: z
      .record(z.string().regex(/^[a-zA-Z0-9._-]+$/), z.union([CallbackObject, CallbackReferenceObject]))
      .optional(),
  })
  .passthrough();


