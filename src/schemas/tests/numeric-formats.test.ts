import { validateOpenAPI } from '../../index.js';
import { z } from 'zod';
import { getNumericFormatDescription, isValidNumericLiteral, safeParseNumeric, createNumericSchema, validateNumericFormat, createNumericSchemaWithValidations } from '../numeric-formats.js';

describe('Numeric Format Validation', () => {
  describe('Integer Formats', () => {
    const createIntegerSchema = (format?: string) => ({
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          TestInteger: {
            type: 'integer',
            format,
          }
        }
      }
    });

    test('validates int32 format', () => {
      const spec = createIntegerSchema('int32');
      const maxInt32 = 2147483647;
      const minInt32 = -2147483648;

      // Valid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestInteger: {
              type: 'integer',
              format: 'int32',
              example: maxInt32
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestInteger: {
              type: 'integer',
              format: 'int32',
              example: minInt32
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      // Invalid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestInteger: {
              type: 'integer',
              format: 'int32',
              example: maxInt32 + 1
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));

      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestInteger: {
              type: 'integer',
              format: 'int32',
              example: minInt32 - 1
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));
    });

    test('validates int64 format', () => {
      const spec = createIntegerSchema('int64');
      const maxInt64 = Number.MAX_SAFE_INTEGER;
      const minInt64 = Number.MIN_SAFE_INTEGER;

      // Valid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestInteger: {
              type: 'integer',
              format: 'int64',
              example: maxInt64
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestInteger: {
              type: 'integer',
              format: 'int64',
              example: minInt64
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      // Invalid cases - beyond safe integer range
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestInteger: {
              type: 'integer',
              format: 'int64',
              example: '9223372036854775808' // Beyond MAX_SAFE_INTEGER
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));
    });
  });

  describe('Number Formats', () => {
    const createNumberSchema = (format?: string) => ({
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          TestNumber: {
            type: 'number',
            format,
          }
        }
      }
    });

    test('validates float format', () => {
      const spec = createNumberSchema('float');

      // Valid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'float',
              example: 3.14
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'float',
              example: -3.14e38
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      // Invalid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'float',
              example: '3.14' // String instead of number
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));
    });

    test('validates double format', () => {
      const spec = createNumberSchema('double');

      // Valid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              example: 3.141592653589793
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              example: -2.2250738585072014e-308
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: true }));

      // Invalid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              example: '3.141592653589793' // String instead of number
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));
    });
  });

  describe('Complex Numeric Validation', () => {
    test('validates numeric constraints', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              minimum: 0,
              maximum: 100,
              multipleOf: 0.5,
              example: 99.5
            }
          }
        }
      };

      // Valid case
      expect(validateOpenAPI(spec)).toEqual(expect.objectContaining({ valid: true }));

      // Invalid cases
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              minimum: 0,
              maximum: 100,
              multipleOf: 0.5,
              example: 100.1 // Beyond maximum
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));

      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              minimum: 0,
              maximum: 100,
              multipleOf: 0.5,
              example: 99.7 // Not a multiple of 0.5
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));
    });

    test('validates exclusive ranges', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              exclusiveMinimum: true,
              minimum: 0,
              exclusiveMaximum: true,
              maximum: 100,
              example: 50
            }
          }
        }
      };

      // Valid case
      expect(validateOpenAPI(spec)).toEqual(expect.objectContaining({ valid: true }));

      // Invalid cases - boundary values
      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              exclusiveMinimum: true,
              minimum: 0,
              exclusiveMaximum: true,
              maximum: 100,
              example: 0 // Equal to minimum (exclusive)
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));

      expect(validateOpenAPI({
        ...spec,
        components: {
          schemas: {
            TestNumber: {
              type: 'number',
              format: 'double',
              exclusiveMinimum: true,
              minimum: 0,
              exclusiveMaximum: true,
              maximum: 100,
              example: 100 // Equal to maximum (exclusive)
            }
          }
        }
      })).toEqual(expect.objectContaining({ valid: false }));
    });
  });
});

