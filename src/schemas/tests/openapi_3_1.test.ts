import { validateOpenAPI } from '../validator';
import { describe, test, expect } from '@jest/globals';

describe('OpenAPI 3.1 Validation', () => {
  test('validates a basic 3.1 openapi spec with webhooks', () => {
    const spec3_1 = {
      openapi: '3.1.0',
      info: { title: 'Test API 3.1', version: '1.0.0' },
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
      webhooks: {
        // webhooks must be an object with *keys* that are the webhook paths
        '/onData': {
          post: { responses: { '200': { description: 'OK' } } }
        }
      }
    };

    const result = validateOpenAPI(spec3_1);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
    // If your doc had references, check result.resolvedRefs here
  });

  test('validates a 3.1 spec with component references in webhooks', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Webhooks Example', version: '1.0.0' },
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
      paths: {},
      components: {
        schemas: { 
          Payload: { 
            type: 'object',
            properties: { 
              msg: { type: 'string' } 
            } 
          } 
        }
      },
      webhooks: {
        onEvent: {
          post: {
            operationId: 'handleEvent',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Payload' }
                }
              }
            },
            responses: {
              '200': { 
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { 
                      type: 'object',
                      properties: {
                        status: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.resolvedRefs).toContain('#/components/schemas/Payload');
  });
});

describe('OpenAPI 3.1 Specific Features', () => {
  test('validates jsonSchemaDialect field', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
      paths: {}
    };
    
    const result = validateOpenAPI(spec);
    expect(result.valid).toBe(true);
  });

  test('rejects invalid jsonSchemaDialect URLs', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      jsonSchemaDialect: 'not-a-url',
      paths: {}
    };
    
    const result = validateOpenAPI(spec);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates webhook operation parameters', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
      paths: {},
      webhooks: {
        onEvent: {
          post: {
            operationId: 'handleEvent',
            parameters: [
              {
                name: 'trace-id',
                in: 'header',
                required: true,
                schema: { type: 'string' }
              }
            ],
            responses: { 
              '200': { 
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { 
                      type: 'object',
                      properties: {
                        status: { type: 'string' }
                      }
                    }
                  }
                }
              } 
            }
          }
        }
      }
    };
    
    const result = validateOpenAPI(spec);
    expect(result.valid).toBe(true);
  });

  test('validates webhook with references', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
      paths: {},
      components: {
        schemas: {
          Event: { 
            type: 'object',
            properties: {
              id: { type: 'string' }
            }
          }
        }
      },
      webhooks: {
        onEvent: {
          post: {
            operationId: 'handleEvent',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Event' }
                }
              }
            },
            responses: {
              '200': { 
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { 
                      type: 'object',
                      properties: {
                        status: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.resolvedRefs).toContain('#/components/schemas/Event');
  });
});
