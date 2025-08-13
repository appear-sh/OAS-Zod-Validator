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

// Removed explicit OAuth2 zod schema to avoid any Zod internals in tests

const OpenIdScheme = z.object({
  type: z.literal('openIdConnect'),
  openIdConnectUrl: z.string().url(),
  description: z.string().optional(),
});

// Retained for context documentation; not used with discriminated union
// const _BaseType = z.object({
//   type: z.enum(['apiKey', 'http', 'oauth2', 'openIdConnect']),
// });

// Manual discriminator to avoid Zod union internals issues
export const SecuritySchemeObject = z.any().superRefine((val, ctx) => {
  if (!val || typeof val !== 'object') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid security scheme',
    });
    return;
  }
  const t = (val as any).type;
  if (t === 'apiKey') {
    if (!ApiKeyScheme.safeParse(val).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid security scheme',
      });
    }
    return;
  }
  if (t === 'http') {
    if (!HttpScheme.safeParse(val).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid security scheme',
      });
    }
    return;
  }
  if (t === 'oauth2') {
    const flows = (val as any).flows;
    const isUrl = (s: unknown) =>
      typeof s === 'string' && /^https?:\/\//i.test(s);
    const isScopes = (o: unknown) =>
      !!o &&
      typeof o === 'object' &&
      Object.values(o as Record<string, unknown>).every(
        (v) => typeof v === 'string'
      );

    if (
      !flows ||
      typeof flows !== 'object' ||
      Object.keys(flows).length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one OAuth2 flow must be defined',
      });
      return;
    }

    const checkImplicit = (f: any) =>
      isUrl(f?.authorizationUrl) &&
      (f?.scopes === undefined || isScopes(f.scopes)) &&
      (f?.refreshUrl === undefined || isUrl(f.refreshUrl));
    const checkPassword = (f: any) =>
      isUrl(f?.tokenUrl) &&
      (f?.scopes === undefined || isScopes(f.scopes)) &&
      (f?.refreshUrl === undefined || isUrl(f.refreshUrl));
    const checkClientCreds = (f: any) =>
      isUrl(f?.tokenUrl) &&
      (f?.scopes === undefined || isScopes(f.scopes)) &&
      (f?.refreshUrl === undefined || isUrl(f.refreshUrl));
    const checkAuthCode = (f: any) =>
      isUrl(f?.authorizationUrl) &&
      isUrl(f?.tokenUrl) &&
      (f?.scopes === undefined || isScopes(f.scopes)) &&
      (f?.refreshUrl === undefined || isUrl(f.refreshUrl));

    const ok = [
      flows.implicit === undefined || checkImplicit(flows.implicit),
      flows.password === undefined || checkPassword(flows.password),
      flows.clientCredentials === undefined ||
        checkClientCreds(flows.clientCredentials),
      flows.authorizationCode === undefined ||
        checkAuthCode(flows.authorizationCode),
    ].every(Boolean);

    if (!ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid security scheme',
      });
    }
    return;
  }
  if (t === 'openIdConnect') {
    if (!OpenIdScheme.safeParse(val).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid security scheme',
      });
    }
    return;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Invalid security scheme',
  });
});
