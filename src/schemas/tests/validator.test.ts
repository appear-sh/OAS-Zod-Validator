import { validateOpenAPI } from '../validator.js';
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

describe('API Pattern Error Handling', () => {
  test('handles invalid bulk operation schema', () => {
    const invalidSpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/resources/bulk': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['operations'],
                    properties: {
                      operations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          // Completely invalid operation object
                          properties: {
                            op: { 
                              type: 'string',
                              enum: ['invalid'] // Invalid enum value
                            },
                            // Missing required path property
                            value: 'not-an-object' // Invalid value type
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Bulk operation results',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        results: {
                          type: 'string' // Invalid type, should be array
                        }
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

    const result = validateOpenAPI(invalidSpec, { 
      strict: true // Enable strict validation
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      const issues = result.errors.issues;
      console.log('Validation issues:', JSON.stringify(issues, null, 2));
      expect(issues.length).toBeGreaterThan(0);
    }
  });

  test('handles missing content type in bulk operation', () => {
    const invalidSpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/resources/bulk': {
          post: {
            requestBody: {
              required: true,
              // Missing application/json content type
              content: {
                'text/plain': {
                  schema: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(invalidSpec);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('handles missing schema in bulk operation', () => {
    const invalidSpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/resources/bulk': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  // Missing schema
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(invalidSpec);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('Validator Coverage', () => {
  test('validates pagination with headers', () => {
    const specWithPagination = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/items': {
          get: {
            parameters: [
              {
                name: 'page',
                in: 'query',
                schema: { type: 'integer', minimum: 1 }
              },
              {
                name: 'per_page',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100 }
              },
              {
                name: 'sort',
                in: 'query',
                schema: { type: 'string', enum: ['asc', 'desc'] }
              }
            ],
            responses: {
              '200': {
                description: 'Paginated results',
                headers: {
                  'X-Total-Count': {
                    description: 'Total number of resources',
                    schema: { type: 'integer' }
                  },
                  'Link': {
                    description: 'Pagination links',
                    schema: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(specWithPagination);
    if (!result.valid) {
      console.log('Pagination validation errors:', JSON.stringify(result.errors?.issues, null, 2));
    }
    expect(result.valid).toBe(true);
  });

  test('handles reference resolution errors', () => {
    const specWithCircularRef = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/A'
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
          A: { 
            type: 'object',
            properties: {
              b: { $ref: '#/components/schemas/B' }
            }
          },
          B: { 
            type: 'object',
            properties: {
              a: { $ref: '#/components/schemas/A' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(specWithCircularRef, { 
      strict: true,
      strictRules: {
        requireRateLimitHeaders: true
      }
    });
    if (result.valid) {
      console.log('Reference resolution should have failed');
    }
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('handles custom validation rules', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                headers: {} // Missing rate limit headers
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, {
      strict: true,
      strictRules: {
        requireRateLimitHeaders: true
      }
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('Real World API Scenarios', () => {
  test('validates e-commerce API patterns', () => {
    const ecommerceSpec = {
      openapi: '3.0.0',
      info: {
        title: 'E-Commerce API',
        version: '1.0.0',
        description: 'API for managing products, orders, and customers'
      },
      servers: [
        { url: 'https://api.example.com/v1' }
      ],
      paths: {
        '/products': {
          get: {
            summary: 'List products',
            parameters: [
              {
                name: 'page',
                in: 'query',
                schema: { type: 'integer', minimum: 1 }
              },
              {
                name: 'per_page',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100 }
              },
              {
                name: 'category',
                in: 'query',
                schema: { type: 'string' }
              },
              {
                name: 'sort',
                in: 'query',
                schema: { 
                  type: 'string',
                  enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc']
                }
              }
            ],
            responses: {
              '200': {
                description: 'List of products',
                headers: {
                  'X-Total-Count': {
                    description: 'Total number of resources',
                    schema: { type: 'integer' }
                  },
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
                },
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['data', 'metadata'],
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Product' }
                        },
                        metadata: { $ref: '#/components/schemas/PaginationMetadata' }
                      }
                    }
                  }
                }
              },
              '400': { 
                description: 'Bad Request',
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
                },
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Error' }
                  }
                }
              },
              '429': { 
                description: 'Too Many Requests',
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
                },
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Error' }
                  }
                }
              }
            }
          }
        },
        '/orders/bulk': {
          post: {
            summary: 'Bulk create orders',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['operations'],
                    properties: {
                      operations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['op', 'path', 'value'],
                          properties: {
                            op: { type: 'string', enum: ['create'] },
                            path: { type: 'string', pattern: '^/orders$' },
                            value: { $ref: '#/components/schemas/OrderInput' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Bulk operation results',
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
                },
                content: {
                  'application/json': {
                    schema: {
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
                              data: { $ref: '#/components/schemas/Order' },
                              error: { $ref: '#/components/schemas/Error' }
                            }
                          }
                        }
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
          Product: {
            type: 'object',
            required: ['id', 'name', 'price'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              price: { type: 'number' },
              category: { type: 'string' },
              metadata: { type: 'object', additionalProperties: true }
            }
          },
          PaginationMetadata: {
            type: 'object',
            required: ['total', 'page', 'per_page'],
            properties: {
              total: { type: 'integer' },
              page: { type: 'integer' },
              per_page: { type: 'integer' },
              total_pages: { type: 'integer' }
            }
          },
          Error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          },
          Order: {
            type: 'object',
            required: ['id', 'status'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string', enum: ['pending', 'completed', 'failed'] }
            }
          },
          OrderInput: {
            type: 'object',
            required: ['products'],
            properties: {
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'quantity'],
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    quantity: { type: 'integer', minimum: 1 }
                  }
                }
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(ecommerceSpec, { 
      strict: true,
      strictRules: { requireRateLimitHeaders: true }
    });
    if (result.errors) {
      const issues = result.errors.issues;
      console.log('Validation issues:', JSON.stringify(issues, null, 2));
    }
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('Reference Validation', () => {
  test('validates reference target existence', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/NonExistentModel'
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
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.issues).toHaveLength(1);
  });

  test('validates nested reference target existence', () => {
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
          }
        }
      },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
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
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.issues).toHaveLength(1);
  });

  test('validates reference in response object', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                $ref: '#/components/responses/SuccessResponse'
              }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.issues).toHaveLength(1);
  });
});

describe('Schema Composition Keywords', () => {
  test('validates oneOf schema composition', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          Pet: {
            oneOf: [
              { $ref: '#/components/schemas/Cat' },
              { $ref: '#/components/schemas/Dog' }
            ]
          },
          Cat: {
            type: 'object',
            required: ['type', 'name'],
            properties: {
              type: { type: 'string', enum: ['cat'] },
              name: { type: 'string' }
            }
          },
          Dog: {
            type: 'object',
            required: ['type', 'name'],
            properties: {
              type: { type: 'string', enum: ['dog'] },
              name: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates allOf schema composition', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          ErrorResponse: {
            allOf: [
              { $ref: '#/components/schemas/BaseError' },
              {
                type: 'object',
                properties: {
                  details: { type: 'string' }
                }
              }
            ]
          },
          BaseError: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates anyOf schema composition', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          Parameter: {
            anyOf: [
              {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['string'] },
                  value: { type: 'string' }
                }
              },
              {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['number'] },
                  value: { type: 'number' }
                }
              }
            ]
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('Discriminator Validation', () => {
  test('validates basic discriminator usage', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          Pet: {
            oneOf: [
              { $ref: '#/components/schemas/Cat' },
              { $ref: '#/components/schemas/Dog' }
            ],
            discriminator: {
              propertyName: 'type'
            }
          },
          Cat: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['cat'] },
              meow: { type: 'boolean' }
            }
          },
          Dog: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['dog'] },
              bark: { type: 'boolean' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates anyOf with discriminator', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          Response: {
            anyOf: [
              { $ref: '#/components/schemas/Success' },
              { $ref: '#/components/schemas/Error' }
            ],
            discriminator: {
              propertyName: 'status'
            }
          },
          Success: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', enum: ['success'] },
              data: { type: 'object' }
            }
          },
          Error: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', enum: ['error'] },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates anyOf with mapped discriminator', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          ApiResponse: {
            anyOf: [
              { $ref: '#/components/schemas/SuccessResponse' },
              { $ref: '#/components/schemas/ErrorResponse' }
            ],
            discriminator: {
              propertyName: 'type',
              mapping: {
                ok: '#/components/schemas/SuccessResponse',
                fail: '#/components/schemas/ErrorResponse'
              }
            }
          },
          SuccessResponse: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['ok'] },
              result: { type: 'object' }
            }
          },
          ErrorResponse: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['fail'] },
              error: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates discriminator with explicit mapping', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          Vehicle: {
            oneOf: [
              { $ref: '#/components/schemas/Car' },
              { $ref: '#/components/schemas/Bike' }
            ],
            discriminator: {
              propertyName: 'type',
              mapping: {
                car: '#/components/schemas/Car',
                bike: '#/components/schemas/Bike'
              }
            }
          },
          Car: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['car'] }
            }
          },
          Bike: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['bike'] }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('rejects discriminator with missing required property', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          Shape: {
            oneOf: [
              { $ref: '#/components/schemas/Circle' },
              { $ref: '#/components/schemas/Square' }
            ],
            discriminator: {
              propertyName: 'type'
            }
          },
          Circle: {
            type: 'object',
            // Missing required discriminator property
            properties: {
              type: { type: 'string', enum: ['circle'] },
              radius: { type: 'number' }
            }
          },
          Square: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['square'] },
              sideLength: { type: 'number' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('rejects discriminator with invalid mapping reference', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          Animal: {
            oneOf: [
              { $ref: '#/components/schemas/Lion' }
            ],
            discriminator: {
              propertyName: 'type',
              mapping: {
                lion: '#/components/schemas/Lion',
                tiger: '#/components/schemas/Tiger' // Non-existent schema
              }
            }
          },
          Lion: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['lion'] }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  describe('Invalid Discriminator Configurations', () => {
    test('rejects discriminator with missing property in schema', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Pet: {
              oneOf: [
                { $ref: '#/components/schemas/Cat' },
                { $ref: '#/components/schemas/Dog' }
              ],
              discriminator: {
                propertyName: 'petKind' // property doesn't exist in schemas
              }
            },
            Cat: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['cat'] }
              }
            },
            Dog: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['dog'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects discriminator with invalid mapping references', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Shape: {
              oneOf: [
                { $ref: '#/components/schemas/Circle' }
              ],
              discriminator: {
                propertyName: 'type',
                mapping: {
                  circle: '#/components/schemas/Circle',
                  square: '#/components/schemas/Square' // non-existent schema
                }
              }
            },
            Circle: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['circle'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects discriminator with non-required property', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Vehicle: {
              oneOf: [
                { $ref: '#/components/schemas/Car' },
                { $ref: '#/components/schemas/Bike' }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            Car: {
              type: 'object',
              // type is not in required array
              properties: {
                type: { type: 'string', enum: ['car'] }
              }
            },
            Bike: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['bike'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects discriminator with invalid mapping format', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Result: {
              oneOf: [
                { $ref: '#/components/schemas/Success' }
              ],
              discriminator: {
                propertyName: 'status',
                mapping: {
                  success: 'invalid-reference-format' // should be #/components/...
                }
              }
            },
            Success: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['success'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Mixed Invalid Configurations', () => {
    test('rejects mixed oneOf/anyOf with inconsistent discriminator', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Response: {
              oneOf: [
                { $ref: '#/components/schemas/Success' },
                { 
                  anyOf: [
                    { $ref: '#/components/schemas/ErrorA' },
                    { $ref: '#/components/schemas/ErrorB' }
                  ]
                }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            Success: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['success'] }
              }
            },
            ErrorA: {
              type: 'object',
              required: ['kind'], // different discriminator property
              properties: {
                kind: { type: 'string', enum: ['error-a'] }
              }
            },
            ErrorB: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['error-b'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects mixed required and optional discriminators', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Animal: {
              anyOf: [
                { $ref: '#/components/schemas/Cat' },
                { $ref: '#/components/schemas/Dog' }
              ],
              discriminator: {
                propertyName: 'species'
              }
            },
            Cat: {
              type: 'object',
              required: ['species'], // required here
              properties: {
                species: { type: 'string', enum: ['cat'] }
              }
            },
            Dog: {
              type: 'object',
              properties: { // not required here
                species: { type: 'string', enum: ['dog'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects mixed valid and invalid mapping references', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Shape: {
              oneOf: [
                { $ref: '#/components/schemas/Circle' },
                { $ref: '#/components/schemas/Square' }
              ],
              discriminator: {
                propertyName: 'type',
                mapping: {
                  circle: '#/components/schemas/Circle', // valid
                  square: 'invalid-reference', // invalid
                  triangle: '#/components/schemas/Triangle' // non-existent
                }
              }
            },
            Circle: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['circle'] }
              }
            },
            Square: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['square'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects nested discriminators with mixed validity', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Entity: {
              oneOf: [
                { $ref: '#/components/schemas/Person' },
                { $ref: '#/components/schemas/Organization' }
              ],
              discriminator: {
                propertyName: 'entityType'
              }
            },
            Person: {
              type: 'object',
              required: ['entityType', 'type'],
              properties: {
                entityType: { type: 'string', enum: ['person'] },
                type: { type: 'string' },
                details: {
                  oneOf: [
                    { $ref: '#/components/schemas/Employee' },
                    { $ref: '#/components/schemas/Customer' }
                  ],
                  discriminator: {
                    propertyName: 'type' // conflicts with parent property
                  }
                }
              }
            },
            Organization: {
              type: 'object',
              required: ['entityType'],
              properties: {
                entityType: { type: 'string', enum: ['org'] }
              }
            },
            Employee: {
              type: 'object',
              properties: { // missing required discriminator
                type: { type: 'string', enum: ['employee'] }
              }
            },
            Customer: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['customer'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Edge Cases in Mixed Configurations', () => {
    test('handles empty discriminator mapping', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Mixed: {
              oneOf: [
                { $ref: '#/components/schemas/TypeA' },
                { $ref: '#/components/schemas/TypeB' }
              ],
              discriminator: {
                propertyName: 'type',
                mapping: {} // empty mapping
              }
            },
            TypeA: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['a'] }
              }
            },
            TypeB: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['b'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('handles circular references in discriminator mapping', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Parent: {
              oneOf: [
                { $ref: '#/components/schemas/Child' }
              ],
              discriminator: {
                propertyName: 'type',
                mapping: {
                  child: '#/components/schemas/Child',
                  parent: '#/components/schemas/Parent' // circular reference
                }
              }
            },
            Child: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['child'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('handles discriminator with null enum values', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            NullableType: {
              oneOf: [
                { $ref: '#/components/schemas/ValidType' },
                { $ref: '#/components/schemas/NullType' }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            ValidType: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['valid'] }
              }
            },
            NullType: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: [null] } // invalid enum value
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('handles discriminator with duplicate enum values', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Status: {
              oneOf: [
                { $ref: '#/components/schemas/Success' },
                { $ref: '#/components/schemas/SuccessAlias' }
              ],
              discriminator: {
                propertyName: 'status'
              }
            },
            Success: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['success'] }
              }
            },
            SuccessAlias: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['success'] } // duplicate enum value
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('handles discriminator with missing enum values', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Result: {
              oneOf: [
                { $ref: '#/components/schemas/Success' },
                { $ref: '#/components/schemas/Error' }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            Success: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string' } // missing enum
              }
            },
            Error: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['error'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Maximum Depth Scenarios', () => {
    test('handles deeply nested discriminator chains', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Level1: {
              oneOf: [
                { $ref: '#/components/schemas/Level2A' },
                { $ref: '#/components/schemas/Level2B' }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            Level2A: {
              type: 'object',
              required: ['type', 'next'],
              properties: {
                type: { type: 'string', enum: ['level2a'] },
                next: {
                  oneOf: [
                    { $ref: '#/components/schemas/Level3A' },
                    { $ref: '#/components/schemas/Level3B' }
                  ],
                  discriminator: {
                    propertyName: 'type'
                  }
                }
              }
            },
            Level2B: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['level2b'] }
              }
            },
            Level3A: {
              type: 'object',
              required: ['type', 'next'],
              properties: {
                type: { type: 'string', enum: ['level3a'] },
                next: {
                  oneOf: [
                    { $ref: '#/components/schemas/Level4A' },
                    { $ref: '#/components/schemas/Level4B' }
                  ],
                  discriminator: {
                    propertyName: 'type'
                  }
                }
              }
            },
            Level3B: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['level3b'] }
              }
            },
            Level4A: {
              type: 'object',
              required: ['type', 'next'],
              properties: {
                type: { type: 'string', enum: ['level4a'] },
                next: {
                  oneOf: [
                    { $ref: '#/components/schemas/Level5A' },
                    { $ref: '#/components/schemas/Level5B' }
                  ],
                  discriminator: {
                    propertyName: 'type'
                  }
                }
              }
            },
            Level4B: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['level4b'] }
              }
            },
            Level5A: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['level5a'] }
              }
            },
            Level5B: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['level5b'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('handles deep branching discriminator trees', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Root: {
              oneOf: [
                { $ref: '#/components/schemas/BranchA' },
                { $ref: '#/components/schemas/BranchB' },
                { $ref: '#/components/schemas/BranchC' }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            BranchA: {
              type: 'object',
              required: ['type', 'subBranch'],
              properties: {
                type: { type: 'string', enum: ['branch-a'] },
                subBranch: {
                  oneOf: [
                    { $ref: '#/components/schemas/SubBranchA1' },
                    { $ref: '#/components/schemas/SubBranchA2' }
                  ],
                  discriminator: {
                    propertyName: 'subType'
                  }
                }
              }
            },
            BranchB: {
              type: 'object',
              required: ['type', 'subBranch'],
              properties: {
                type: { type: 'string', enum: ['branch-b'] },
                subBranch: {
                  oneOf: [
                    { $ref: '#/components/schemas/SubBranchB1' },
                    { $ref: '#/components/schemas/SubBranchB2' }
                  ],
                  discriminator: {
                    propertyName: 'subType'
                  }
                }
              }
            },
            BranchC: {
              type: 'object',
              required: ['type', 'subBranch'],
              properties: {
                type: { type: 'string', enum: ['branch-c'] },
                subBranch: {
                  oneOf: [
                    { $ref: '#/components/schemas/SubBranchC1' },
                    { $ref: '#/components/schemas/SubBranchC2' }
                  ],
                  discriminator: {
                    propertyName: 'subType'
                  }
                }
              }
            },
            // Pre-define all sub-branch schemas
            SubBranchA1: {
              type: 'object',
              required: ['subType'],
              properties: {
                subType: { type: 'string', enum: ['sub-a1'] }
              }
            },
            SubBranchA2: {
              type: 'object',
              required: ['subType'],
              properties: {
                subType: { type: 'string', enum: ['sub-a2'] }
              }
            },
            SubBranchB1: {
              type: 'object',
              required: ['subType'],
              properties: {
                subType: { type: 'string', enum: ['sub-b1'] }
              }
            },
            SubBranchB2: {
              type: 'object',
              required: ['subType'],
              properties: {
                subType: { type: 'string', enum: ['sub-b2'] }
              }
            },
            SubBranchC1: {
              type: 'object',
              required: ['subType'],
              properties: {
                subType: { type: 'string', enum: ['sub-c1'] }
              }
            },
            SubBranchC2: {
              type: 'object',
              required: ['subType'],
              properties: {
                subType: { type: 'string', enum: ['sub-c2'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('handles asymmetric branch patterns', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Root: {
              oneOf: [
                { $ref: '#/components/schemas/DeepBranch' },
                { $ref: '#/components/schemas/WideBranch' },
                { $ref: '#/components/schemas/SimpleBranch' }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            // Deep nested branch
            DeepBranch: {
              type: 'object',
              required: ['type', 'next'],
              properties: {
                type: { type: 'string', enum: ['deep'] },
                next: {
                  oneOf: [
                    { $ref: '#/components/schemas/DeepLevel2' }
                  ],
                  discriminator: {
                    propertyName: 'level'
                  }
                }
              }
            },
            DeepLevel2: {
              type: 'object',
              required: ['level', 'next'],
              properties: {
                level: { type: 'string', enum: ['level2'] },
                next: {
                  oneOf: [
                    { $ref: '#/components/schemas/DeepLevel3' }
                  ],
                  discriminator: {
                    propertyName: 'level'
                  }
                }
              }
            },
            DeepLevel3: {
              type: 'object',
              required: ['level'],
              properties: {
                level: { type: 'string', enum: ['level3'] }
              }
            },
            // Wide branch with multiple options
            WideBranch: {
              type: 'object',
              required: ['type', 'options'],
              properties: {
                type: { type: 'string', enum: ['wide'] },
                options: {
                  oneOf: [
                    { $ref: '#/components/schemas/OptionA' },
                    { $ref: '#/components/schemas/OptionB' },
                    { $ref: '#/components/schemas/OptionC' },
                    { $ref: '#/components/schemas/OptionD' }
                  ],
                  discriminator: {
                    propertyName: 'option'
                  }
                }
              }
            },
            OptionA: {
              type: 'object',
              required: ['option'],
              properties: {
                option: { type: 'string', enum: ['a'] }
              }
            },
            OptionB: {
              type: 'object',
              required: ['option'],
              properties: {
                option: { type: 'string', enum: ['b'] }
              }
            },
            OptionC: {
              type: 'object',
              required: ['option'],
              properties: {
                option: { type: 'string', enum: ['c'] }
              }
            },
            OptionD: {
              type: 'object',
              required: ['option'],
              properties: {
                option: { type: 'string', enum: ['d'] }
              }
            },
            // Simple single-level branch
            SimpleBranch: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['simple'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('handles mixed composition patterns', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            Root: {
              oneOf: [
                { $ref: '#/components/schemas/MixedBranchA' },
                { $ref: '#/components/schemas/MixedBranchB' }
              ],
              discriminator: {
                propertyName: 'type'
              }
            },
            MixedBranchA: {
              type: 'object',
              required: ['type', 'data'],
              properties: {
                type: { type: 'string', enum: ['mixed-a'] },
                data: {
                  anyOf: [
                    { $ref: '#/components/schemas/DataOption1' },
                    { $ref: '#/components/schemas/DataOption2' }
                  ],
                  discriminator: {
                    propertyName: 'dataType'
                  }
                }
              }
            },
            MixedBranchB: {
              type: 'object',
              required: ['type', 'data'],
              properties: {
                type: { type: 'string', enum: ['mixed-b'] },
                data: {
                  oneOf: [
                    { $ref: '#/components/schemas/DataOption3' },
                    { $ref: '#/components/schemas/DataOption4' }
                  ],
                  discriminator: {
                    propertyName: 'dataType'
                  }
                }
              }
            },
            DataOption1: {
              type: 'object',
              required: ['dataType'],
              properties: {
                dataType: { type: 'string', enum: ['option1'] }
              }
            },
            DataOption2: {
              type: 'object',
              required: ['dataType'],
              properties: {
                dataType: { type: 'string', enum: ['option2'] }
              }
            },
            DataOption3: {
              type: 'object',
              required: ['dataType'],
              properties: {
                dataType: { type: 'string', enum: ['option3'] }
              }
            },
            DataOption4: {
              type: 'object',
              required: ['dataType'],
              properties: {
                dataType: { type: 'string', enum: ['option4'] }
              }
            }
          }
        }
      };

      const result = validateOpenAPI(spec, { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});

describe('Enhanced Error Reporting', () => {
  test('validates discriminator property existence', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: {
            oneOf: [
              { $ref: '#/components/schemas/Cat' },
              { $ref: '#/components/schemas/Dog' }
            ],
            discriminator: {
              propertyName: 'petKind' // Intentionally wrong property
            }
          },
          Cat: {
            type: 'object',
            required: ['petType'],
            properties: {
              petType: { type: 'string', enum: ['cat'] }
            }
          },
          Dog: {
            type: 'object',
            required: ['petType'],
            properties: {
              petType: { type: 'string', enum: ['dog'] }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      expect(result.errors.issues[0]).toMatchObject({
        code: 'invalid_union',
        path: ['components', 'schemas', 'Pet'],
        message: 'Invalid input'
      });
    }
  });

  test('validates reference format in discriminator mapping', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Result: {
            oneOf: [
              { $ref: '#/components/schemas/Success' }
            ],
            discriminator: {
              propertyName: 'status',
              mapping: {
                success: 'invalid-reference'
              }
            }
          },
          Success: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', enum: ['success'] }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      expect(result.errors.issues[0]).toMatchObject({
        code: 'invalid_union',
        path: ['components', 'schemas', 'Result'],
        message: 'Invalid input'
      });
    }
  });

  test('validates required properties in referenced schemas', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Parent: {
            oneOf: [
              { $ref: '#/components/schemas/Child' }
            ],
            discriminator: {
              propertyName: 'type'
            }
          },
          Child: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['child'] }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      expect(result.errors.issues[0]).toMatchObject({
        code: 'invalid_union',
        path: ['components', 'schemas', 'Parent'],
        message: 'Invalid input'
      });
    }
  });

  test('validates multiple schema constraints', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Mixed: {
            oneOf: [
              { $ref: '#/components/schemas/TypeA' },
              { $ref: '#/components/schemas/TypeB' }
            ],
            discriminator: {
              propertyName: 'type'
            }
          },
          TypeA: {
            type: 'object',
            properties: {
              type: { type: 'string' }
            }
          },
          TypeB: {
            type: 'object',
            properties: {
              type: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      expect(result.errors.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_union',
          path: ['components', 'schemas', 'Mixed'],
          message: 'Invalid input'
        })
      );
    }
  });

  test('validates discriminator with anyOf composition', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Response: {
            anyOf: [
              { $ref: '#/components/schemas/Success' },
              { $ref: '#/components/schemas/Error' }
            ],
            discriminator: {
              propertyName: 'type'
            }
          },
          Success: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['success'] },
              data: { type: 'object' }
            }
          },
          Error: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['error'] },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      expect(result.errors.issues[0]).toMatchObject({
        code: 'invalid_union',
        path: ['components', 'schemas', 'Response'],
        message: 'Invalid input'
      });
    }
  });

  test('validates discriminator with allOf composition', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          ErrorResponse: {
            allOf: [
              { $ref: '#/components/schemas/BaseError' },
              {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['validation', 'system'] },
                  details: { type: 'string' }
                }
              }
            ],
            discriminator: {
              propertyName: 'type'
            }
          },
          BaseError: {
            type: 'object',
            required: ['code'],
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      expect(result.errors.issues[0]).toMatchObject({
        code: 'invalid_union',
        path: ['components', 'schemas', 'ErrorResponse'],
        message: 'Invalid input'
      });
    }
  });

  test('validates mixed composition with discriminator', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          ApiResponse: {
            oneOf: [
              {
                anyOf: [
                  { $ref: '#/components/schemas/SuccessA' },
                  { $ref: '#/components/schemas/SuccessB' }
                ]
              },
              { $ref: '#/components/schemas/Error' }
            ],
            discriminator: {
              propertyName: 'type'
            }
          },
          SuccessA: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['success-a'] },
              dataA: { type: 'string' }
            }
          },
          SuccessB: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['success-b'] },
              dataB: { type: 'string' }
            }
          },
          Error: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['error'] },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (result.errors) {
      expect(result.errors.issues[0]).toMatchObject({
        code: 'invalid_union',
        path: ['components', 'schemas', 'ApiResponse'],
        message: 'Invalid input'
      });
    }
  });
});