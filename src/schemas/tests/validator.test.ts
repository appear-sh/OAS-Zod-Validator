import { validateOpenAPI } from '../validator';
import { describe, test, expect } from '@jest/globals';

describe('OpenAPI Validator', () => {
  test('validates a basic valid OpenAPI spec', () => {
    const validSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    };

    const result = validateOpenAPI(validSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('catches invalid OpenAPI spec', () => {
    const invalidSpec = {
      // Missing required 'openapi' field
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    };

    const result = validateOpenAPI(invalidSpec);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates security schemes correctly', () => {
    const specWithSecurity = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            name: 'X-API-KEY',
            in: 'header'
          }
        }
      }
    };

    const result = validateOpenAPI(specWithSecurity);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates request bodies correctly', () => {
    const specWithRequestBody = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(specWithRequestBody);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates responses correctly', () => {
    const specWithResponse = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Bad request',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' }
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

    const result = validateOpenAPI(specWithResponse);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('catches invalid request body format', () => {
    const invalidRequestBody = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          post: {
            requestBody: {
              // Missing required 'content' field
              required: true
            }
          }
        }
      }
    };

    const result = validateOpenAPI(invalidRequestBody);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});