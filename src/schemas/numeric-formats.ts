import { z } from 'zod';
import { memoize } from '../utils/memoize.js';

// Constants for numeric format validation
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
const INT64_MIN = Number.MIN_SAFE_INTEGER;
const INT64_MAX = Number.MAX_SAFE_INTEGER;

// Helper function to check if a number is an integer
const isInteger = (n: number): boolean => Number.isInteger(n);

// Helper function to check if a number is within int32 range
const isInt32 = (n: number): boolean => isInteger(n) && n >= INT32_MIN && n <= INT32_MAX;

// Helper function to check if a number is within int64 range
const isInt64 = (n: number): boolean => isInteger(n) && n >= INT64_MIN && n <= INT64_MAX;

// Helper function to check if a number is a valid float
const isFloat = (n: number): boolean => {
  // Check for finiteness and ensure it's not NaN
  return Number.isFinite(n) && !Number.isNaN(n);
};

// Helper function to check if a number is a valid double
const isDouble = (n: number): boolean => {
  // Double validation same as float in JavaScript as both are 64-bit
  // but kept separate for compatibility with OpenAPI
  return Number.isFinite(n) && !Number.isNaN(n);
};

// Helper function to check if a number is a multiple of another with floating-point precision
export function isMultipleOf(value: number, multipleOf: number): boolean {
  if (multipleOf === 0) return false;
  const quotient = value / multipleOf;
  const tolerance = 1e-10; // Small tolerance to handle floating-point imprecisions
  return Math.abs(quotient - Math.round(quotient)) <= tolerance;
}

// Enhanced numeric format validation
export const validateNumericFormat = (format: string | undefined, value: number): boolean => {
  switch (format) {
    case 'int32':
      return isInt32(value);
    case 'int64':
      return isInt64(value);
    case 'float':
      return isFloat(value);
    case 'double':
      return isDouble(value);
    default:
      return true; // No format specified
  }
};

// Zod schema for numeric format validation
export const _createNumericSchema = (format: string | undefined) => {
  let schema;
  
  // Create a base preprocessor that safely converts values to numbers
  const preprocessor = (val: unknown) => safeParseNumeric(val);
  
  switch (format) {
    case 'int32':
      schema = z.preprocess(
        preprocessor, 
        z.number()
          .int({ message: NumericValidationErrors.integer })
          .min(INT32_MIN, { message: NumericValidationErrors.int32Range })
          .max(INT32_MAX, { message: NumericValidationErrors.int32Range })
          .describe('32-bit integer')
      );
      break;
    case 'int64':
      schema = z.preprocess(
        preprocessor, 
        z.number()
          .int({ message: NumericValidationErrors.integer })
          .min(INT64_MIN, { message: NumericValidationErrors.int64Range })
          .max(INT64_MAX, { message: NumericValidationErrors.int64Range })
          .describe('64-bit integer')
      );
      break;
    case 'float':
      schema = z.preprocess(
        preprocessor, 
        z.number()
          .refine(
            (n) => Number.isFinite(n), 
            { message: NumericValidationErrors.float }
          )
          .describe('32-bit floating-point')
      );
      break;
    case 'double':
      schema = z.preprocess(
        preprocessor, 
        z.number()
          .refine(
            (n) => Number.isFinite(n), 
            { message: NumericValidationErrors.double }
          )
          .describe('64-bit floating-point')
      );
      break;
    default:
      schema = z.preprocess(preprocessor, z.number());
      break;
  }
  
  // Add a custom refinement to validate the format
  return schema.superRefine((value, ctx) => {
    createNumericValidator(format)(ctx, value);
  });
};

/**
 * Creates a Zod schema for numeric validation based on the format
 * This function is memoized for performance
 */
export const createNumericSchema = memoize(_createNumericSchema, {
  maxSize: 10, // Only a few formats exist
  keyFn: (format) => String(format)
});

// Type-safe numeric format validator
export const createNumericValidator = (format: string | undefined) => {
  return (ctx: z.RefinementCtx, value: number) => {
    if (!validateNumericFormat(format, value)) {
      let message = `Invalid ${format || 'number'} format`;
      let path: (string | number)[] = [];
      
      // Determine the appropriate error message and path
      if (format === 'int32') {
        message = NumericValidationErrors.int32Range;
        path = ctx.path.length ? ctx.path : ['format'];
      } else if (format === 'int64') {
        message = NumericValidationErrors.int64Range;
        path = ctx.path.length ? ctx.path : ['format'];
      } else if (format === 'float') {
        message = NumericValidationErrors.float;
        path = ctx.path.length ? ctx.path : ['format'];
      } else if (format === 'double') {
        message = NumericValidationErrors.double;
        path = ctx.path.length ? ctx.path : ['format'];
      } else {
        path = ctx.path.length ? ctx.path : ['value'];
      }
      
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path
      });
      return false;
    }
    return true;
  };
};

