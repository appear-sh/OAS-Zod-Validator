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
                    },
                    required: ['name', 'email']
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created successfully'
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
          get: {
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

    const result = validateOpenAPI(specWithRefs, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.resolvedRefs).toBeDefined();
    expect(result.resolvedRefs).toContain('#/components/schemas/User');
    expect(result.resolvedRefs).toContain('#/components/responses/SuccessResponse');
  });

  test('allows future versions with allowFutureOASVersions flag', () => {
    const futureSpec = {
      openapi: '3.2.0',
      info: {
        title: 'Future API',
        version: '1.0.0'
      },
      paths: {}
    };

    const result = validateOpenAPI(futureSpec, { allowFutureOASVersions: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('resolves nested references', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              profile: { $ref: '#/components/schemas/Profile' }
            }
          },
          Profile: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          }
        }
      },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/User' }
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
    expect(result.resolvedRefs).toContain('#/components/schemas/User');
    expect(result.resolvedRefs).toContain('#/components/schemas/Profile');
  });
});

describe('OpenAPI Version Detection', () => {
  test('handles future 3.x versions with allowFutureOASVersions', () => {
    const futureSpec = {
      openapi: '3.2.0',
      info: { title: 'Future API', version: '1.0.0' },
      paths: {}
    };

    const result = validateOpenAPI(futureSpec, { allowFutureOASVersions: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('rejects future versions without allowFutureOASVersions', () => {
    const futureSpec = {
      openapi: '3.2.0',
      info: { title: 'Future API', version: '1.0.0' },
      paths: {}
    };

    const result = validateOpenAPI(futureSpec);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('rejects invalid document formats', () => {
    expect(validateOpenAPI(null).valid).toBe(false);
    expect(validateOpenAPI(undefined).valid).toBe(false);
    expect(validateOpenAPI({}).valid).toBe(false);
    expect(validateOpenAPI({ openapi: 123 }).valid).toBe(false);
  });
});

describe('Validator Error Handling', () => {
  test('handles non-object inputs gracefully', () => {
    const inputs = [null, undefined, 42, 'string', true, []];
    
    inputs.forEach(input => {
      const result = validateOpenAPI(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  test('handles malformed OpenAPI objects', () => {
    const malformed = {
      openapi: '3.0.0',
      // Missing required 'info' field
      paths: {
        '/test': 'not-an-object' // Invalid path item
      }
    };
    
    const result = validateOpenAPI(malformed);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('handles errors in strict mode', () => {
    const specWithBadRef = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                $ref: '#/components/schemas/NonExistent'
              }
            }
          }
        }
      }
    };
    
    const result = validateOpenAPI(specWithBadRef, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('Version Detection', () => {
  test('handles version 3.0.x correctly', () => {
    ['3.0.0', '3.0.1', '3.0.3'].forEach(version => {
      const doc = {
        openapi: version,
        info: { 
          title: 'Test API', 
          version: '1.0.0' 
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: { 
                        type: 'object',
                        properties: {
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            Test: {
              type: 'object',
              properties: {
                id: { type: 'string' }
              }
            }
          }
        }
      };
      const result = validateOpenAPI(doc);
      expect(result.valid).toBe(true);
    });
  });

  test('handles version 3.1.x correctly', () => {
    ['3.1.0', '3.1.1'].forEach(version => {
      const doc = {
        openapi: version,
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base'
      };
      const result = validateOpenAPI(doc);
      expect(result.valid).toBe(true);
    });
  });

  test('rejects invalid versions', () => {
    ['2.0', '4.0.0', '3.2.0', 'invalid'].forEach(version => {
      const doc = {
        openapi: version,
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      };
      const result = validateOpenAPI(doc, { allowFutureOASVersions: false });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});

describe('Rate Limit Header Validation', () => {
  test('validates rate limit headers in referenced responses', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': { $ref: '#/components/responses/StandardResponse' }
            }
          }
        }
      },
      components: {
        responses: {
          StandardResponse: {
            description: 'Standard response',
            headers: {
              'X-RateLimit-Limit': {
                description: 'Rate limit per hour',
                schema: { type: 'integer' }
              },
              'X-RateLimit-Remaining': {
                description: 'Remaining requests',
                schema: { type: 'integer' }
              },
              'X-RateLimit-Reset': {
                description: 'Time until reset',
                schema: { type: 'integer' }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { 
      strict: true,
      strictRules: { requireRateLimitHeaders: true }
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
});

describe('Validator Edge Cases', () => {
  test('validates complex nested patterns', () => {
    // Use the exact schema structure from api_patterns.ts but as raw objects
    const bulkRequestShape = {
      type: 'object',
      required: ['operations'],
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['op', 'path'],
            properties: {
              op: { type: 'string', enum: ['create', 'update', 'delete'] },
              path: { type: 'string' },
              value: { type: 'object', additionalProperties: true }
            }
          }
        }
      }
    };

    const bulkResponseShape = {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            required: ['status', 'path'],
            properties: {
              status: { type: 'integer' },
              path: { type: 'string' },
              error: { type: 'string' }
            }
          }
        }
      }
    };

    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/resources/bulk': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: bulkRequestShape
                }
              }
            },
            responses: {
              '200': {
                description: 'Bulk operation results',
                content: {
                  'application/json': {
                    schema: bulkResponseShape
                  }
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec);
    if (!result.valid) {
      console.log('Validation errors:', JSON.stringify(result.errors?.issues, null, 2));
    }
    expect(result.valid).toBe(true);
  });
});