import { z } from 'zod';
import { validateNumericFormat } from './numeric-formats.js';
import { memoize } from '../utils/memoize.js';
import { ReferenceObject } from './reference.js';

// Re-export ReferenceObject for backward compatibility
export { ReferenceObject };

// Retain known format lists for type-compat checks only
const KNOWN_STRING_FORMATS = [
  'date-time',
  'date',
  'time',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uri',
  'uuid',
  'password',
  'byte',
  'binary',
] as const;

const KNOWN_NUMERIC_FORMATS = ['int32', 'int64', 'float', 'double'] as const;

// Helper function to get parent type from context
export function getParentType(ctx: z.RefinementCtx): string | undefined {
  const parent = (ctx as any).parent;
  return parent ? parent.type : undefined;
}

// Helper to retrieve the root schema type from the refinement context
export function _getRootType(ctx: any): string | undefined {
  if (ctx.parent && typeof ctx.parent === 'object' && ctx.parent.type) {
    return ctx.parent.type;
  }
  if (ctx.data && typeof ctx.data === 'object' && 'type' in ctx.data) {
    return ctx.data.type;
  }
  if (
    ctx.options &&
    (ctx.options as any).data &&
    (ctx.options as any).data.type
  ) {
    return (ctx.options as any).data.type;
  }
  return undefined;
}

/**
 * Memoized version of getRootType
 * Uses a custom key function that extracts relevant properties for caching
 */
export const getRootType = memoize(_getRootType, {
  maxSize: 200,
  keyFn: (ctx) => {
    // Extract only the properties needed to determine the type
    const parentType = ctx.parent?.type;
    const dataType = ctx.data?.type;
    const optionsType = ctx.options?.data?.type;

    return JSON.stringify({
      parentType,
      dataType,
      optionsType,
    });
  },
});

