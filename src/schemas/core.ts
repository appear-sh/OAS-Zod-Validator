import { z } from 'zod';

// Enhanced error messages and stricter validation
export const ReferenceObject = z.object({
  $ref: z.string()
    .startsWith('#/', { message: 'References must start with "#/"' })
    .regex(/^#\/(components|paths)\/[\w/]+$/, {
      message: 'Invalid reference format. Must be "#/components/... or #/paths/..."'
    }),
});

// Improved schema object with more specific types
export const SchemaObject: z.ZodType<any> = z.lazy(() => 
  z.object({
    type: z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object']),
    format: z.enum([
      'date-time', 'date', 'time', 'email', 'hostname', 'ipv4', 'ipv6',
      'uri', 'uuid', 'password', 'byte', 'binary'
    ]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    default: z.any().optional(),
    nullable: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    minLength: z.number().int().positive().optional(),
    maxLength: z.number().int().positive().optional(),
    pattern: z.string().optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    exclusiveMinimum: z.boolean().optional(),
    exclusiveMaximum: z.boolean().optional(),
    enum: z.array(z.any()).optional(),
    required: z.array(z.string()).optional(),
    properties: z.record(z.string(), z.union([SchemaObject, ReferenceObject])).optional(),
    items: z.union([SchemaObject, ReferenceObject]).optional(),
    additionalProperties: z.union([z.boolean(), SchemaObject, ReferenceObject]).optional(),
  }).refine((schema) => {
    // Validate that array types have items
    if (schema.type === 'array' && !schema.items) {
      return false;
    }
    // Validate that object types have properties
    if (schema.type === 'object' && !schema.properties && !schema.additionalProperties) {
      return false;
    }
    return true;
  }, {
    message: "Array types must define 'items' and object types must define 'properties' or 'additionalProperties'"
  })
);

// Extensible object with validation
export const ExtensibleObject = z.object({}).catchall(z.any());

// If you want to keep vendor extension validation, use this instead:
export const VendorExtensible = z.object({}).catchall(z.any()).refine((val) => {
  const extraKeys = Object.keys(val).filter(key => !key.startsWith('x-'));
  return extraKeys.length === 0;
}, {
  message: "Custom extensions must start with 'x-'"
});
