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

  test('validates complete path object with parameters', () => {
    const specWithPaths = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users/{id}': {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          get: {
            summary: 'Get user by ID',
            parameters: [
              {
                name: 'fields',
                in: 'query',
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              '200': {
                description: 'Success'
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(specWithPaths);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates server objects', () => {
    const specWithServers = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server',
          variables: {
            port: {
              default: '443',
              enum: ['443', '8443']
            }
          }
        },
        {
          url: 'https://staging.example.com/v1',
          description: 'Staging server'
        }
      ],
      paths: {}
    };

    const result = validateOpenAPI(specWithServers);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates complete info object', () => {
    const specWithFullInfo = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API with full info object',
        termsOfService: 'https://example.com/terms',
        contact: {
          name: 'API Support',
          url: 'https://example.com/support',
          email: 'support@example.com'
        },
        license: {
          name: 'Apache 2.0',
          url: 'https://www.apache.org/licenses/LICENSE-2.0'
        }
      },
      paths: {}
    };

    const result = validateOpenAPI(specWithFullInfo);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates external documentation', () => {
    const specWithExternalDocs = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
      externalDocs: {
        description: 'Find more info here',
        url: 'https://example.com/docs'
      },
      tags: [
        {
          name: 'users',
          description: 'User operations',
          externalDocs: {
            url: 'https://example.com/docs/users'
          }
        }
      ]
    };

    const result = validateOpenAPI(specWithExternalDocs);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('catches invalid openapi version format', () => {
    const invalidVersionSpec = {
      openapi: '4.0.0', // Invalid version, must start with 3
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {}
    };

    const result = validateOpenAPI(invalidVersionSpec);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates references correctly', () => {
    const specWithRefs = {
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
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            },
            responses: {
              '200': {
                $ref: '#/components/responses/SuccessResponse'
              }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        },
        responses: {
          SuccessResponse: {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(specWithRefs);
    expect(result.valid).toBe(true);
    expect(result.resolvedRefs).toBeDefined();
    expect(result.resolvedRefs).toContain('#/components/schemas/User');
    expect(result.resolvedRefs).toContain('#/components/responses/SuccessResponse');
  });
});