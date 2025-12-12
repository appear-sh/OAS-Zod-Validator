import { z } from 'zod';
import { SchemaObject, SchemaObject31 } from './core.js';
import {
  SchemaReferenceObject,
  ResponseReferenceObject,
  ExampleReferenceObject,
  HeaderReferenceObject,
  LinkReferenceObject,
} from './reference.js';

// Media Type Object (OAS 3.0)
export const MediaTypeObject = z
  .object({
    schema: z.union([SchemaObject, SchemaReferenceObject]).optional(),
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
            })
            .strict(),
        ])
      )
      .optional(),
    encoding: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

// Media Type Object (OAS 3.1) - uses SchemaObject31 which allows type to be omitted
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
            })
            .strict(),
        ])
      )
      .optional(),
    encoding: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

// Media Type Object (OAS 3.2)
export const MediaTypeObject32 = z
  .object({
    schema: z.union([SchemaObject31, SchemaReferenceObject]).optional(),
    // Streaming/sequential media support
    itemSchema: z.union([SchemaObject31, SchemaReferenceObject]).optional(),
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
              // OAS 3.2: examples can carry either structured or serialized values
              value: z.any().optional(),
              dataValue: z.any().optional(),
              serializedValue: z.any().optional(),
              externalValue: z.string().url().optional(),
            })
            .refine(
              (obj) => {
                const present = [
                  obj.value !== undefined,
                  obj.dataValue !== undefined,
                  obj.serializedValue !== undefined,
                  obj.externalValue !== undefined,
                ].filter(Boolean).length;
                return present <= 1;
              },
              {
                message:
                  "Only one of 'value', 'dataValue', 'serializedValue', or 'externalValue' may be present",
              }
            )
            .strict(),
        ])
      )
      .optional(),
    // Multipart extensions in 3.2
    prefixEncoding: z.record(z.string(), z.any()).optional(),
    itemEncoding: z.record(z.string(), z.any()).optional(),
    // Keep legacy encoding to avoid breaking existing specs; disallow mixing via refine below
    encoding: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()
  .refine(
    (obj) => {
      // If either prefixEncoding or itemEncoding present, discourage legacy 'encoding'
      if ((obj as any).prefixEncoding || (obj as any).itemEncoding) {
        return (obj as any).encoding === undefined;
      }
      return true;
    },
    {
      message:
        "Use 'prefixEncoding'/'itemEncoding' instead of 'encoding' for multipart media types in OAS 3.2",
      path: ['encoding'],
    }
  );

// Request Body Object (OAS 3.0)
export const RequestBodyObject = z
  .object({
    description: z.string().optional(),
    content: z.record(z.string(), MediaTypeObject),
    required: z.boolean().optional(),
  })
  .passthrough();

// Request Body Object (OAS 3.1)
export const RequestBodyObject31 = z
  .object({
    description: z.string().optional(),
    content: z.record(z.string(), MediaTypeObject31),
    required: z.boolean().optional(),
  })
  .passthrough();

// Request Body Object (OAS 3.2)
export const RequestBodyObject32 = z
  .object({
    description: z.string().optional(),
    content: z.record(z.string(), MediaTypeObject32),
    required: z.boolean().optional(),
  })
  .passthrough();

// Response Object
export const ResponseObject = z
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
            schema: z.union([SchemaObject, SchemaReferenceObject]).optional(),
          }),
        ])
      )
      .optional(),
    content: z.record(z.string(), MediaTypeObject).optional(),
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

export const ResponsesObject = z.record(
  z.string(), // Status Code or 'default'
  z.union([ResponseObject, ResponseReferenceObject])
);

// Response Object (OAS 3.1) - uses SchemaObject31 which allows type to be omitted
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

// Response Object (OAS 3.2)
export const ResponseObject32 = z
  .object({
    // 3.2: description becomes optional; add summary field
    description: z.string().optional(),
    summary: z.string().optional(),
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
    content: z.record(z.string(), MediaTypeObject32).optional(),
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

export const ResponsesObject32 = z.record(
  z.string(),
  z.union([ResponseObject32, ResponseReferenceObject])
);

export type RequestBody = z.infer<typeof RequestBodyObject>;
export type Response = z.infer<typeof ResponseObject>;
