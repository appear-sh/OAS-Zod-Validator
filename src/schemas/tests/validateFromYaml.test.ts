import { validateFromYaml } from '../../utils/validateFromYaml.js';
import { describe, test, expect } from '@jest/globals';
import { YAMLParseError, SchemaValidationError } from '../../errors/index.js';

describe('YAML Validation', () => {
  test('validates valid OpenAPI 3.0 YAML', () => {
    const yaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths:
        /test:
          get:
            responses:
              '200':
                description: OK
    `;
    
    const result = validateFromYaml(yaml);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('handles malformed YAML', () => {
    const yaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths:
        /test:
          get:
            responses:
              '200':
                description: OK
            invalid-indent
    `;
    
    // Now errors are thrown, not returned in result
    expect(() => validateFromYaml(yaml)).toThrow(YAMLParseError);
    
    try {
      validateFromYaml(yaml);
    } catch (error) {
      expect(error).toBeInstanceOf(YAMLParseError);
      if (error instanceof YAMLParseError) {
        expect(error.code).toBe('INVALID_YAML');
        expect(error.message).toContain('Failed to parse YAML/JSON');
      }
    }
  });

  test('handles non-object YAML content', () => {
    const inputs = [
      'just a string',
      '42',
      'true',
      '[]',
      'null'
    ];
    
    inputs.forEach(input => {
      expect(() => validateFromYaml(input)).toThrow(SchemaValidationError);
    });
    
    // Test specific error attributes
    try {
      validateFromYaml('just a string');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaValidationError);
      if (error instanceof SchemaValidationError) {
        expect(error.code).toBe('SCHEMA_VALIDATION');
        expect(error.message).toContain('OpenAPI object');
        expect(error.context).toBeDefined();
      }
    }
  });

  test('handles invalid input types', () => {
    const numberInput = 42;
    
    expect(() => {
      validateFromYaml(numberInput as unknown as string);
    }).toThrow(SchemaValidationError);
    
    try {
      validateFromYaml(numberInput as unknown as string);
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaValidationError);
      if (error instanceof SchemaValidationError) {
        expect(error.code).toBe('SCHEMA_VALIDATION');
        expect(error.message).toBe('Input must be a string');
        expect(error.context?.inputType).toBe('number');
      }
    }
  });

  test('validates YAML with references and options', () => {
    const yaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths:
        /test:
          get:
            responses:
              '200':
                $ref: '#/components/responses/Success'
      components:
        responses:
          Success:
            description: Successful response
    `;
    
    const result = validateFromYaml(yaml, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('handles empty or invalid input', () => {
    const inputs = [
      '',
      ' ',
      '\n',
    ];
    
    inputs.forEach(input => {
      expect(() => validateFromYaml(input)).toThrow(SchemaValidationError);
    });
    
    // Special cases for null/undefined that should be handled separately
    expect(() => validateFromYaml(null as unknown as string)).toThrow(SchemaValidationError);
    expect(() => validateFromYaml(undefined as unknown as string)).toThrow(SchemaValidationError);
  });

  test('validates YAML with future OpenAPI versions', () => {
    const yaml = `
      openapi: 3.2.0
      info:
        title: Future API
        version: 1.0.0
      paths: {}
    `;
    
    const result = validateFromYaml(yaml, { allowFutureOASVersions: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('handles YAML parsing errors', () => {
    const invalidYaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths:
        *invalid-anchor
        /test: {}
    `;
    
    expect(() => validateFromYaml(invalidYaml)).toThrow(YAMLParseError);
    
    try {
      validateFromYaml(invalidYaml);
    } catch (error) {
      expect(error).toBeInstanceOf(YAMLParseError);
      if (error instanceof YAMLParseError) {
        expect(error.code).toBe('INVALID_YAML');
        expect(error.message).toContain('invalid-anchor');
      }
    }
  });

  test('handles non-string inputs', () => {
    const inputs = [
      undefined,
      null,
      123,
      {},
      [],
      true
    ];
    
    inputs.forEach(input => {
      // @ts-expect-error Testing invalid input types
      expect(() => validateFromYaml(input)).toThrow(SchemaValidationError);
    });
  });

  test('validates YAML with validation options', () => {
    const yaml = `
      openapi: 3.2.0
      info:
        title: Future API
        version: 1.0.0
      paths: {}
    `;
    
    // With allowFutureOASVersions, it should pass
    const result1 = validateFromYaml(yaml, { allowFutureOASVersions: true, strict: true });
    const result2 = validateFromYaml(yaml, { allowFutureOASVersions: true });
    
    expect(result1.valid).toBe(true);
    expect(result2.valid).toBe(true);
    
    // Without allowFutureOASVersions, it should return an invalid result
    const result3 = validateFromYaml(yaml, { strict: true });
    const result4 = validateFromYaml(yaml, {});
    
    expect(result3.valid).toBe(false);
    expect(result3.errors).toBeDefined();
    expect(result4.valid).toBe(false);
    expect(result4.errors).toBeDefined();
  });

  test('handles complex YAML parsing errors', () => {
    const invalidYamls = [
      // Duplicate keys
      `
        openapi: 3.0.0
        openapi: 3.1.0
        info:
          title: Test
          version: 1.0.0
      `,
      // Invalid indentation
      `
        openapi: 3.0.0
        info:
         title: Test
           version: 1.0.0
      `,
      // Invalid tag
      `
        !invalid
        openapi: 3.0.0
      `
    ];

    invalidYamls.forEach(yaml => {
      expect(() => validateFromYaml(yaml)).toThrow();
    });
  });

  test('provides specific error messages for different error types', () => {
    // Test non-string error message
    const numberInput = 42;
    expect(() => validateFromYaml(numberInput as unknown as string))
      .toThrow('Input must be a string');

    // Test YAML parsing error message
    const invalidYaml = ']invalid[';
    expect(() => validateFromYaml(invalidYaml))
      .toThrow(/Failed to parse YAML\/JSON/);

    // Test custom error handling
    const arrayYaml = '- item1\n- item2';
    expect(() => validateFromYaml(arrayYaml))
      .toThrow('YAML must contain an OpenAPI object');
  });
});