describe('Numeric Utilities', () => {
  test('getNumericFormatDescription returns correct description for int32', () => {
    const desc = getNumericFormatDescription('int32');
    expect(desc).toBe('32-bit integer (range: -2147483648 to 2147483647)');
  });

  test('isValidNumericLiteral returns true for valid number strings', () => {
    expect(isValidNumericLiteral('123')).toBe(true);
    expect(isValidNumericLiteral('3.14')).toBe(true);
  });

  test('isValidNumericLiteral returns false for non numeric strings', () => {
    expect(isValidNumericLiteral('abc')).toBe(false);
    expect(isValidNumericLiteral('')).toBe(false);
  });

  test('safeParseNumeric returns number for valid numeric value', () => {
    expect(safeParseNumeric(42)).toBe(42);
  });

  test('safeParseNumeric returns null for invalid values', () => {
    expect(safeParseNumeric("42")).toBe(null);
    expect(safeParseNumeric(null)).toBe(null);
  });
});

describe('Numeric Schema with Additional Validations', () => {
  test('validates number within min and max for int32', () => {
    const schema = createNumericSchemaWithValidations({ format: 'int32', minimum: 10, maximum: 100 });
    expect(schema.safeParse(50).success).toBe(true);
  });

  test('rejects number below minimum for int32', () => {
    const schema = createNumericSchemaWithValidations({ format: 'int32', minimum: 10, maximum: 100 });
    expect(schema.safeParse(5).success).toBe(false);
  });

  test('rejects number above maximum for int32', () => {
    const schema = createNumericSchemaWithValidations({ format: 'int32', minimum: 10, maximum: 100 });
    expect(schema.safeParse(150).success).toBe(false);
  });

  test('validates multipleOf constraint', () => {
    const schema = createNumericSchemaWithValidations({ format: 'int32', multipleOf: 5 });
    expect(schema.safeParse(25).success).toBe(true);
    expect(schema.safeParse(26).success).toBe(false);
  });
});

describe('Direct Numeric Format Validation', () => {
  test('returns true for valid int32', () => {
    expect(validateNumericFormat('int32', 100)).toBe(true);
  });
  test('returns false for invalid int32', () => {
    expect(validateNumericFormat('int32', 2147483648)).toBe(false);
  });
  test('returns false for invalid int64', () => {
    expect(validateNumericFormat('int64', Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });
  test('returns false for float with Infinity', () => {
    expect(validateNumericFormat('float', Infinity)).toBe(false);
  });
  test('returns false for double with NaN', () => {
    expect(validateNumericFormat('double', NaN)).toBe(false);
  });
  test('returns true for undefined format', () => {
    expect(validateNumericFormat(undefined, 100)).toBe(true);
  });
});

describe('Get Numeric Format Description', () => {
  test('int64 description', () => {
    const desc = getNumericFormatDescription('int64');
    expect(desc).toBe(`64-bit integer (range: ${Number.MIN_SAFE_INTEGER} to ${Number.MAX_SAFE_INTEGER})`);
  });
  test('float description', () => {
    const desc = getNumericFormatDescription('float');
    expect(desc).toBe('32-bit floating-point number');
  });
  test('double description', () => {
    const desc = getNumericFormatDescription('double');
    expect(desc).toBe('64-bit floating-point number');
  });
  test('returns "number" for unknown format', () => {
    const desc = getNumericFormatDescription('unknown');
    expect(desc).toBe('number');
  });
});

describe('Exclusive Numeric Boundaries', () => {
  test('rejects value equal to minimum when exclusiveMinimum is true', () => {
    const schema = createNumericSchemaWithValidations({ format: 'int32', minimum: 10, exclusiveMinimum: true });
    expect(schema.safeParse(10).success).toBe(false);
    expect(schema.safeParse(11).success).toBe(true);
  });
  test('rejects value equal to maximum when exclusiveMaximum is true', () => {
    const schema = createNumericSchemaWithValidations({ format: 'int32', maximum: 100, exclusiveMaximum: true });
    expect(schema.safeParse(100).success).toBe(false);
    expect(schema.safeParse(99).success).toBe(true);
  });
});

describe('Create Numeric Schema', () => {
  test('valid parsing for int32 schema', () => {
    const schema = createNumericSchema('int32');
    const result = schema.safeParse(50);
    expect(result.success).toBe(true);
  });

  test('invalid parsing for int32 schema with string input', () => {
    const schema = createNumericSchema('int32');
    const result = schema.safeParse("20");
    expect(result.success).toBe(false);
  });
}); 