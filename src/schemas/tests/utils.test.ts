import { validateOpenAPI } from '../validator.js';
import { describe, test, expect } from 'vitest';
import yaml from 'js-yaml';

describe('YAML Validation', () => {
  test('validates yaml string', () => {
    const yamlStr = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const doc = yaml.load(yamlStr);
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(true);
  });
});

describe('Reference Target Verification', () => {
  test('verifies valid references', () => {
    const doc = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                $ref: '#/components/responses/Success'
              }
            }
          }
        }
      },
      components: {
        responses: {
          Success: {
            description: 'Successful response'
          }
        }
      }
    };
    
    const result = validateOpenAPI(doc, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.resolvedRefs).toContain('#/components/responses/Success');
  });

  test('catches invalid references', () => {
    const doc = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                $ref: '#/components/responses/NonExistent'
              }
            }
          }
        }
      }
    };
    
    const result = validateOpenAPI(doc, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('Reference Target Verification Error Handling', () => {
  test('handles circular references', () => {
    const doc = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          A: { $ref: '#/components/schemas/B' },
          B: { $ref: '#/components/schemas/A' }
        }
      }
    };
    
    const result = validateOpenAPI(doc, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('handles deeply nested references', () => {
    const doc = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Deep: {
            type: 'object',
            required: ['nested'],
            properties: {
              nested: {
                type: 'object',
                required: ['ref'],
                properties: {
                  ref: { 
                    $ref: '#/components/schemas/Target'
                  }
                }
              }
            }
          },
          Target: { 
            type: 'string',
            description: 'A target string'
          }
        }
      }
    };
    
    const result = validateOpenAPI(doc, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.resolvedRefs).toContain('#/components/schemas/Target');
  });
});
