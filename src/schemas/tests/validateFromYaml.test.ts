import { validateFromYaml } from '../../utils/validateFromYaml';
import { describe, test, expect } from '@jest/globals';

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
    
    const result = validateFromYaml(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('handles non-object YAML content', () => {
    const inputs = [
      'just a string',
      '42',
      'true',
      '[]',
      'null'
    ];
    
    inputs.forEach(yaml => {
      const result = validateFromYaml(yaml);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
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
      undefined,
      null
    ];
    
    inputs.forEach(input => {
      const result = validateFromYaml(input as string);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
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
    
    const result = validateFromYaml(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
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
      const result = validateFromYaml(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
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
    
    // Test with different option combinations
    const results = [
      validateFromYaml(yaml, { allowFutureOASVersions: true, strict: true }),
      validateFromYaml(yaml, { allowFutureOASVersions: true }),
      validateFromYaml(yaml, { strict: true }),
      validateFromYaml(yaml, {})
    ];

    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(true);
    expect(results[2].valid).toBe(false);
    expect(results[3].valid).toBe(false);
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
      const result = validateFromYaml(yaml);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  test('provides specific error messages for different error types', () => {
    // Test non-string error message
    const numberInput = 42;
    const result1 = validateFromYaml(numberInput as unknown as string);
    expect(result1.errors?.errors[0].message).toBe('Input must be a string');

    // Test YAML parsing error message
    const invalidYaml = ']invalid[';
    const result2 = validateFromYaml(invalidYaml);
    expect(result2.errors?.errors[0].message).toMatch(/end of the stream or a document separator is expected/);

    // Test custom error handling
    const arrayYaml = '- item1\n- item2';
    const result3 = validateFromYaml(arrayYaml);
    expect(result3.errors?.errors[0].message).toBe('YAML must contain an object');
  });
});