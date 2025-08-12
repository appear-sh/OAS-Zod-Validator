import { z } from 'zod';

// Explicit key schema for Zod v4 record
export const SecurityRequirementObject = z.record(
  z.string(),
  z.array(z.string())
);

// Avoid discriminatedUnion due to Zod v4 internal edge in our test matrix
const ApiKeyScheme = z.object({
  type: z.literal('apiKey'),
  name: z.string().min(1),
  in: z.enum(['header', 'query', 'cookie']),
  description: z.string().optional(),
});

const HttpScheme = z.object({
  type: z.literal('http'),
  scheme: z.string().min(1),
  bearerFormat: z.string().optional(),
  description: z.string().optional(),
});

const OAuth2Flows = z
  .object({
    implicit: z
      .object({
        authorizationUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      })
      .optional(),
    password: z
      .object({
        tokenUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      })
      .optional(),
    clientCredentials: z
      .object({
        tokenUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      })
      .optional(),
    authorizationCode: z
      .object({
        authorizationUrl: z.string().url(),
        tokenUrl: z.string().url(),
        refreshUrl: z.string().url().optional(),
        scopes: z.record(z.string()),
      })
      .optional(),
  })
  .superRefine((flows, ctx) => {
    if (
      !flows ||
      typeof flows !== 'object' ||
      Object.keys(flows).length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one OAuth2 flow must be defined',
        path: ['flows'],
      });
    }
  });

const OAuth2Scheme = z.object({
  type: z.literal('oauth2'),
  flows: OAuth2Flows,
  description: z.string().optional(),
});

const OpenIdScheme = z.object({
  type: z.literal('openIdConnect'),
  openIdConnectUrl: z.string().url(),
  description: z.string().optional(),
});

// Retained for context documentation; not used with discriminated union
// const _BaseType = z.object({
//   type: z.enum(['apiKey', 'http', 'oauth2', 'openIdConnect']),
// });

export const SecuritySchemeObject = z.discriminatedUnion('type', [
  ApiKeyScheme,
  HttpScheme,
  OAuth2Scheme,
  OpenIdScheme,
]);
