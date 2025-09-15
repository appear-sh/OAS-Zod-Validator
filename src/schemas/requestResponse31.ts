import { z } from 'zod';
import { SchemaObject31 } from './core31.js';
import {
  SchemaReferenceObject,
  ResponseReferenceObject,
  ExampleReferenceObject,
  HeaderReferenceObject,
  LinkReferenceObject,
} from './reference.js';

export const MediaTypeObject31 = z
  .object({
    schema: z.union([SchemaObject31, SchemaReferenceObject]).optional(),
    example: z.any().optional(),
    examples: z
      .record(
        z.string(),
        z.union([
          ExampleReferenceObject,
          z
            .object({
              summary: z.string().optional(),
              description: z.string().optional(),
              value: z.any().optional(),
              externalValue: z.string().url().optional(),
            })
            .refine((obj) => !(obj.value && obj.externalValue), {
              message: "Cannot have both 'value' and 'externalValue'",
            }),
        ])
      )
      .optional(),
    encoding: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

export const RequestBodyObject31 = z
  .object({
    description: z.string().optional(),
    content: z.record(z.string(), MediaTypeObject31),
    required: z.boolean().optional(),
  })
  .passthrough();

export const ResponseObject31 = z
  .object({
    description: z.string(),
    headers: z
      .record(
        z.string(),
        z.union([
          HeaderReferenceObject,
          z.object({
            description: z.string().optional(),
            required: z.boolean().optional(),
            deprecated: z.boolean().optional(),
            schema: z.union([SchemaObject31, SchemaReferenceObject]).optional(),
          }),
        ])
      )
      .optional(),
    content: z.record(z.string(), MediaTypeObject31).optional(),
    links: z
      .record(
        z.string(),
        z.union([
          LinkReferenceObject,
          z
            .object({
              operationRef: z.string().optional(),
              operationId: z.string().optional(),
              parameters: z.record(z.string(), z.any()).optional(),
              requestBody: z.any().optional(),
              description: z.string().optional(),
              server: z.any().optional(),
            })
            .refine((obj) => !(obj.operationRef && obj.operationId), {
              message: "Cannot have both 'operationRef' and 'operationId'",
            }),
        ])
      )
      .optional(),
  })
  .passthrough();

export const ResponsesObject31 = z.record(
  z.string(),
  z.union([ResponseObject31, ResponseReferenceObject])
);


