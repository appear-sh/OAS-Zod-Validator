import { validateOpenAPI } from '../../index.js';
import { z } from 'zod';

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