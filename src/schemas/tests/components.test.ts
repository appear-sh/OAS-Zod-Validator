import { ComponentsObject } from '../components';
import { z } from 'zod';
import { describe, test, expect } from '@jest/globals';

describe('Components Object Validation', () => {
  test('validates a complete components object', () => {
    const components = {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
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
      },
      parameters: {
        skipParam: {
          name: 'skip',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 0
          }
        }
      },
      examples: {
        user: {
          value: {
            name: "John Doe",
            email: "john@example.com"
          }
        }
      },
      requestBodies: {
        UserBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        }
      }
    };

    expect(() => ComponentsObject.parse(components)).not.toThrow();
  });

  test('validates component naming convention', () => {
    const invalidComponents = {
      schemas: {
        'Invalid Name': { // Contains space
          type: 'object'
        }
      }
    };

    expect(() => ComponentsObject.parse(invalidComponents)).toThrow();
  });

  test('validates example object constraints', () => {
    const invalidExample = {
      examples: {
        test: {
          value: { test: true },
          externalValue: 'https://example.com/test.json' // Can't have both value and externalValue
        }
      }
    };

    expect(() => ComponentsObject.parse(invalidExample)).toThrow();
  });

  test('validates link object constraints', () => {
    const invalidLink = {
      links: {
        testLink: {
          operationRef: '#/paths/~1users/get',
          operationId: 'getUsers' // Can't have both operationRef and operationId
        }
      }
    };

    expect(() => ComponentsObject.parse(invalidLink)).toThrow();
  });

  test('validates external URLs', () => {
    const components = {
      examples: {
        test: {
          externalValue: 'https://example.com/test.json'
        }
      }
    };

    const invalidComponents = {
      examples: {
        test: {
          externalValue: 'not-a-url'
        }
      }
    };

    expect(() => ComponentsObject.parse(components)).not.toThrow();
    expect(() => ComponentsObject.parse(invalidComponents)).toThrow();
  });

  test('requires at least one component', () => {
    const emptyComponents = {};

    expect(() => ComponentsObject.parse(emptyComponents)).toThrow(
      "Components object must have at least one property"
    );
  });

  test('validates parameter objects', () => {
    const components = {
      parameters: {
        pathParam: {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        },
        queryParam: {
          name: 'filter',
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      }
    };

    expect(() => ComponentsObject.parse(components)).not.toThrow();
  });

  test('validates header objects', () => {
    const components = {
      headers: {
        'X-Rate-Limit': {
          description: 'Rate limit header',
          schema: {
            type: 'integer'
          }
        }
      }
    };

    expect(() => ComponentsObject.parse(components)).not.toThrow();
  });

  test('validates reference objects', () => {
    const components = {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' }
          }
        },
        Response: {
          $ref: '#/components/schemas/Error'
        }
      }
    };

    expect(() => ComponentsObject.parse(components)).not.toThrow();
  });
});
