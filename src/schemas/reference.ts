import { z } from 'zod';

export const ReferenceObject = z.object({
  $ref: z.string()
    .startsWith('#/', { message: 'References must start with "#/"' })
    .regex(/^#\/(components|paths)\/[\w/]+$/, {
      message: 'Invalid reference format. Must be "#/components/... or #/paths/..."'
    })
}).strict();

export function isReferenceObject(obj: unknown): obj is { $ref: string } {
  return obj !== null && 
         typeof obj === 'object' && 
         '$ref' in obj && 
         typeof obj.$ref === 'string';
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
