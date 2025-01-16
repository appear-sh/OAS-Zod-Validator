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

  test('validates valid OpenAPI 3.1 YAML', () => {
    const yaml = `
      openapi: 3.1.0
      info:
        title: Test API
        version: 1.0.0
      jsonSchemaDialect: https://spec.openapis.org/oas/3.1/dialect/base
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

  test('handles invalid YAML syntax', () => {
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
    const yaml = 'just a string';
    const result = validateFromYaml(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates YAML with references', () => {
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

  test('handles empty YAML string', () => {
    const result = validateFromYaml('');
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('handles null YAML parsing result', () => {
    const yaml = 'null';
    const result = validateFromYaml(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});