import { z } from 'zod';

export const SecuritySchemeObject = z.discriminatedUnion('type', [
  // API Key
  z.object({
    type: z.literal('apiKey'),
    name: z.string(),
    in: z.enum(['header', 'query', 'cookie']),
    description: z.string().optional(),
  }),
  // HTTP
  z.object({
    type: z.literal('http'),
    scheme: z.string(),
    bearerFormat: z.string().optional(),
    description: z.string().optional(),
  }),
  // OAuth2
  z.object({
    type: z.literal('oauth2'),
    flows: z.object({
      implicit: z.object({
        authorizationUrl: z.string().url(),
        scopes: z.record(z.string()),
      }).optional(),
      password: z.object({
        tokenUrl: z.string().url(),
        scopes: z.record(z.string()),
      }).optional(),
      clientCredentials: z.object({
        tokenUrl: z.string().url(),
        scopes: z.record(z.string()),
      }).optional(),
      authorizationCode: z.object({
        authorizationUrl: z.string().url(),
        tokenUrl: z.string().url(),
        scopes: z.record(z.string()),
      }).optional(),
    }),
    description: z.string().optional(),
  }),
  // OpenID Connect
  z.object({
    type: z.literal('openIdConnect'),
    openIdConnectUrl: z.string().url(),
    description: z.string().optional(),
  }),
]);