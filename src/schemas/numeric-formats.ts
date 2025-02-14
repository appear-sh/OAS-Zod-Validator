import { z } from 'zod';

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
const isFloat = (n: number): boolean => Number.isFinite(n) && !Number.isNaN(n);

// Helper function to check if a number is a valid double
const isDouble = (n: number): boolean => Number.isFinite(n) && !Number.isNaN(n);

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
export const createNumericSchema = (format: string | undefined) => {
  const baseSchema = z.number();

  switch (format) {
    case 'int32':
      return baseSchema
        .int()
        .min(INT32_MIN)
        .max(INT32_MAX)
        .describe('32-bit integer');

    case 'int64':
      return baseSchema
        .int()
        .min(INT64_MIN)
        .max(INT64_MAX)
        .describe('64-bit integer');

    case 'float':
      return baseSchema
        .finite()
        .describe('32-bit floating-point');

    case 'double':
      return baseSchema
        .finite()
        .describe('64-bit floating-point');

    default:
      return baseSchema;
  }
};

// Type-safe numeric format validator
export const createNumericValidator = (format: string | undefined) => {
  return (ctx: z.RefinementCtx, value: number) => {
    if (!validateNumericFormat(format, value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid ${format || 'number'} format`,
        path: ['format']
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
      (n: number) => n % multipleOf === 0 || `Value must be a multiple of ${multipleOf}`
    );
  }

  // Apply all validations in a single refinement
  if (validations.length > 0) {
    const validatedSchema = baseSchema.superRefine((n, ctx) => {
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

  return baseSchema;
};

// Utility function to check if a string represents a valid numeric literal
export const isValidNumericLiteral = (value: string): boolean => {
  if (value === '') return false;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num);
};

// Utility function to safely parse numeric values
export const safeParseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && isValidNumericLiteral(value)) return Number(value);
  return null;
}; 