// Improved schema object with more specific types and better error messages
export const SchemaObject: z.ZodType = z.lazy(() => {
  // Preprocessor to select ReferenceObject if $ref exists, stripping extraneous keys
  const SchemaOrRef = z.preprocess(
    (data) => {
      if (typeof data === 'object' && data !== null && '$ref' in data) {
        return { $ref: (data as any).$ref };
      }
      return data;
    },
    z.union([z.lazy(() => SchemaObject), ReferenceObject])
  );
  const baseSchema = z
    .object({
      // Type is optional when using composition keywords (anyOf, oneOf, allOf)
      type: z
        .enum(['string', 'number', 'integer', 'boolean', 'array', 'object'])
        .optional(),
      // Composition keywords (OAS 3.0 supports these per JSON Schema draft-04)
      anyOf: z.array(SchemaOrRef).optional(),
      oneOf: z.array(SchemaOrRef).optional(),
      allOf: z.array(SchemaOrRef).optional(),
      not: SchemaOrRef.optional(),
      // Allow any string for format per OAS (open value), but keep type checks for known formats
      format: z
        .string()
        .optional()
        .superRefine((format, ctx) => {
          if (!format) return;
          const currentPath = Array.isArray((ctx as any).path)
            ? ((ctx as any).path as (string | number)[])
            : [];
          if (currentPath.filter((key) => key === 'format').length > 1) return;
          if (typeof (ctx as any).parent !== 'object') return;
          const type = getRootType(ctx);
          if (type !== undefined) {
            if (
              (KNOWN_NUMERIC_FORMATS as readonly string[]).includes(format) &&
              type !== 'number' &&
              type !== 'integer'
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Format '${format}' can only be used with numeric types (number, integer)`,
                path: ['format'],
              });
            }
            if (
              (KNOWN_STRING_FORMATS as readonly string[]).includes(format) &&
              type !== 'string'
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Format '${format}' can only be used with string type`,
                path: ['format'],
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
      minLength: z
        .number()
        .int()
        .positive()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type === undefined) return;
          if (type !== 'string') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'minLength can only be used with string type',
              path: ['minLength'],
            });
          }
        }),
      maxLength: z
        .number()
        .int()
        .positive()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type === undefined) return;
          if (type !== 'string') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'maxLength can only be used with string type',
              path: ['maxLength'],
            });
          }
        }),
      pattern: z
        .string()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type === undefined) return;
          if (type !== 'string') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'pattern can only be used with string type',
              path: ['pattern'],
            });
          } else {
            if (val !== undefined) {
              try {
                new RegExp(val);
              } catch {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Invalid regular expression pattern',
                  path: ['pattern'],
                });
              }
            }
          }
        }),
      minimum: z
        .number()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type && !['number', 'integer'].includes(type)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'minimum can only be used with numeric types (number, integer)',
              path: ['minimum'],
            });
          }
        }),
      maximum: z
        .number()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type && !['number', 'integer'].includes(type)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'maximum can only be used with numeric types (number, integer)',
              path: ['maximum'],
            });
          }
        }),
      exclusiveMinimum: z
        .boolean()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type && !['number', 'integer'].includes(type)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'exclusiveMinimum can only be used with numeric types (number, integer)',
              path: ['exclusiveMinimum'],
            });
          }
        }),
      exclusiveMaximum: z
        .boolean()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type && !['number', 'integer'].includes(type)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'exclusiveMaximum can only be used with numeric types (number, integer)',
              path: ['exclusiveMaximum'],
            });
          }
        }),
      multipleOf: z
        .number()
        .positive()
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type && !['number', 'integer'].includes(type)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'multipleOf can only be used with numeric types (number, integer)',
              path: ['multipleOf'],
            });
          }
        }),
      enum: z.array(z.unknown()).optional(),
      required: z
        .array(z.string())
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type === undefined) return;
          if (type !== 'object') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'required can only be used with object type',
              path: ['required'],
            });
          }
        }),
      properties: z
        .record(z.string(), SchemaOrRef)
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type === undefined) return;
          if (type !== 'object') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'properties can only be used with object type',
              path: ['properties'],
            });
          }
        }),
      items: SchemaOrRef.optional().superRefine((val, ctx) => {
        const type = getRootType(ctx);
        if (type === undefined) return;
        if (type !== 'array') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'items can only be used with array type',
            path: ['items'],
          });
        }
      }),
      additionalProperties: z
        .union([z.boolean(), SchemaOrRef])
        .optional()
        .superRefine((val, ctx) => {
          const type = getRootType(ctx);
          if (type === undefined) return;
          if (type !== 'object') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'additionalProperties can only be used with object type',
              path: ['additionalProperties'],
            });
          }
        }),
    })
    .passthrough();

  return (
    z
      .preprocess((raw) => {
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
            'description',
            // Composition keywords (valid in OAS 3.0 Schema Object)
            'anyOf',
            'oneOf',
            'allOf',
            'not',
          ]);

          // Type-specific properties
          const stringProps = new Set(['minLength', 'maxLength', 'pattern']);
          const numericProps = new Set([
            'minimum',
            'maximum',
            'exclusiveMinimum',
            'exclusiveMaximum',
            'multipleOf',
          ]);
          const arrayProps = new Set(['items']);
          const objectProps = new Set([
            'properties',
            'additionalProperties',
            'required',
          ]);

          const allowedProps = new Set([...commonProps]);

          // Add type-specific properties
          if (typeVal === 'string') {
            stringProps.forEach((prop) => allowedProps.add(prop));
          } else if (typeVal === 'number' || typeVal === 'integer') {
            numericProps.forEach((prop) => allowedProps.add(prop));
          } else if (typeVal === 'array') {
            arrayProps.forEach((prop) => allowedProps.add(prop));
          } else if (typeVal === 'object') {
            objectProps.forEach((prop) => allowedProps.add(prop));
          }

          // Return only the allowed properties for this type
          return Object.fromEntries(
            Object.entries(raw).filter(
              ([key]) => allowedProps.has(key) || key.startsWith('x-')
            )
          );
        }
        return raw;
      }, baseSchema)
      .superRefine((schema, ctx) => {
        const fastMode = Boolean((ctx as any)?.options?.data?.fastMode);
        const skipExamples =
          Boolean((ctx as any)?.options?.data?.skipExamples) || fastMode;
        const skipPatternChecks =
          Boolean((ctx as any)?.options?.data?.skipPatternChecks) || fastMode;

        // Check if this is a composition-only schema (no type, uses anyOf/oneOf/allOf/not)
        // Empty arrays don't count as valid composition per OpenAPI/JSON Schema spec
        const hasComposition =
          (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) ||
          (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) ||
          (Array.isArray(schema.allOf) && schema.allOf.length > 0) ||
          schema.not;

        // Per OpenAPI 3.x / JSON Schema: type can be inferred from context (no ERR_005)
        const hasImplicitObject =
          (typeof schema.properties === 'object' &&
            schema.properties !== null) ||
          schema.additionalProperties !== undefined ||
          (typeof (schema as { patternProperties?: unknown })
            .patternProperties === 'object' &&
            (schema as { patternProperties?: object }).patternProperties !==
              null) ||
          (Array.isArray(schema.required) && schema.required.length > 0);
        const hasImplicitArray = schema.items !== undefined;

        // Schema must have either type, composition, or inferrable type from keywords
        if (
          !schema.type &&
          !hasComposition &&
          !hasImplicitObject &&
          !hasImplicitArray
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Schema must define either a type or use composition keywords (anyOf, oneOf, allOf, not)',
            path: ['type'],
          });
        }

        // Skip structural validations (items/properties) when composition keywords are present
        // These may be defined within the composed schemas
        // But continue with type-based validations (format, example) if type is present
        if (!schema.type) {
          return;
        }

        // Structural validations - skip when composition keywords present
        if (!hasComposition) {
          // Validate that array types have items (only when no composition)
          if (schema.type === 'array' && !schema.items) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Array types must define items',
              path: ['items'],
            });
          }
          // Validate that object types have properties or additionalProperties (only when no composition)
          if (
            schema.type === 'object' &&
            !schema.properties &&
            !schema.additionalProperties
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'Object types must define either properties or additionalProperties',
              path: ['properties'],
            });
          }
        }

        // Type-based validations below run regardless of composition
        // Additional numeric format validation
        if (
          schema.format &&
          ['int32', 'int64', 'float', 'double'].includes(schema.format)
        ) {
          if (schema.type !== 'number' && schema.type !== 'integer') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Format '${schema.format}' can only be used with numeric types (number, integer)`,
              path: ['format'],
            });
          }
        }
        // New check: Validate the 'example' value if present for numeric formats
        if (
          schema.example !== undefined &&
          schema.format &&
          ['int32', 'int64', 'float', 'double'].includes(schema.format)
        ) {
          if (
            typeof schema.example !== 'number' ||
            !validateNumericFormat(schema.format, schema.example)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Example value ${schema.example} does not conform to the ${schema.format} format`,
              path: ['example'],
            });
          } else {
            // Validate minimum constraint if provided
            if (typeof schema.minimum === 'number') {
              if (
                schema.exclusiveMinimum
                  ? !(schema.example > schema.minimum)
                  : !(schema.example >= schema.minimum)
              ) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Example value ${schema.example} must be ${schema.exclusiveMinimum ? 'greater than' : 'greater than or equal to'} ${schema.minimum}`,
                  path: ['example'],
                });
              }
            }
            // Validate maximum constraint if provided
            if (typeof schema.maximum === 'number') {
              if (
                schema.exclusiveMaximum
                  ? !(schema.example < schema.maximum)
                  : !(schema.example <= schema.maximum)
              ) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Example value ${schema.example} must be ${schema.exclusiveMaximum ? 'less than' : 'less than or equal to'} ${schema.maximum}`,
                  path: ['example'],
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
                  path: ['example'],
                });
              }
            }
          }
        }

        // Validate string examples (skip in fast mode if configured)
        if (
          !skipExamples &&
          schema.example !== undefined &&
          schema.type === 'string'
        ) {
          if (typeof schema.example !== 'string') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Example value must be a string for string type schemas`,
              path: ['example'],
            });
          } else {
            // Validate minLength constraint if provided
            if (
              typeof schema.minLength === 'number' &&
              schema.example.length < schema.minLength
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Example string length ${schema.example.length} is less than minLength ${schema.minLength}`,
                path: ['example'],
              });
            }

            // Validate maxLength constraint if provided
            if (
              typeof schema.maxLength === 'number' &&
              schema.example.length > schema.maxLength
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Example string length ${schema.example.length} is greater than maxLength ${schema.maxLength}`,
                path: ['example'],
              });
            }

            // Validate pattern constraint if provided (skip pattern checks if configured)
            if (!skipPatternChecks && schema.pattern) {
              try {
                const regex = new RegExp(schema.pattern);
                if (!regex.test(schema.example)) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Example string "${schema.example}" does not match pattern "${schema.pattern}"`,
                    path: ['example'],
                  });
                }
              } catch {
                // Pattern validation is handled separately - ignore error here
              }
            }
          }
        }
      })
      // Additional example-related constraints moved from brittle refine() to superRefine
      .superRefine((schema: any, ctx) => {
        const fastMode = Boolean((ctx as any)?.options?.data?.fastMode);
        const skipExamples = fastMode;
        const skipPatternChecks =
          Boolean((ctx as any)?.options?.data?.skipPatternChecks) || fastMode;

        // Number/integer example minimum
        if (
          !skipExamples &&
          schema.example !== undefined &&
          (schema.type === 'number' || schema.type === 'integer') &&
          typeof schema.minimum === 'number' &&
          typeof schema.example === 'number'
        ) {
          const ok = schema.exclusiveMinimum
            ? schema.example > schema.minimum
            : schema.example >= schema.minimum;
          if (!ok) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['example'],
              message: 'Example value does not satisfy the minimum constraint',
            });
          }
        }

        // Number/integer example maximum
        if (
          !skipExamples &&
          schema.example !== undefined &&
          (schema.type === 'number' || schema.type === 'integer') &&
          typeof schema.maximum === 'number' &&
          typeof schema.example === 'number'
        ) {
          const ok = schema.exclusiveMaximum
            ? schema.example < schema.maximum
            : schema.example <= schema.maximum;
          if (!ok) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['example'],
              message: 'Example value does not satisfy the maximum constraint',
            });
          }
        }

        // Number/integer example multipleOf
        if (
          !skipExamples &&
          schema.example !== undefined &&
          (schema.type === 'number' || schema.type === 'integer') &&
          typeof schema.multipleOf === 'number' &&
          typeof schema.example === 'number'
        ) {
          const quotient = schema.example / schema.multipleOf;
          const tolerance = 1e-8;
          if (Math.abs(quotient - Math.round(quotient)) > tolerance) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['example'],
              message:
                'Example value is not a multiple of the specified factor',
            });
          }
        }

        // String example length/pattern
        if (
          !skipExamples &&
          schema.example !== undefined &&
          schema.type === 'string'
        ) {
          if (typeof schema.example !== 'string') {
            // base check already exists above, keep behaviour consistent
          } else {
            if (
              typeof schema.minLength === 'number' &&
              schema.example.length < schema.minLength
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['example'],
                message:
                  'Example string does not satisfy the minLength constraint',
              });
            }
            if (
              typeof schema.maxLength === 'number' &&
              schema.example.length > schema.maxLength
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['example'],
                message:
                  'Example string does not satisfy the maxLength constraint',
              });
            }
            if (!skipPatternChecks && schema.pattern) {
              try {
                const regex = new RegExp(schema.pattern);
                if (!regex.test(schema.example)) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['example'],
                    message:
                      'Example string does not match the specified pattern',
                  });
                }
              } catch {
                // If pattern itself is invalid, report it here as well
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: ['pattern'],
                  message: 'Invalid regular expression pattern',
                });
              }
            }
          }
        }
      })
  );
});

