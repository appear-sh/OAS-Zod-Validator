import { validateOpenAPI } from '../validator.js';
import { describe, test, expect } from 'vitest';
import type { OpenAPISpec } from '../types.js';

describe('Pagination Standards', () => {
  test('validates standard REST pagination', () => {
    const specWithPagination: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'API with Pagination',
        version: '1.0.0',
      },
      paths: {
        '/products': {
          get: {
            parameters: [
              {
                name: 'page',
                in: 'query' as const,
                schema: {
                  type: 'integer' as const,
                  minimum: 1,
                },
                description: 'Page number',
              },
              {
                name: 'limit',
                in: 'query' as const,
                schema: {
                  type: 'integer' as const,
                  minimum: 1,
                  maximum: 100,
                  default: 20,
                },
                description: 'Number of items per page',
              },
            ],
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object' as const,
                      required: ['items', 'pagination'],
                      properties: {
                        items: {
                          type: 'array' as const,
                          items: { $ref: '#/components/schemas/Product' },
                        },
                        pagination: {
                          type: 'object' as const,
                          required: ['total', 'pages'],
                          properties: {
                            total: {
                              type: 'integer' as const,
                              description: 'Total number of items',
                            },
                            pages: {
                              type: 'integer' as const,
                              description: 'Total number of pages',
                            },
                            next: {
                              type: 'string' as const,
                              format: 'uri',
                              description:
                                'URL for the next page (if available)',
                            },
                            prev: {
                              type: 'string' as const,
                              format: 'uri',
                              description:
                                'URL for the previous page (if available)',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = validateOpenAPI(specWithPagination);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates cursor-based pagination', () => {
    const specWithCursorPagination: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'API with Cursor Pagination',
        version: '1.0.0',
      },
      paths: {
        '/products': {
          get: {
            parameters: [
              {
                name: 'cursor',
                in: 'query' as const,
                schema: {
                  type: 'string' as const,
                },
                description: 'Cursor for pagination',
              },
              {
                name: 'limit',
                in: 'query' as const,
                schema: {
                  type: 'integer' as const,
                  minimum: 1,
                  maximum: 100,
                  default: 20,
                },
              },
            ],
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object' as const,
                      required: ['items', 'pagination'],
                      properties: {
                        items: {
                          type: 'array' as const,
                          items: { $ref: '#/components/schemas/Product' },
                        },
                        pagination: {
                          type: 'object' as const,
                          required: ['next_cursor'],
                          properties: {
                            next_cursor: {
                              type: 'string' as const,
                              description:
                                'Cursor for the next page (null if no more pages)',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = validateOpenAPI(specWithCursorPagination);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates missing pagination parameters', () => {
    const specWithoutPagination: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'API without Pagination',
        version: '1.0.0',
      },
      paths: {
        '/products': {
          get: {
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array' as const,
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = validateOpenAPI(specWithoutPagination, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
