import { z } from 'zod';
import { ComponentsObject, LinkObject } from './components.js';
import { PathsObject } from './paths.js';
import { ReferenceObject } from './reference.js';
import { MediaTypeObject } from './requestResponse.js';

export const ServerObject = z.object({
  url: z.string(),
  description: z.string().optional(),
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

const HeaderObject = z
  .object({
    description: z.string().optional(),
    schema: z.object({
      type: z.string(),
    }),
  })
  .passthrough();

export const ResponseObject = z
  .object({
    description: z.string(),
    headers: z.record(z.string(), HeaderObject).optional(),
    content: z.record(z.string(), MediaTypeObject).optional(),
    links: z.record(z.string(), ReferenceObject.or(LinkObject)).optional(),
  })
  .passthrough();

// Add explicit type annotation to fix compiler serialization error
export const OpenAPIObject: z.ZodType = z.object({
  openapi: z.string().regex(/^3\.(0|1)\.\d+$/),
  info: z.object({
    title: z.string(),
    description: z.string().optional(),
    termsOfService: z.string().url().optional(),
    contact: z
      .object({
        name: z.string().optional(),
        url: z.string().url().optional(),
        email: z.string().email().optional(),
      })
      .optional(),
    license: z
      .object({
        name: z.string(),
        url: z.string().url().optional(),
      })
      .optional(),
    version: z.string(),
  }),
  servers: z.array(ServerObject).optional(),
  paths: PathsObject,
  components: ComponentsObject.optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  tags: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        externalDocs: z
          .object({
            description: z.string().optional(),
            url: z.string().url(),
          })
          .optional(),
      })
    )
    .optional(),
  externalDocs: z
    .object({
      description: z.string().optional(),
      url: z.string().url(),
    })
    .optional(),
});

export type OpenAPI = z.infer<typeof OpenAPIObject>;
