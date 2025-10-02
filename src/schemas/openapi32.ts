import { z } from 'zod';
import { ComponentsObject32 } from './components.js';
import { PathsObject32 } from './openapi32.paths.js';

export const ServerObject32 = z.object({
  url: z.string(),
  description: z.string().optional(),
  name: z.string().optional(),
  variables: z
    .record(
      z.string(),
      z.object({
        enum: z.array(z.string()).optional(),
        default: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

export const TagObject32 = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    summary: z.string().optional(),
    parent: z.string().optional(),
    kind: z.string().optional(),
    externalDocs: z
      .object({
        description: z.string().optional(),
        url: z.string().url(),
      })
      .optional(),
  })
  .passthrough();

export const OpenAPIObject32: z.ZodType = z
  .object({
    openapi: z.string().regex(/^3\.2\.\d+$/),
    $self: z.string().url().optional(),
    info: z
      .object({
        title: z.string(),
        version: z.string(),
      })
      .passthrough(),
    jsonSchemaDialect: z.string().url().optional(),
    webhooks: z.record(z.string(), z.record(z.string(), z.any())).optional(),
    servers: z.array(ServerObject32).optional(),
    paths: PathsObject32.optional(),
    components: ComponentsObject32.optional(),
    security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
    tags: z.array(TagObject32).optional(),
    externalDocs: z
      .object({
        description: z.string().optional(),
        url: z.string().url(),
      })
      .optional(),
  })
  .passthrough();

export type OpenAPI32 = z.infer<typeof OpenAPIObject32>;

// Future-friendly 3.x schema used only when allowFutureOASVersions is true.
// Mirrors 3.2 structure but allows any 3.x.y in the openapi field.
export const OpenAPIObjectFuture: z.ZodType = z
  .object({
    openapi: z.string().regex(/^3\.\d+\.\d+$/),
    $self: z.string().url().optional(),
    info: z
      .object({
        title: z.string(),
        version: z.string(),
      })
      .passthrough(),
    jsonSchemaDialect: z.string().url().optional(),
    webhooks: z.record(z.string(), z.record(z.string(), z.any())).optional(),
    servers: z.array(ServerObject32).optional(),
    paths: PathsObject32.optional(),
    components: ComponentsObject32.optional(),
    security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
    tags: z.array(TagObject32).optional(),
    externalDocs: z
      .object({
        description: z.string().optional(),
        url: z.string().url(),
      })
      .optional(),
  })
  .passthrough();
