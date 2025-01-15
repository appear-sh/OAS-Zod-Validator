import { z } from 'zod';
import { ComponentsObject } from './components';
import { PathsObject } from './paths';

export const OpenAPIObject = z.object({
  openapi: z.string(),
  info: z.object({
    title: z.string(),
    version: z.string(),
    description: z.string().optional(),
  }),
  servers: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
  paths: PathsObject,
  components: ComponentsObject.optional(),
});

export type OpenAPI = z.infer<typeof OpenAPIObject>;