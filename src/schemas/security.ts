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

const BaseType = z.object({
  type: z.enum(['apiKey', 'http', 'oauth2', 'openIdConnect']),
});

export const SecuritySchemeObject = z.any().superRefine((val, ctx) => {
  const base = BaseType.safeParse(val);
  if (!base.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid security scheme',
    });
    return;
  }
  let parsed;
  switch (base.data.type) {
    case 'apiKey':
      parsed = ApiKeyScheme.safeParse(val);
      break;
    case 'http':
      parsed = HttpScheme.safeParse(val);
      break;
    case 'oauth2':
      parsed = OAuth2Scheme.safeParse(val);
      break;
    case 'openIdConnect':
      parsed = OpenIdScheme.safeParse(val);
      break;
  }
  if (!parsed?.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid security scheme',
    });
  }
});
