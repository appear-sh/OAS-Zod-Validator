import { describe, test, expect } from 'vitest';
import { validateOpenAPI } from '../validator.js';

describe('OpenAPI 3.1 compatibility with 3.2-only features', () => {
  test('rejects examples.dataValue in 3.1.x', () => {
    const doc = {
      openapi: '3.1.1',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/ex': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    examples: { a: { dataValue: { id: 1 } } },
                  },
                },
              },
            },
          },
        },
      },
    };
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(false);
  });

  test('rejects query operation method in 3.1.x', () => {
    const doc = {
      openapi: '3.1.1',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/q': {
          // 3.2-only
          query: { responses: { '200': { description: 'OK' } } },
        },
      },
    } as any;
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(false);
  });

  test('rejects additionalOperations in 3.1.x', () => {
    const doc = {
      openapi: '3.1.1',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/x': {
          // 3.2-only
          additionalOperations: {
            FOO: { responses: { default: { description: 'x' } } },
          },
        },
      },
    } as any;
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(false);
  });

  test('rejects parameter in: querystring in 3.1.x', () => {
    const doc = {
      openapi: '3.1.1',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/t': {
          get: {
            parameters: [
              {
                name: 'q',
                in: 'querystring',
                content: { 'application/json': {} },
              },
            ],
            responses: { default: { description: 'x' } },
          },
        },
      },
    } as any;
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(false);
  });
});
