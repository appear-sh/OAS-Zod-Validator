import { z } from 'zod';
import { PathsObject } from './paths';
import { ComponentsObject } from './components';
// Reuse or import a suitable "ServerObject", "InfoObject", etc. from your 3.0 schema files.
// You may also define new fields or differences specifically for 3.1 here.

const WebhooksObject = z.record(
  z.string(),
  // The value for each webhook path is effectively a Path Item Object, similar to how 3.1 defines it
  z.object({
    get: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional(),
    put: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional(),
    post: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional(),
    delete: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional(),
    options: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional(),
    head: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional(),
    patch: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional(),
    trace: z.object({
      responses: z.record(z.string(), z.object({
        description: z.string()
      }))
    }).optional()
  })
);

export const OpenAPIObject31 = z.object({
  openapi: z.string().regex(/^3\.1\.\d+$/), // e.g., 3.1.0, 3.1.1, etc.

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
