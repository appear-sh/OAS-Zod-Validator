import { z } from 'zod';
import { PathsObject } from './paths';
import { ComponentsObject } from './components';
import { RequestBodyObject, ResponseObject } from './requestResponse';
import { ReferenceObject } from './core';

const ParameterObject = z.object({
  name: z.string(),
  in: z.enum(['query', 'header', 'path', 'cookie']),
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  allowEmptyValue: z.boolean().optional(),
  schema: z.any().optional(),
});

const WebhookOperationObject = z.object({
  requestBody: RequestBodyObject.optional(),
  responses: ResponseObject,
  parameters: z.array(z.union([ParameterObject, ReferenceObject])).optional(),
  description: z.string().optional(),
}).passthrough();

const WebhooksObject = z.record(
  z.string(),
  z.object({
    post: WebhookOperationObject.optional(),
    get: WebhookOperationObject.optional(),
    put: WebhookOperationObject.optional(),
    delete: WebhookOperationObject.optional(),
    options: WebhookOperationObject.optional(),
    head: WebhookOperationObject.optional(),
    patch: WebhookOperationObject.optional(),
    trace: WebhookOperationObject.optional(),
  })
);

export const OpenAPIObject31 = z.object({
  openapi: z.string().regex(/^3\.[1-9]\.\d+$/), // Allow 3.1.0 through 3.9.x

  // For OAS 3.1, "info" largely remains the same as 3.0
  info: z.object({
    title: z.string(),
    description: z.string().optional(),
    termsOfService: z.string().url().optional(),
    contact: z.object({
      name: z.string().optional(),
      url: z.string().url().optional(),
      email: z.string().email().optional(),
    }).optional(),
    license: z.object({
      name: z.string(),
      url: z.string().url().optional(),
    }).optional(),
    version: z.string(),
  }),

  // JSON Schema Dialect
  jsonSchemaDialect: z.string().url().optional(),

  // The usual suspects in OAS
  servers: z.array(
    z.object({
      url: z.string().url(),
      description: z.string().optional(),
      variables: z.record(
        z.string(),
        z.object({
          enum: z.array(z.string()).optional(),
          default: z.string(),
          description: z.string().optional(),
        })
      ).optional(),
    })
  ).optional(),

  // Paths remain the same as 3.0 in many respects
  paths: PathsObject.optional(),

  // 3.1 introduces "webhooks" at the top level, which are like paths
  webhooks: WebhooksObject.optional(),

  components: ComponentsObject.optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  tags: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    externalDocs: z.object({
      description: z.string().optional(),
      url: z.string().url(),
    }).optional(),
  })).optional(),
  externalDocs: z.object({
    description: z.string().optional(),
    url: z.string().url(),
  }).optional(),
});
