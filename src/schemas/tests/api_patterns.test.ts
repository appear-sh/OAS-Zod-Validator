import { validateOpenAPI } from '../validator.js';
import { describe, test, expect } from 'vitest';
import { OpenAPISpec } from '../types.js';

describe('API Design Patterns', () => {
  test('validates bulk operations pattern', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'API with Bulk Operations', version: '1.0.0' },
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
                          required: ['op', 'path'],
                          properties: {
                            op: { type: 'string', enum: ['create', 'update', 'delete'] },
                            path: { type: 'string' },
                            value: { type: 'object', additionalProperties: true }
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

  test('validates pagination pattern', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'API with Pagination', version: '1.0.0' },
      paths: {
        '/resources': {
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

    const result = validateOpenAPI(spec);
    expect(result.valid).toBe(true);
  });
});