// Helper function to get numeric format description
export const getNumericFormatDescription = (format: string | undefined): string => {
  switch (format) {
    case 'int32':
      return `32-bit integer (range: ${INT32_MIN} to ${INT32_MAX})`;
    case 'int64':
      return `64-bit integer (range: ${INT64_MIN} to ${INT64_MAX})`;
    case 'float':
      return '32-bit floating-point number';
    case 'double':
      return '64-bit floating-point number';
    default:
      return 'number';
  }
};

// Error messages for numeric validation
export const NumericValidationErrors = {
  int32Range: `Value must be a 32-bit integer (${INT32_MIN} to ${INT32_MAX})`,
  int64Range: `Value must be a 64-bit integer (${INT64_MIN} to ${INT64_MAX})`,
  float: 'Value must be a valid 32-bit floating-point number',
  double: 'Value must be a valid 64-bit floating-point number',
  integer: 'Value must be an integer',
  finite: 'Value must be a finite number'
} as const;

// Type for numeric format options
export type NumericFormatOptions = {
  format?: 'int32' | 'int64' | 'float' | 'double';
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  multipleOf?: number;
};

// Type for validation function
type ValidationFn = (n: number) => boolean | string;

// Create a Zod schema with all numeric validations
export const createNumericSchemaWithValidations = (options: NumericFormatOptions): z.ZodNumber => {
  const { format, minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf } = options;
  
  // Start with base schema for the format
  const baseSchema = createNumericSchema(format);

  // Build validation chain
  const validations: ValidationFn[] = [];

  if (minimum !== undefined) {
    validations.push(exclusiveMinimum
      ? (n: number) => n > minimum || `Value must be greater than ${minimum}`
      : (n: number) => n >= minimum || `Value must be greater than or equal to ${minimum}`
    );
  }

  if (maximum !== undefined) {
    validations.push(exclusiveMaximum
      ? (n: number) => n < maximum || `Value must be less than ${maximum}`
      : (n: number) => n <= maximum || `Value must be less than or equal to ${maximum}`
    );
  }

  if (multipleOf !== undefined) {
    validations.push(
      (n: number) => {
        // Use a more accurate floating-point comparison with tolerance
        return isMultipleOf(n, multipleOf) || `Value must be a multiple of ${multipleOf}`;
      }
    );
  }

  // Apply all validations in a single refinement
  if (validations.length > 0) {
    const validatedSchema = baseSchema.superRefine((n: number, ctx: z.RefinementCtx) => {
      for (const validate of validations) {
        const result = validate(n);
        if (typeof result === 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result
          });
          return z.NEVER;
        }
      }
    });

    // Cast the schema back to ZodNumber while preserving the refinements
    return validatedSchema as unknown as z.ZodNumber;
  }

  return baseSchema as unknown as z.ZodNumber;
};

// Utility function to check if a string represents a valid numeric literal
export const isValidNumericLiteral = (value: string): boolean => {
  if (value === '') return false;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num);
};

// Utility function to safely parse numeric values
// Returns a number if valid, or null to force type validation failure
export const _safeParseNumeric = (value: unknown): number | null => {
  // Only accept actual number values that are finite
  if (typeof value === 'number' && Number.isFinite(value)) {
    // For -0, we want to preserve it exactly as -0 (not convert to 0)
    if (Object.is(value, -0)) {
      return -0;
    }
    return value;
  }
  
  // Strings are not automatically converted to handle type safety requirements
  // This ensures strict validation of types in OpenAPI schemas
  return null;
};

/**
 * Memoized version of safeParseNumeric
 * Performance optimization for numeric parsing
 */
export const safeParseNumeric = memoize(_safeParseNumeric, {
  maxSize: 200,
  // Use a custom key function that handles primitives and complex objects
  keyFn: (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'number') return `num:${value}`;
    if (typeof value === 'string') return `str:${value}`;
    if (typeof value === 'boolean') return `bool:${value}`;
    // For objects, we can just use stringified version (less common case)
    return JSON.stringify(value);
  }
}); 