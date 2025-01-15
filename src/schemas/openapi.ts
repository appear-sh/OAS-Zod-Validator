import { z } from 'zod';
import { ComponentsObject } from './components';
import { PathsObject } from './paths';

export const ServerObject = z.object({
  url: z.string(),
  description: z.string().optional(),
  variables: z.record(z.string(), z.object({
    enum: z.array(z.string()).optional(),
    default: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export const OpenAPIObject = z.object({
  openapi: z.string().regex(/^3\.(0|1)\.\d+$/),
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
  servers: z.array(ServerObject).optional(),
  paths: PathsObject,
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

export type OpenAPI = z.infer<typeof OpenAPIObject>;