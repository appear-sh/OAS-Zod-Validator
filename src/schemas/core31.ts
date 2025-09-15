import { z } from 'zod';
import { validateNumericFormat } from './numeric-formats.js';
import { memoize } from '../utils/memoize.js';

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

function getTypesSetFromValue(typeVal: unknown): Set<string> | undefined {
  if (Array.isArray(typeVal)) return new Set(typeVal as string[]);
  if (typeof typeVal === 'string') return new Set([typeVal]);
  return undefined;
}

function getRootType(ctx: any): string | string[] | undefined {
  if (ctx.parent && typeof ctx.parent === 'object' && ctx.parent.type) {
    return ctx.parent.type;
  }
  if (ctx.data && typeof ctx.data === 'object' && 'type' in ctx.data) {
    return (ctx.data as any).type;
  }
  if (ctx.options && (ctx.options as any).data && (ctx.options as any).data.type) {
    return (ctx.options as any).data.type;
  }
  return undefined;
}

function hasType(ctx: any, expected: string): boolean {
  const raw = getRootType(ctx);
  const set = getTypesSetFromValue(raw);
  return set ? set.has(expected) : false;
}

export const SchemaObject31: z.ZodType = z.lazy(() => {
  const SchemaOrRef = z.preprocess(
    (data) => {
      if (typeof data === 'object' && data !== null && '$ref' in data) {
        return { $ref: (data as any).$ref };
      }
      return data;
    },
    z.union([z.lazy(() => SchemaObject31), ReferenceObject])
  );

  const base = z
    .object({
      type: z
        .union([
          z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object']),
          z.array(
            z.enum([
              'string',
              'number',
              'integer',
              'boolean',
              'array',
              'object',
              'null',
            ])
          ),
        ])
        .optional(),
      format: z
        .string()
        .optional()
        .superRefine((format, ctx) => {
          if (!format) return;
          const isNumeric = hasType(ctx as any, 'number') || hasType(ctx as any, 'integer');
          const isString = hasType(ctx as any, 'string');
          if ((['int32', 'int64', 'float', 'double'] as const).includes(format as any) && !isNumeric) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Format '${format}' can only be used with numeric types (number, integer)`, path: ['format'] });
          }
          const knownString = ['date-time','date','time','email','hostname','ipv4','ipv6','uri','uuid','password','byte','binary'] as const;
          if ((knownString as readonly string[]).includes(format) && !isString) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Format '${format}' can only be used with string type`, path: ['format'] });
          }
        }),
      title: z.string().optional(),
      description: z.string().optional(),
      default: z.unknown().optional(),
      nullable: z.boolean().optional(),
      deprecated: z.boolean().optional(),
      example: z.unknown().optional(),
      minLength: z.number().int().positive().optional().superRefine((_, ctx) => {
        if (getRootType(ctx as any) === undefined) return;
        if (!hasType(ctx as any, 'string')) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'minLength can only be used with string type', path: ['minLength'] });
      }),
      maxLength: z.number().int().positive().optional().superRefine((_, ctx) => {
        if (getRootType(ctx as any) === undefined) return;
        if (!hasType(ctx as any, 'string')) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'maxLength can only be used with string type', path: ['maxLength'] });
      }),
      pattern: z.string().optional().superRefine((val, ctx) => {
        if (getRootType(ctx as any) === undefined) return;
        if (!hasType(ctx as any, 'string')) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'pattern can only be used with string type', path: ['pattern'] });
        } else if (val !== undefined) {
          try { new RegExp(val); } catch { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid regular expression pattern', path: ['pattern'] }); }
        }
      }),
      minimum: z.number().optional().superRefine((_, ctx) => {
        const hasNum = hasType(ctx as any, 'number') || hasType(ctx as any, 'integer');
        if (!hasNum && getRootType(ctx as any) !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'minimum can only be used with numeric types (number, integer)', path: ['minimum'] });
      }),
      maximum: z.number().optional().superRefine((_, ctx) => {
        const hasNum = hasType(ctx as any, 'number') || hasType(ctx as any, 'integer');
        if (!hasNum && getRootType(ctx as any) !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'maximum can only be used with numeric types (number, integer)', path: ['maximum'] });
      }),
      exclusiveMinimum: z.boolean().optional().superRefine((_, ctx) => {
        const hasNum = hasType(ctx as any, 'number') || hasType(ctx as any, 'integer');
        if (!hasNum && getRootType(ctx as any) !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'exclusiveMinimum can only be used with numeric types (number, integer)', path: ['exclusiveMinimum'] });
      }),
      exclusiveMaximum: z.boolean().optional().superRefine((_, ctx) => {
        const hasNum = hasType(ctx as any, 'number') || hasType(ctx as any, 'integer');
        if (!hasNum && getRootType(ctx as any) !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'exclusiveMaximum can only be used with numeric types (number, integer)', path: ['exclusiveMaximum'] });
      }),
      multipleOf: z.number().positive().optional().superRefine((_, ctx) => {
        const hasNum = hasType(ctx as any, 'number') || hasType(ctx as any, 'integer');
        if (!hasNum && getRootType(ctx as any) !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'multipleOf can only be used with numeric types (number, integer)', path: ['multipleOf'] });
      }),
      enum: z.array(z.unknown()).optional(),
      required: z.array(z.string()).optional().superRefine((_, ctx) => {
        if (getRootType(ctx as any) === undefined) return;
        if (!hasType(ctx as any, 'object')) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'required can only be used with object type', path: ['required'] });
      }),
      properties: z.record(z.string(), SchemaOrRef).optional().superRefine((_, ctx) => {
        if (getRootType(ctx as any) === undefined) return;
        if (!hasType(ctx as any, 'object')) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'properties can only be used with object type', path: ['properties'] });
      }),
      items: SchemaOrRef.optional().superRefine((_, ctx) => {
        if (getRootType(ctx as any) === undefined) return;
        if (!hasType(ctx as any, 'array')) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'items can only be used with array type', path: ['items'] });
      }),
      additionalProperties: z.union([z.boolean(), SchemaOrRef]).optional().superRefine((_, ctx) => {
        if (getRootType(ctx as any) === undefined) return;
        if (!hasType(ctx as any, 'object')) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'additionalProperties can only be used with object type', path: ['additionalProperties'] });
      }),
      oneOf: z.array(SchemaOrRef).min(1).optional(),
      anyOf: z.array(SchemaOrRef).min(1).optional(),
      allOf: z.array(SchemaOrRef).min(1).optional(),
      not: SchemaOrRef.optional(),
    })
    .passthrough();

  return (
    z
      .preprocess((raw) => {
        if (raw && typeof raw === 'object' && 'type' in raw) {
          const typeVal = (raw as any).type;
          const common = new Set([
            'type',
            'format',
            'default',
            'nullable',
            'deprecated',
            'example',
            'enum',
            'title',
            'description',
            'oneOf',
            'anyOf',
            'allOf',
            'not',
          ]);
          const stringProps = new Set(['minLength', 'maxLength', 'pattern']);
          const numericProps = new Set(['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']);
          const arrayProps = new Set(['items']);
          const objectProps = new Set(['properties', 'additionalProperties', 'required']);
          const allowed = new Set([...common]);
          const addByType = (t: string) => {
            if (t === 'string') stringProps.forEach((p) => allowed.add(p));
            if (t === 'number' || t === 'integer') numericProps.forEach((p) => allowed.add(p));
            if (t === 'array') arrayProps.forEach((p) => allowed.add(p));
            if (t === 'object') objectProps.forEach((p) => allowed.add(p));
          };
          if (Array.isArray(typeVal)) for (const t of typeVal) addByType(t);
          else if (typeof typeVal === 'string') addByType(typeVal);
          return Object.fromEntries(Object.entries(raw).filter(([k]) => allowed.has(k) || k.startsWith('x-')));
        }
        return raw;
      }, base)
      .superRefine((schema, ctx) => {
        const isArrayOnly = Array.isArray(schema.type) ? schema.type.length === 1 && schema.type[0] === 'array' : schema.type === 'array';
        const hasNumericType = Array.isArray(schema.type) ? schema.type.includes('number') || schema.type.includes('integer') : schema.type === 'number' || schema.type === 'integer';
        if (isArrayOnly && !schema.items) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Array types must define items', path: ['items'] });
        }
        if (schema.format && ['int32', 'int64', 'float', 'double'].includes(schema.format)) {
          if (!hasNumericType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Format '${schema.format}' can only be used with numeric types (number, integer)`, path: ['format'] });
        }
        if (schema.example !== undefined && schema.format && ['int32','int64','float','double'].includes(schema.format)) {
          if (typeof schema.example !== 'number' || !validateNumericFormat(schema.format, schema.example)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Example value ${schema.example} does not conform to the ${schema.format} format`, path: ['example'] });
          }
        }
      })
  );
});


