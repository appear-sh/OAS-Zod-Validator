import { z } from 'zod';
import { PathsObject } from './paths.js';
import { ComponentsObject31 } from './components.js';
import { RequestBodyObject, ResponsesObject } from './requestResponse.js';

const WebhookOperationObject = z
  .object({
    requestBody: RequestBodyObject.optional(),
    responses: ResponsesObject,
    parameters: z.array(z.any()).optional(),
  })
  .passthrough();

const WebhookObject = z
  .object({
    post: WebhookOperationObject.optional(),
    get: WebhookOperationObject.optional(),
    put: WebhookOperationObject.optional(),
    delete: WebhookOperationObject.optional(),
    options: WebhookOperationObject.optional(),
    head: WebhookOperationObject.optional(),
    patch: WebhookOperationObject.optional(),
    trace: WebhookOperationObject.optional(),
    // Not part of 3.1, but we keep passthrough below to ignore unknowns
  })
  .passthrough();

// Add explicit type annotation to fix compiler serialization error
export const OpenAPIObject31: z.ZodType = z
  .object({
    openapi: z.string().regex(/^3\.1\.\d+$/),
    info: z
      .object({
        title: z.string(),
        version: z.string(),
      })
      .passthrough(),
    jsonSchemaDialect: z.string().url().optional(),
    webhooks: z.record(z.string(), WebhookObject).optional(),
    paths: PathsObject.optional(),
    components: ComponentsObject31.optional(),
  })
  .passthrough();

// 3.2 now lives in openapi32.ts for clarity
