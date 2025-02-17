import { z } from 'zod';

// Enhanced error messages and stricter validation
export const ReferenceObject = z.object({
  $ref: z.string()
    .startsWith('#/', { message: 'References must start with "#/"' })
    .regex(/^#\/(components|paths)\/[\w/]+$/, {
      message: 'Invalid reference format. Must be "#/components/... or #/paths/..."'
    }),
}).strict();

// Define format types for better error messages
const StringFormats = z.enum([
  'date-time', 'date', 'time', 'email', 'hostname', 'ipv4', 'ipv6',
  'uri', 'uuid', 'password', 'byte', 'binary'
], {
  errorMap: () => ({
    message: 'Invalid string format. Must be one of: date-time, date, time, email, hostname, ipv4, ipv6, uri, uuid, password, byte, binary'
  })
});

const NumericFormats = z.enum([
  'int32', 'int64', 'float', 'double'
], {
  errorMap: () => ({
    message: 'Invalid numeric format. Must be one of: int32, int64, float, double'
  })
});

// Helper function to get parent type from context
function getParentType(ctx: z.RefinementCtx): string | undefined {
  const parent = (ctx as any).parent;
  return parent ? parent.type : undefined;
}

// Improved schema object with more specific types and better error messages
export const SchemaObject: z.ZodType = z.lazy(() => {
  const baseSchema = z.object({
    type: z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object'], {
      errorMap: () => ({
        message: 'Invalid type. Must be one of: string, number, integer, boolean, array, object'
      })
    }),
    format: z.union([StringFormats, NumericFormats])
      .optional()
      .superRefine((format, ctx) => {
        if (!format) return;
        const type = getParentType(ctx);
        if (!type) return;

        if (['int32', 'int64', 'float', 'double'].includes(format) && !['number', 'integer'].includes(type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Format '${format}' can only be used with numeric types (number, integer)`,
            path: ['format']
          });
        }
        if (['date-time', 'date', 'time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri', 'uuid', 'password', 'byte', 'binary'].includes(format) && type !== 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Format '${format}' can only be used with string type`,
            path: ['format']
          });
        }
      }),
    title: z.string().optional(),
    description: z.string().optional(),
    default: z.unknown().optional(),
    nullable: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    minLength: z.number().int().positive()
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type !== 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'minLength can only be used with string type',
            path: ['minLength']
          });
        }
      }),
    maxLength: z.number().int().positive()
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type !== 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'maxLength can only be used with string type',
            path: ['maxLength']
          });
        }
      }),
    pattern: z.string()
      .optional()
      .superRefine((val, ctx) => {
        if (!val) return;
        const type = getParentType(ctx);
        if (type !== 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'pattern can only be used with string type',
            path: ['pattern']
          });
          return;
        }
        try {
          new RegExp(val);
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid regular expression pattern',
            path: ['pattern']
          });
        }
      }),
    minimum: z.number()
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type && !['number', 'integer'].includes(type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'minimum can only be used with numeric types (number, integer)',
            path: ['minimum']
          });
        }
      }),
    maximum: z.number()
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type && !['number', 'integer'].includes(type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'maximum can only be used with numeric types (number, integer)',
            path: ['maximum']
          });
        }
      }),
    exclusiveMinimum: z.boolean()
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type && !['number', 'integer'].includes(type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'exclusiveMinimum can only be used with numeric types (number, integer)',
            path: ['exclusiveMinimum']
          });
        }
      }),
    exclusiveMaximum: z.boolean()
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type && !['number', 'integer'].includes(type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'exclusiveMaximum can only be used with numeric types (number, integer)',
            path: ['exclusiveMaximum']
          });
        }
      }),
    enum: z.array(z.unknown()).optional(),
    required: z.array(z.string())
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type !== 'object') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'required can only be used with object type',
            path: ['required']
          });
        }
      }),
    properties: z.record(z.string(), z.union([z.lazy(() => SchemaObject), ReferenceObject]))
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type !== 'object') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'properties can only be used with object type',
            path: ['properties']
          });
        }
      }),
    items: z.union([z.lazy(() => SchemaObject), ReferenceObject])
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type !== 'array') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'items can only be used with array type',
            path: ['items']
          });
        }
      }),
    additionalProperties: z.union([z.boolean(), z.lazy(() => SchemaObject), ReferenceObject])
      .optional()
      .superRefine((val, ctx) => {
        const type = getParentType(ctx);
        if (type !== 'object') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'additionalProperties can only be used with object type',
            path: ['additionalProperties']
          });
        }
      }),
  }).passthrough();

  return z.preprocess((raw) => {
    if (raw && typeof raw === 'object' && 'type' in raw) {
      const typeVal = (raw as any).type;
      if (typeVal === 'number' || typeVal === 'integer') {
        const allowedNumeric = new Set([
          'type',
          'format',
          'default',
          'nullable',
          'deprecated',
          'minimum',
          'maximum',
          'exclusiveMinimum',
          'exclusiveMaximum',
          'multipleOf',
          'enum',
          'example',
          'title',
          'description'
        ]);
        return Object.fromEntries(Object.entries(raw).filter(([key]) => allowedNumeric.has(key)));
      }
    }
    return raw;
  }, baseSchema).superRefine((schema, ctx) => {
    // Validate that array types have items
    if (schema.type === 'array' && !schema.items) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Array types must define items',
        path: ['items']
      });
    }
    // Validate that object types have properties or additionalProperties
    if (schema.type === 'object' && !schema.properties && !schema.additionalProperties) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Object types must define either properties or additionalProperties',
        path: ['properties']
      });
    }
  });
});

// Basic extensible object that allows any additional properties
export const ExtensibleObject = z.object({}).passthrough();

// Strict vendor extension validation with better error messages
export const VendorExtensible = z.object({}).catchall(z.unknown()).refine((val) => {
  const extraKeys = Object.keys(val).filter(key => !key.startsWith('x-'));
  return extraKeys.length === 0;
}, {
  message: 'Unknown field detected. Custom extensions must start with "x-". For example: x-custom-field'
});
