import { z } from 'zod';
import { ExtensibleObject } from './core.js';

export const SecurityRequirementObject = z.record(z.array(z.string()));

export const SecuritySchemeObject = z.discriminatedUnion('type', [
  // API Key
  z.object({
    type: z.literal('apiKey'),
    name: z.string().min(1),
    in: z.enum(['header', 'query', 'cookie']),
    description: z.string().optional(),
  }).merge(ExtensibleObject).passthrough(),
  // HTTP
  z.object({
    type: z.literal('http'),
    scheme: z.string().min(1),
    bearerFormat: z.string().optional(),
    description: z.string().optional(),
  }).merge(ExtensibleObject).passthrough(),
  // OAuth2
  z.object({
    type: z.literal('oauth2'),
    flows: z.object({
      implicit: z.object({
        authorizationUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      }).merge(ExtensibleObject).optional(),
      password: z.object({
        tokenUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      }).merge(ExtensibleObject).optional(),
      clientCredentials: z.object({
        tokenUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      }).merge(ExtensibleObject).optional(),
      authorizationCode: z.object({
        authorizationUrl: z.string().url(),
        tokenUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      }).merge(ExtensibleObject).optional(),
    }).merge(ExtensibleObject).refine(
      flows => Object.keys(flows).length > 0,
      { message: 'At least one OAuth2 flow must be defined' }
    ),
    description: z.string().optional(),
  }).merge(ExtensibleObject).passthrough(),
  // OpenID Connect
  z.object({
    type: z.literal('openIdConnect'),
    openIdConnectUrl: z.string().url(),
    description: z.string().optional(),
  }).merge(ExtensibleObject).passthrough(),
]);