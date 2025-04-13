import { ComponentsObject } from '../components.js';
import { describe, test, expect } from 'vitest';

describe('Components Object Validation', () => {
  test('validates a complete components object', () => {
    const components = {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
      parameters: {
        skipParam: {
          name: 'skip',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      examples: {
        user: {
          value: {
            id: 1,
            name: 'Test User',
          },
        },
      },
      requestBodies: {
        UserBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      headers: {
        'X-Rate-Limit': {
          description: 'Rate limit header',
          schema: {
            type: 'integer',
          },
        },
      },
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
      },
      links: {
        UserComments: {
          operationId: 'getUserComments',
          parameters: {
            userId: '$response.body#/id',
          },
        },
      },
      callbacks: {
        myWebhook: {
          '{$request.body#/callbackUrl}': {
            post: {
              requestBody: {
                $ref: '#/components/requestBodies/WebhookEvent',
              },
            },
          },
        },
      },
    };

    expect(() => ComponentsObject.parse(components)).not.toThrow();
  });

  test('validates empty components object', () => {
    const components = {
      schemas: {},
    };
    expect(() => ComponentsObject.parse(components)).not.toThrow();
  });

  test('validates partial components object', () => {
    const partialComponents = {
      schemas: {
        Simple: { type: 'string' },
      },
    };
    expect(() => ComponentsObject.parse(partialComponents)).not.toThrow();
  });
});
