import { z } from 'zod';
import { validateNumericFormat } from './numeric-formats.js';

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
export function getParentType(ctx: z.RefinementCtx): string | undefined {
  const parent = (ctx as any).parent;
  return parent ? parent.type : undefined;
}

// Helper to retrieve the root schema type from the refinement context
export function getRootType(ctx: any): string | undefined {
  if (ctx.parent && typeof ctx.parent === 'object' && ctx.parent.type) {
    return ctx.parent.type;
  }
  if (ctx.data && typeof ctx.data === 'object' && 'type' in ctx.data) {
    return ctx.data.type;
  }
  if (ctx.options && (ctx.options as any).data && (ctx.options as any).data.type) {
    return (ctx.options as any).data.type;
  }
  return undefined;
}

// Improved schema object with more specific types and better error messages
export const SchemaObject: z.ZodType = z.lazy(() => {
  // Preprocessor to select ReferenceObject if $ref exists, stripping extraneous keys
  const SchemaOrRef = z.preprocess(
    (data) => {
      if (typeof data === 'object' && data !== null && ('$ref' in data)) {
        return { $ref: (data as any).$ref };
      }
      return data;
    },
    z.union([z.lazy(() => SchemaObject), ReferenceObject])
  );
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
        if (ctx.path.filter(key => key === 'format').length > 1) return;
        if (typeof (ctx as any).parent !== 'object') return;
        const type = getRootType(ctx);
        if (type !== undefined) {
          if (['int32', 'int64', 'float', 'double'].includes(format) && (type !== 'number' && type !== 'integer')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Format '${format}' can only be used with numeric types (number, integer)`,
              path: ['format']
            });
          }
          if (['date-time', 'date', 'time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri', 'uuid', 'password', 'byte', 'binary'].includes(format) && (type !== 'string')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Format '${format}' can only be used with string type`,
              path: ['format']
            });
          }
        }
      }),
    title: z.string().optional(),
    description: z.string().optional(),
    default: z.unknown().optional(),
    nullable: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    example: z.unknown().optional(),
    minLength: z.number().int().positive()
      .optional()
      .superRefine((val, ctx) => {
        const type = getRootType(ctx);
        if (type === undefined) return;
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
        const type = getRootType(ctx);
        if (type === undefined) return;
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
        const type = getRootType(ctx);
        if (type === undefined) return;
        if (type !== 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'pattern can only be used with string type',
            path: ['pattern']
          });
        } else {
          if (val !== undefined) {
            try {
              new RegExp(val);
            } catch (e) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid regular expression pattern',
                path: ['pattern']
              });
            }
          }
        }
      }),
    minimum: z.number()
      .optional()
      .superRefine((val, ctx) => {
        const type = getRootType(ctx);
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
        const type = getRootType(ctx);
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
        const type = getRootType(ctx);
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
        const type = getRootType(ctx);
        if (type && !['number', 'integer'].includes(type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'exclusiveMaximum can only be used with numeric types (number, integer)',
            path: ['exclusiveMaximum']
          });
        }
      }),
    multipleOf: z.number().positive()
      .optional()
      .superRefine((val, ctx) => {
        const type = getRootType(ctx);
        if (type && !['number', 'integer'].includes(type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'multipleOf can only be used with numeric types (number, integer)',
            path: ['multipleOf']
          });
        }
      }),
    enum: z.array(z.unknown()).optional(),
    required: z.array(z.string())
      .optional()
      .superRefine((val, ctx) => {
        const type = getRootType(ctx);
        if (type === undefined) return;
        if (type !== 'object') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'required can only be used with object type',
            path: ['required']
          });
        }
      }),
    properties: z.record(z.string(), SchemaOrRef)
      .optional()
      .superRefine((val, ctx) => {
        const type = getRootType(ctx);
        if (type === undefined) return;
        if (type !== 'object') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'properties can only be used with object type',
            path: ['properties']
          });
        }
      }),
    items: SchemaOrRef
      .optional()
      .superRefine((val, ctx) => {
        const type = getRootType(ctx);
        if (type === undefined) return;
        if (type !== 'array') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'items can only be used with array type',
            path: ['items']
          });
        }
      }),
    additionalProperties: z.union([z.boolean(), SchemaOrRef])
      .optional()
      .superRefine((val, ctx) => {
        const type = getRootType(ctx);
        if (type === undefined) return;
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
      const commonProps = new Set([
        'type',
        'format',
        'default',
        'nullable',
        'deprecated',
        'example',
        'enum',
        'title',
        'description'
      ]);
      
      // Type-specific properties
      const stringProps = new Set(['minLength', 'maxLength', 'pattern']);
      const numericProps = new Set(['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']);
      const arrayProps = new Set(['items']);
      const objectProps = new Set(['properties', 'additionalProperties', 'required']);
      
      const allowedProps = new Set([...commonProps]);
      
      // Add type-specific properties
      if (typeVal === 'string') {
        stringProps.forEach(prop => allowedProps.add(prop));
      } else if (typeVal === 'number' || typeVal === 'integer') {
        numericProps.forEach(prop => allowedProps.add(prop));
      } else if (typeVal === 'array') {
        arrayProps.forEach(prop => allowedProps.add(prop));
      } else if (typeVal === 'object') {
        objectProps.forEach(prop => allowedProps.add(prop));
      }
      
      // Return only the allowed properties for this type
      return Object.fromEntries(Object.entries(raw).filter(([key]) => 
        allowedProps.has(key) || key.startsWith('x-')
      ));
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
    // Additional numeric format validation
    if (schema.format && ['int32', 'int64', 'float', 'double'].includes(schema.format)) {
      if (schema.type !== 'number' && schema.type !== 'integer') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Format '${schema.format}' can only be used with numeric types (number, integer)`,
          path: ['format']
        });
      }
    }
    // New check: Validate the 'example' value if present for numeric formats
    if (schema.example !== undefined && schema.format && ['int32', 'int64', 'float', 'double'].includes(schema.format)) {
      if (typeof schema.example !== 'number' || !validateNumericFormat(schema.format, schema.example)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Example value ${schema.example} does not conform to the ${schema.format} format`,
          path: ['example']
        });
      } else {
        // Validate minimum constraint if provided
        if (typeof schema.minimum === 'number') {
          if (schema.exclusiveMinimum ? !(schema.example > schema.minimum) : !(schema.example >= schema.minimum)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Example value ${schema.example} must be ${schema.exclusiveMinimum ? 'greater than' : 'greater than or equal to'} ${schema.minimum}`,
              path: ['example']
            });
          }
        }
        // Validate maximum constraint if provided
        if (typeof schema.maximum === 'number') {
          if (schema.exclusiveMaximum ? !(schema.example < schema.maximum) : !(schema.example <= schema.maximum)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Example value ${schema.example} must be ${schema.exclusiveMaximum ? 'less than' : 'less than or equal to'} ${schema.maximum}`,
              path: ['example']
            });
          }
        }
        // Validate multipleOf constraint if provided
        if (typeof schema.multipleOf === 'number') {
          const quotient = schema.example / schema.multipleOf;
          const tolerance = 1e-8;
          if (Math.abs(quotient - Math.round(quotient)) > tolerance) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Example value ${schema.example} must be a multiple of ${schema.multipleOf}`,
              path: ['example']
            });
          }
        }
      }
    }
    
    // Validate string examples
    if (schema.example !== undefined && schema.type === 'string') {
      if (typeof schema.example !== 'string') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Example value must be a string for string type schemas`,
          path: ['example']
        });
      } else {
        // Validate minLength constraint if provided
        if (typeof schema.minLength === 'number' && schema.example.length < schema.minLength) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Example string length ${schema.example.length} is less than minLength ${schema.minLength}`,
            path: ['example']
          });
        }
        
        // Validate maxLength constraint if provided
        if (typeof schema.maxLength === 'number' && schema.example.length > schema.maxLength) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Example string length ${schema.example.length} is greater than maxLength ${schema.maxLength}`,
            path: ['example']
          });
        }
        
        // Validate pattern constraint if provided
        if (schema.pattern) {
          try {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(schema.example)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Example string "${schema.example}" does not match pattern "${schema.pattern}"`,
                path: ['example']
              });
            }
          } catch (e) {
            // Pattern validation is handled separately
          }
        }
      }
    }
  }).refine((schema: any) => {
    if (schema.example === undefined || (schema.type !== 'number' && schema.type !== 'integer')) return true;
    if (typeof schema.example !== 'number') return false;
    if (typeof schema.minimum === 'number') {
      return schema.exclusiveMinimum ? (schema.example > schema.minimum) : (schema.example >= schema.minimum);
    }
    return true;
  }, { message: "Example value does not satisfy the minimum constraint", path: ['example'] })
  .refine((schema: any) => {
    if (schema.example === undefined || (schema.type !== 'number' && schema.type !== 'integer')) return true;
    if (typeof schema.example !== 'number') return false;
    if (typeof schema.maximum === 'number') {
      return schema.exclusiveMaximum ? (schema.example < schema.maximum) : (schema.example <= schema.maximum);
    }
    return true;
  }, { message: "Example value does not satisfy the maximum constraint", path: ['example'] })
  .refine((schema: any) => {
    if (schema.example === undefined || (schema.type !== 'number' && schema.type !== 'integer')) return true;
    if (typeof schema.example !== 'number') return false;
    if (typeof schema.multipleOf === 'number') {
      const quotient = schema.example / schema.multipleOf;
      const tolerance = 1e-8;
      return Math.abs(quotient - Math.round(quotient)) <= tolerance;
    }
    return true;
  }, { message: "Example value is not a multiple of the specified factor", path: ['example'] })
  .refine((schema: any) => {
    if (schema.example === undefined || schema.type !== 'string') return true;
    if (typeof schema.example !== 'string') return false;
    if (typeof schema.minLength === 'number') {
      return schema.example.length >= schema.minLength;
    }
    return true;
  }, { message: "Example string does not satisfy the minLength constraint", path: ['example'] })
  .refine((schema: any) => {
    if (schema.example === undefined || schema.type !== 'string') return true;
    if (typeof schema.example !== 'string') return false;
    if (typeof schema.maxLength === 'number') {
      return schema.example.length <= schema.maxLength;
    }
    return true;
  }, { message: "Example string does not satisfy the maxLength constraint", path: ['example'] })
  .refine((schema: any) => {
    if (schema.example === undefined || schema.type !== 'string') return true;
    if (typeof schema.example !== 'string') return false;
    if (schema.pattern) {
      try {
        const regex = new RegExp(schema.pattern);
        return regex.test(schema.example);
      } catch (e) {
        return false;
      }
    }
    return true;
  }, { message: "Example string does not match the specified pattern", path: ['example'] });
});

// Basic extensible object that allows any additional properties
export const ExtensibleObject = z.object({}).passthrough();

// Strict vendor extension validation with better error messages
export const VendorExtensible = z.object({}).catchall(z.unknown()).refine((val) => {
  const extraKeys = Object.keys(val).filter(key => !key.startsWith('x-'));
  return extraKeys.length === 0;
}, {
  message: 'Custom extensions must start with x-. For example: x-custom-field'
});
