import { z } from 'zod';

export const ReferenceObject = z
  .object({
    $ref: z
      .string()
      .startsWith('#/', { message: 'References must start with "#/"' })
      .regex(/^#\/(components|paths)\/[\w/]+$/, {
        message:
          'Invalid reference format. Must be "#/components/... or #/paths/..."',
      }),
  })
  .strict();

// Context-specific $ref validators
export const SchemaReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/schemas\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const ResponseReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/responses\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const ParameterReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/parameters\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const ExampleReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/examples\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const RequestBodyReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/requestBodies\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const HeaderReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/headers\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const SecuritySchemeReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/securitySchemes\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const LinkReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/links\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const CallbackReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/callbacks\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export const PathItemReferenceObject = z
  .object({
    $ref: z
      .string()
      .regex(/^#\/components\/pathItems\/[A-Za-z0-9._-]+$/),
  })
  .strict();

export function isReferenceObject(obj: unknown): obj is { $ref: string } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    '$ref' in obj &&
    typeof obj.$ref === 'string'
  );
}

export function validateReference(ref: string): boolean {
  try {
    const refObj = { $ref: ref };
    ReferenceObject.parse(refObj);
    return true;
  } catch {
    return false;
  }
}