// OpenAPI 3.1 / JSON Schema 2020-12 compatible SchemaObject
// - Supports type as string or array of strings
// - Supports composition keywords (oneOf, anyOf, allOf, not)
// - Does NOT enforce array items or object properties/additionalProperties
export const SchemaObject31: z.ZodType = z.lazy(() => {
  const BaseType = z.enum([
    'string',
    'number',
    'integer',
    'boolean',
    'array',
    'object',
  ]);

  // ReferenceObject from this module already validates generic component/path refs
  const SchemaOrRef31: z.ZodType = z.union([
    z.lazy(() => SchemaObject31),
    ReferenceObject,
  ]);

  return z
    .object({
      // 3.1 allows type arrays and type to be omitted
      type: z.union([BaseType, z.array(BaseType)]).optional(),
      format: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      default: z.unknown().optional(),
      nullable: z.boolean().optional(),
      deprecated: z.boolean().optional(),
      example: z.unknown().optional(),
      enum: z.array(z.unknown()).optional(),

      // Composition keywords
      oneOf: z.array(SchemaOrRef31).optional(),
      anyOf: z.array(SchemaOrRef31).optional(),
      allOf: z.array(SchemaOrRef31).optional(),
      not: SchemaOrRef31.optional(),

      // Structural keywords (relaxed compared to 3.0 rules)
      items: z.union([SchemaOrRef31, z.array(SchemaOrRef31)]).optional(),
      properties: z.record(z.string(), SchemaOrRef31).optional(),
      additionalProperties: z.union([z.boolean(), SchemaOrRef31]).optional(),
      required: z.array(z.string()).optional(),
      // Leave other JSON Schema keywords open via passthrough
    })
    .passthrough();
});

// Basic extensible object that allows any additional properties
export const ExtensibleObject = z.object({}).passthrough();

// Strict vendor extension validation with better error messages
export const VendorExtensible = z
  .object({})
  .catchall(z.unknown())
  .refine(
    (val) => {
      const extraKeys = Object.keys(val).filter((key) => !key.startsWith('x-'));
      return extraKeys.length === 0;
    },
    {
      message:
        'Custom extensions must start with x-. For example: x-custom-field',
    }
  );
